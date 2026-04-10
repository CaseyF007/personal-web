/**
 * 进制转换器 — 实时联动转换 Hex / Dec / Bin / Oct / ASCII
 */
(function () {
  const hexInput = document.getElementById('hex-input');
  const decInput = document.getElementById('dec-input');
  const binInput = document.getElementById('bin-input');
  const octInput = document.getElementById('oct-input');
  const asciiInput = document.getElementById('ascii-input');
  const btnClear = document.getElementById('btn-clear');
  const btnSwap = document.getElementById('btn-swap');

  let uppercase = true;

  /**
   * 将字节数组更新到各输入框（排除当前正在编辑的源）
   * @param {number[]} bytes - 字节数组 (0-255)
   * @param {string} source - 触发源 ID
   */
  function updateFields(bytes, source) {
    if (source !== 'hex-input') {
      hexInput.value = bytes.map(b => {
        const h = b.toString(16).padStart(2, '0');
        return uppercase ? h.toUpperCase() : h;
      }).join(' ');
    }
    if (source !== 'dec-input') {
      decInput.value = bytes.map(b => b.toString(10)).join(' ');
    }
    if (source !== 'bin-input') {
      binInput.value = bytes.map(b => b.toString(2).padStart(8, '0')).join(' ');
    }
    if (source !== 'oct-input') {
      octInput.value = bytes.map(b => b.toString(8).padStart(3, '0')).join(' ');
    }
    if (source !== 'ascii-input') {
      asciiInput.value = bytes.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
    }
  }

  /**
   * 解析空格分隔的字符串为数字数组
   */
  function parseTokens(str, radix) {
    const tokens = str.trim().split(/\s+/).filter(Boolean);
    const bytes = [];
    for (const t of tokens) {
      const n = parseInt(t, radix);
      if (isNaN(n) || n < 0 || n > 255) return null;
      bytes.push(n);
    }
    return bytes;
  }

  // HEX 输入
  hexInput.addEventListener('input', () => {
    const val = hexInput.value.trim();
    if (!val) { clearAll(); return; }
    const bytes = parseTokens(val, 16);
    if (bytes) updateFields(bytes, 'hex-input');
  });

  // DEC 输入
  decInput.addEventListener('input', () => {
    const val = decInput.value.trim();
    if (!val) { clearAll(); return; }
    const bytes = parseTokens(val, 10);
    if (bytes) updateFields(bytes, 'dec-input');
  });

  // BIN 输入
  binInput.addEventListener('input', () => {
    const val = binInput.value.trim();
    if (!val) { clearAll(); return; }
    const bytes = parseTokens(val, 2);
    if (bytes) updateFields(bytes, 'bin-input');
  });

  // OCT 输入
  octInput.addEventListener('input', () => {
    const val = octInput.value.trim();
    if (!val) { clearAll(); return; }
    const bytes = parseTokens(val, 8);
    if (bytes) updateFields(bytes, 'oct-input');
  });

  // ASCII 输入
  asciiInput.addEventListener('input', () => {
    const val = asciiInput.value;
    if (!val) { clearAll(); return; }
    const bytes = [];
    for (let i = 0; i < val.length; i++) {
      const code = val.charCodeAt(i);
      // 处理多字节：只取低 8 位，或按 UTF-8 编码
      if (code <= 0xFF) {
        bytes.push(code);
      } else {
        // 简单处理：使用 TextEncoder 编出 UTF-8 字节
        const encoded = new TextEncoder().encode(val.charAt(i));
        encoded.forEach(b => bytes.push(b));
      }
    }
    updateFields(bytes, 'ascii-input');
  });

  // 清空
  function clearAll() {
    hexInput.value = '';
    decInput.value = '';
    binInput.value = '';
    octInput.value = '';
    asciiInput.value = '';
  }

  btnClear.addEventListener('click', clearAll);

  // 大小写切换
  btnSwap.addEventListener('click', () => {
    uppercase = !uppercase;
    const val = hexInput.value.trim();
    if (val) {
      hexInput.value = uppercase ? val.toUpperCase() : val.toLowerCase();
    }
    btnSwap.textContent = uppercase ? '切换小写' : '切换大写';
  });
})();
