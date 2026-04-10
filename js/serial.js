/**
 * 串口在线调试 — Web Serial API 封装
 * 修复：数据接收显示、设备断开重连处理
 */
(function () {
  const noticeEl = document.getElementById('compat-notice');
  const btnConnectEl = document.getElementById('btn-connect');

  // 检测浏览器兼容性（Web Serial API 需要安全上下文 HTTPS）
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

  let port = null;
  let reader = null;
  let writer = null;
  let isConnected = false;
  let rxByteCount = 0;
  let txByteCount = 0;
  let keepReading = false; // 控制读取循环的标志

  // UI 元素
  const btnSend = document.getElementById('btn-send');
  const btnClearRx = document.getElementById('btn-clear-rx');
  const txInput = document.getElementById('tx-input');
  const rxTerminal = document.getElementById('rx-terminal');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const rxCount = document.getElementById('rx-count');
  const txCount = document.getElementById('tx-count');

  // 连接 / 断开
  btnConnectEl.addEventListener('click', async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  });

  async function connect() {
    try {
      port = await navigator.serial.requestPort();
      const baudRate = parseInt(document.getElementById('baudRate').value);
      const dataBits = parseInt(document.getElementById('dataBits').value);
      const stopBits = parseInt(document.getElementById('stopBits').value);
      const parity = document.getElementById('parity').value;

      await port.open({ baudRate, dataBits, stopBits, parity });

      isConnected = true;
      keepReading = true;
      updateStatus(true);
      btnSend.disabled = false;

      appendToTerminal(`--- 串口已连接 (${baudRate}bps) ---`, 'sys');

      // 监听设备断开事件
      port.addEventListener('disconnect', onPortDisconnect);

      // 启动读取循环
      readLoop();
    } catch (err) {
      if (err.name === 'NotFoundError') {
        // 用户取消了串口选择
        return;
      }
      appendToTerminal(`连接失败: ${err.message}`, 'err');
    }
  }

  // 设备意外断开（如 USB 拔出、MCU Reset）
  function onPortDisconnect() {
    appendToTerminal('--- 设备已断开（USB 拔出或设备重启） ---', 'err');
    cleanupConnection();
  }

  // 清理连接资源（不尝试关闭端口，因为端口可能已失效）
  function cleanupConnection() {
    keepReading = false;

    if (reader) {
      try { reader.releaseLock(); } catch (e) { /* 忽略 */ }
      reader = null;
    }
    if (writer) {
      try { writer.releaseLock(); } catch (e) { /* 忽略 */ }
      writer = null;
    }

    isConnected = false;
    updateStatus(false);
    btnSend.disabled = true;
    port = null;
  }

  // 主动断开连接
  async function disconnect() {
    keepReading = false;

    // 先取消正在进行的读取
    if (reader) {
      try {
        await reader.cancel();
      } catch (e) { /* 忽略 */ }
      // cancel() 完成后，readLoop 中的 read() 会返回 { done: true }
      // releaseLock 在 readLoop 的 finally 中处理
    }

    // 释放写入器
    if (writer) {
      try {
        writer.releaseLock();
      } catch (e) { /* 忽略 */ }
      writer = null;
    }

    // 关闭端口
    if (port) {
      try {
        port.removeEventListener('disconnect', onPortDisconnect);
        await port.close();
      } catch (e) { /* 忽略 */ }
      port = null;
    }

    isConnected = false;
    updateStatus(false);
    btnSend.disabled = true;
    appendToTerminal('--- 串口已断开 ---', 'sys');
  }

  // 持续读取串口数据
  async function readLoop() {
    while (keepReading && port && port.readable) {
      try {
        reader = port.readable.getReader();
      } catch (err) {
        appendToTerminal(`无法获取读取器: ${err.message}`, 'err');
        break;
      }

      try {
        while (keepReading) {
          const { value, done } = await reader.read();
          if (done) {
            // reader 被取消（disconnect 调用 reader.cancel()）
            break;
          }
          if (value && value.length > 0) {
            rxByteCount += value.length;
            rxCount.textContent = rxByteCount;

            const displayMode = document.getElementById('rx-display-mode').value;
            let text;
            if (displayMode === 'hex') {
              text = Array.from(value).map(b =>
                b.toString(16).toUpperCase().padStart(2, '0')
              ).join(' ');
            } else {
              text = new TextDecoder().decode(value);
            }
            appendToTerminal(text, 'rx');
          }
        }
      } catch (err) {
        // 设备断开或读取出错
        if (keepReading) {
          appendToTerminal(`读取错误: ${err.message}`, 'err');
        }
      } finally {
        // 确保释放读取器锁
        try {
          reader.releaseLock();
        } catch (e) { /* 忽略 */ }
        reader = null;
      }
    }

    // 如果是意外退出循环（非主动断开），清理状态
    if (keepReading && isConnected) {
      appendToTerminal('--- 数据流已中断，请重新连接 ---', 'err');
      cleanupConnection();
    }
  }

  // 发送数据
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

    // 每次发送时获取新的 writer，避免锁冲突
    let w;
    try {
      w = port.writable.getWriter();
      await w.write(data);
      txByteCount += data.length;
      txCount.textContent = txByteCount;

      const displayText = txMode === 'hex'
        ? Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
        : raw;
      appendToTerminal(displayText, 'tx');
    } catch (err) {
      appendToTerminal(`发送失败: ${err.message}`, 'err');
    } finally {
      if (w) {
        try { w.releaseLock(); } catch (e) { /* 忽略 */ }
      }
    }
  }

  // 向终端追加内容
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

    // 对文本内容进行 HTML 转义
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    rxTerminal.innerHTML += prefix + typeLabel + escaped + '\n';

    if (autoScroll) {
      rxTerminal.scrollTop = rxTerminal.scrollHeight;
    }
  }

  // 更新状态显示
  function updateStatus(connected) {
    statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
    statusText.textContent = connected ? '已连接' : '未连接';
    statusText.style.color = connected ? '#7ee787' : 'var(--text-tertiary)';
    btnConnectEl.textContent = connected ? '断开' : '连接';
    btnConnectEl.className = connected
      ? 'btn btn-outline btn-sm'
      : 'btn btn-primary btn-sm';
  }

  // 清空接收区
  btnClearRx.addEventListener('click', () => {
    rxTerminal.innerHTML = '';
    rxByteCount = 0;
    txByteCount = 0;
    rxCount.textContent = '0';
    txCount.textContent = '0';
  });

  // 页面卸载时断开连接
  window.addEventListener('beforeunload', () => {
    if (isConnected) disconnect();
  });
})();
