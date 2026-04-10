/**
 * 串口在线调试 — 基于 Chrome 官方 Web Serial API 最佳实践
 * 参考: https://developer.chrome.com/docs/capabilities/serial
 */
(function () {
  const noticeEl = document.getElementById('compat-notice');
  const btnConnectEl = document.getElementById('btn-connect');

  // 检测浏览器兼容性
  if (!('serial' in navigator)) {
    let message;
    if (!window.isSecureContext) {
      message = '<strong>当前为非安全连接（HTTP）</strong><br>' +
        'Web Serial API 需要通过 <strong>HTTPS</strong> 访问才能使用。' +
        '请使用 <code>https://</code> 地址访问此页面，或在本地使用 <code>localhost</code>。';
    } else {
      message = '<strong>浏览器不支持 Web Serial API</strong><br>' +
        '请使用 Chrome 89+ 或 Edge 89+ 浏览器访问此工具。';
    }
    noticeEl.querySelector('div').innerHTML = message;
    noticeEl.style.display = 'flex';
    btnConnectEl.disabled = true;
    return;
  }

  // ===== 状态变量 =====
  let port = null;
  let reader = null;
  let keepReading = false;
  let closedPromise = null;
  let isConnected = false;
  let rxByteCount = 0;
  let txByteCount = 0;

  // ===== UI 元素 =====
  const btnSend = document.getElementById('btn-send');
  const btnClearRx = document.getElementById('btn-clear-rx');
  const txInput = document.getElementById('tx-input');
  const rxTerminal = document.getElementById('rx-terminal');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const rxCountEl = document.getElementById('rx-count');
  const txCountEl = document.getElementById('tx-count');

  // ===== 连接 / 断开 =====
  btnConnectEl.addEventListener('click', async () => {
    if (isConnected) {
      await closePort();
    } else {
      await openPort();
    }
  });

  /**
   * 打开串口
   */
  async function openPort() {
    try {
      port = await navigator.serial.requestPort();
    } catch (err) {
      // 用户取消选择
      return;
    }

    const baudRate = parseInt(document.getElementById('baudRate').value);
    const dataBits = parseInt(document.getElementById('dataBits').value);
    const stopBits = parseInt(document.getElementById('stopBits').value);
    const parity = document.getElementById('parity').value;

    try {
      await port.open({
        baudRate,
        dataBits,
        stopBits,
        parity,
        bufferSize: 8192,
        flowControl: 'none',
      });
    } catch (err) {
      appendToTerminal(`打开串口失败: ${err.message}`, 'err');
      port = null;
      return;
    }

    // 设置 DTR/RTS 信号（部分 MCU 需要 DTR 才会发送数据）
    try {
      await port.setSignals({ dataTerminalReady: true, requestToSend: true });
    } catch (e) {
      // 某些设备不支持信号控制，忽略
    }

    isConnected = true;
    updateStatus(true);
    btnSend.disabled = false;

    appendToTerminal(`--- 已连接 (${baudRate}bps, ${dataBits}${parity[0].toUpperCase()}${stopBits}) ---`, 'sys');

    // 监听设备意外断开
    navigator.serial.addEventListener('disconnect', onDisconnect);

    // 启动读取循环（按 Chrome 官方推荐模式）
    keepReading = true;
    closedPromise = readUntilClosed();
  }

  /**
   * 持续读取，直到主动关闭或发生致命错误
   * 采用 Chrome 官方推荐的双层循环模式：
   * - 外层：处理非致命错误后自动重建 ReadableStream
   * - 内层：持续读取数据
   */
  async function readUntilClosed() {
    while (port && port.readable && keepReading) {
      reader = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // reader.cancel() 被调用，正常退出
            break;
          }
          if (value) {
            handleReceivedData(value);
          }
        }
      } catch (error) {
        // 非致命错误（如 buffer overflow、framing error）
        // 外层循环会自动重建 ReadableStream
        if (keepReading) {
          appendToTerminal(`读取错误: ${error.message}`, 'err');
        }
      } finally {
        reader.releaseLock();
        reader = null;
      }
    }
  }

  /**
   * 接收缓冲区 — 合并短时间内到达的多个 USB chunk
   * USB CDC 会将 MCU 一次发送的数据拆成多个小包，
   * 通过超时合并机制将它们重新拼成完整的一帧。
   */
  let rxBuffer = [];       // 缓冲的字节数组
  let rxFlushTimer = null;  // 合并定时器

  function handleReceivedData(value) {
    rxByteCount += value.length;
    rxCountEl.textContent = rxByteCount;

    // 将数据追加到缓冲区
    rxBuffer.push(...value);

    // 读取用户设置的合并间隔
    const mergeInterval = parseInt(document.getElementById('rx-merge-interval').value) || 50;

    // 如果间隔为 0，立即输出（不合并）
    if (mergeInterval === 0) {
      flushRxBuffer();
      return;
    }

    // 重置定时器 — 如果在间隔内收到新数据，继续等待
    if (rxFlushTimer) {
      clearTimeout(rxFlushTimer);
    }
    rxFlushTimer = setTimeout(flushRxBuffer, mergeInterval);
  }

  /**
   * 将缓冲区数据一次性输出到终端
   */
  function flushRxBuffer() {
    rxFlushTimer = null;
    if (rxBuffer.length === 0) return;

    const bytes = new Uint8Array(rxBuffer);
    rxBuffer = [];

    const displayMode = document.getElementById('rx-display-mode').value;
    let text;
    if (displayMode === 'hex') {
      text = Array.from(bytes)
        .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');
    } else {
      text = new TextDecoder().decode(bytes);
    }
    appendToTerminal(text, 'rx');
  }

  /**
   * 关闭串口（按 Chrome 官方推荐的正确顺序）
   */
  async function closePort() {
    keepReading = false;

    // 先刷新缓冲区中的残余数据
    if (rxFlushTimer) clearTimeout(rxFlushTimer);
    flushRxBuffer();

    // 1. 取消正在进行的读取，让 readUntilClosed 退出
    if (reader) {
      try {
        await reader.cancel();
      } catch (e) { /* 忽略 */ }
    }

    // 2. 等待 readUntilClosed 完全结束
    if (closedPromise) {
      try {
        await closedPromise;
      } catch (e) { /* 忽略 */ }
      closedPromise = null;
    }

    // 3. 释放 DTR 信号（避免某些 MCU 被锁住）
    if (port) {
      try {
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      } catch (e) { /* 忽略 */ }
    }

    // 4. 关闭端口
    if (port) {
      try {
        await port.close();
      } catch (e) { /* 忽略 */ }
      port = null;
    }

    navigator.serial.removeEventListener('disconnect', onDisconnect);

    isConnected = false;
    updateStatus(false);
    btnSend.disabled = true;
    appendToTerminal('--- 已断开 ---', 'sys');
  }

  /**
   * 设备意外断开处理（USB 拔出或 MCU 重启）
   */
  function onDisconnect(event) {
    if (port && event.target === port) {
      keepReading = false;
      // 不调用 port.close()，因为端口已经不可用
      if (reader) {
        try { reader.releaseLock(); } catch (e) { /* 忽略 */ }
        reader = null;
      }
      port = null;
      closedPromise = null;

      navigator.serial.removeEventListener('disconnect', onDisconnect);
      isConnected = false;
      updateStatus(false);
      btnSend.disabled = true;
      appendToTerminal('--- 设备已断开（USB 拔出或设备重启） ---', 'err');
    }
  }

  // ===== 发送数据 =====
  btnSend.addEventListener('click', sendData);
  txInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendData();
  });

  async function sendData() {
    if (!isConnected || !port || !port.writable) return;
    const raw = txInput.value;
    if (!raw) return;

    const txMode = document.getElementById('tx-mode').value;
    const addNewline = document.getElementById('tx-newline').checked;
    let data;

    if (txMode === 'hex') {
      const tokens = raw.trim().split(/\s+/);
      const bytes = [];
      for (const t of tokens) {
        const n = parseInt(t, 16);
        if (isNaN(n) || n < 0 || n > 255) {
          appendToTerminal(`无效的 HEX 数据: ${t}`, 'err');
          return;
        }
        bytes.push(n);
      }
      data = new Uint8Array(bytes);
    } else {
      let str = raw;
      if (addNewline) str += '\r\n';
      data = new TextEncoder().encode(str);
    }

    // 每次发送时获取 writer，用完释放（官方推荐）
    let writer;
    try {
      writer = port.writable.getWriter();
      await writer.write(data);
      txByteCount += data.length;
      txCountEl.textContent = txByteCount;

      const displayText = txMode === 'hex'
        ? Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
        : raw;
      appendToTerminal(displayText, 'tx');
    } catch (err) {
      appendToTerminal(`发送失败: ${err.message}`, 'err');
    } finally {
      if (writer) {
        try { writer.releaseLock(); } catch (e) { /* 忽略 */ }
      }
    }
  }

  // ===== 终端显示 =====
  function appendToTerminal(text, type) {
    const showTimestamp = document.getElementById('rx-timestamp').checked;
    const autoScroll = document.getElementById('rx-autoscroll').checked;

    let prefix = '';
    if (showTimestamp) {
      const now = new Date();
      const ts = now.toTimeString().split(' ')[0] + '.' +
        String(now.getMilliseconds()).padStart(3, '0');
      prefix = `<span class="timestamp">[${ts}]</span> `;
    }

    const typeLabel =
      type === 'tx'  ? '<span class="tx">TX → </span>' :
      type === 'rx'  ? '<span class="rx">RX ← </span>' :
      type === 'err' ? '<span class="err">ERR  </span>' :
                        '<span class="sys">SYS  </span>';

    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    rxTerminal.innerHTML += prefix + typeLabel + escaped + '\n';

    if (autoScroll) {
      rxTerminal.scrollTop = rxTerminal.scrollHeight;
    }
  }

  // ===== 状态 UI =====
  function updateStatus(connected) {
    statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
    statusText.textContent = connected ? '已连接' : '未连接';
    statusText.style.color = connected ? '#7ee787' : 'var(--text-tertiary)';
    btnConnectEl.textContent = connected ? '断开' : '连接';
    btnConnectEl.className = connected
      ? 'btn btn-outline btn-sm'
      : 'btn btn-primary btn-sm';
  }

  // 清空
  btnClearRx.addEventListener('click', () => {
    rxTerminal.innerHTML = '';
    rxByteCount = 0;
    txByteCount = 0;
    rxCountEl.textContent = '0';
    txCountEl.textContent = '0';
    // 清理缓冲区
    if (rxFlushTimer) clearTimeout(rxFlushTimer);
    rxBuffer = [];
  });

  // 页面关闭时断开
  window.addEventListener('beforeunload', () => {
    if (isConnected) {
      keepReading = false;
      if (reader) try { reader.cancel(); } catch (e) {}
      if (port) {
        try { port.setSignals({ dataTerminalReady: false, requestToSend: false }); } catch (e) {}
        try { port.close(); } catch (e) {}
      }
    }
  });
})();
