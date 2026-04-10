/**
 * 串口在线调试 — Web Serial API 封装
 */
(function () {
  // 检测浏览器兼容性
  if (!('serial' in navigator)) {
    document.getElementById('compat-notice').style.display = 'flex';
    document.getElementById('btn-connect').disabled = true;
    return;
  }

  let port = null;
  let reader = null;
  let writer = null;
  let isConnected = false;
  let rxByteCount = 0;
  let txByteCount = 0;

  // UI 元素
  const btnConnect = document.getElementById('btn-connect');
  const btnSend = document.getElementById('btn-send');
  const btnClearRx = document.getElementById('btn-clear-rx');
  const txInput = document.getElementById('tx-input');
  const rxTerminal = document.getElementById('rx-terminal');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const rxCount = document.getElementById('rx-count');
  const txCount = document.getElementById('tx-count');

  // 连接 / 断开
  btnConnect.addEventListener('click', async () => {
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
      updateStatus(true);
      btnSend.disabled = false;

      writer = port.writable.getWriter();

      // 开始读取
      readLoop();

      appendToTerminal('--- 串口已连接 ---', 'sys');
    } catch (err) {
      appendToTerminal(`连接失败: ${err.message}`, 'err');
    }
  }

  async function disconnect() {
    try {
      if (reader) {
        await reader.cancel();
        reader = null;
      }
      if (writer) {
        writer.releaseLock();
        writer = null;
      }
      if (port) {
        await port.close();
        port = null;
      }
    } catch (err) {
      // 忽略关闭错误
    }

    isConnected = false;
    updateStatus(false);
    btnSend.disabled = true;
    appendToTerminal('--- 串口已断开 ---', 'sys');
  }

  // 持续读取串口数据
  async function readLoop() {
    while (port && port.readable) {
      reader = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            rxByteCount += value.length;
            rxCount.textContent = rxByteCount;

            const displayMode = document.getElementById('rx-display-mode').value;
            let text;
            if (displayMode === 'hex') {
              text = Array.from(value).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            } else {
              text = new TextDecoder().decode(value);
            }
            appendToTerminal(text, 'rx');
          }
        }
      } catch (err) {
        if (isConnected) {
          appendToTerminal(`读取错误: ${err.message}`, 'err');
        }
      } finally {
        reader.releaseLock();
        reader = null;
      }
    }
  }

  // 发送数据
  btnSend.addEventListener('click', sendData);
  txInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendData();
  });

  async function sendData() {
    if (!isConnected || !writer) return;
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

    try {
      await writer.write(data);
      txByteCount += data.length;
      txCount.textContent = txByteCount;

      // 在终端显示发送的数据
      const displayText = txMode === 'hex'
        ? Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
        : raw;
      appendToTerminal(displayText, 'tx');
    } catch (err) {
      appendToTerminal(`发送失败: ${err.message}`, 'err');
    }
  }

  // 向终端追加内容
  function appendToTerminal(text, type) {
    const showTimestamp = document.getElementById('rx-timestamp').checked;
    const autoScroll = document.getElementById('rx-autoscroll').checked;

    let prefix = '';
    if (showTimestamp) {
      const now = new Date();
      const ts = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      prefix = `<span class="timestamp">[${ts}]</span> `;
    }

    const typeLabel = type === 'tx' ? '<span class="tx">TX → </span>' :
                      type === 'rx' ? '<span class="rx">RX ← </span>' :
                      type === 'err' ? '<span class="err">ERR  </span>' :
                      '<span class="sys">SYS  </span>';

    // 对文本内容进行 HTML 转义
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
    btnConnect.textContent = connected ? '断开' : '连接';
    btnConnect.className = connected
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
