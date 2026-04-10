/**
 * CRC 校验计算器 — 支持 CRC-8, CRC-16/Modbus, CRC-16/CCITT, CRC-16/XMODEM, CRC-32
 */
(function () {
  // CRC 算法参数定义
  const ALGORITHMS = {
    crc8: {
      name: 'CRC-8',
      poly: 0x07, init: 0x00, xorOut: 0x00, refIn: false, refOut: false, width: 8
    },
    crc16_modbus: {
      name: 'CRC-16/Modbus',
      poly: 0x8005, init: 0xFFFF, xorOut: 0x0000, refIn: true, refOut: true, width: 16
    },
    crc16_ccitt: {
      name: 'CRC-16/CCITT-FALSE',
      poly: 0x1021, init: 0xFFFF, xorOut: 0x0000, refIn: false, refOut: false, width: 16
    },
    crc16_xmodem: {
      name: 'CRC-16/XMODEM',
      poly: 0x1021, init: 0x0000, xorOut: 0x0000, refIn: false, refOut: false, width: 16
    },
    crc32: {
      name: 'CRC-32',
      poly: 0x04C11DB7, init: 0xFFFFFFFF, xorOut: 0xFFFFFFFF, refIn: true, refOut: true, width: 32
    }
  };

  // 位反转
  function reflect(value, width) {
    let result = 0;
    for (let i = 0; i < width; i++) {
      if (value & (1 << i)) {
        result |= 1 << (width - 1 - i);
      }
    }
    return result >>> 0;
  }

  // 通用 CRC 计算（查表法生成表 + 计算）
  function calcCRC(data, algo) {
    const { poly, init, xorOut, refIn, refOut, width } = algo;
    const mask = width === 32 ? 0xFFFFFFFF : (1 << width) - 1;
    const topBit = width === 32 ? 0x80000000 : (1 << (width - 1));

    // 生成查找表
    const table = new Array(256);
    for (let i = 0; i < 256; i++) {
      let crc = (width <= 8) ? (i << (width - 8)) : (i << (width - 8));
      if (width > 8) crc = i << (width - 8);
      else crc = i;

      for (let j = 0; j < 8; j++) {
        if (crc & topBit) {
          crc = ((crc << 1) ^ poly) & mask;
        } else {
          crc = (crc << 1) & mask;
        }
      }
      table[i] = crc >>> 0;
    }

    let crc = init & mask;

    for (let i = 0; i < data.length; i++) {
      let byte = data[i];
      if (refIn) byte = reflect(byte, 8);

      if (width <= 8) {
        crc = (table[(crc ^ byte) & 0xFF]) & mask;
      } else {
        const index = ((crc >>> (width - 8)) ^ byte) & 0xFF;
        crc = ((crc << 8) ^ table[index]) & mask;
      }
    }

    if (refOut) crc = reflect(crc, width);
    crc = (crc ^ xorOut) & mask;
    return crc >>> 0;
  }

  // UI 元素
  const algoSelect = document.getElementById('crc-algo');
  const inputMode = document.getElementById('crc-input-mode');
  const dataInput = document.getElementById('crc-data');
  const resultHex = document.getElementById('crc-result-hex');
  const resultDec = document.getElementById('crc-result-dec');
  const paramsDiv = document.getElementById('crc-params');
  const btnCalc = document.getElementById('btn-calc');
  const btnClear = document.getElementById('btn-crc-clear');

  // 更新算法参数显示
  function updateParams() {
    const algo = ALGORITHMS[algoSelect.value];
    const hexWidth = algo.width / 4;
    paramsDiv.innerHTML = `
      算法: ${algo.name} | 
      多项式: 0x${algo.poly.toString(16).toUpperCase().padStart(hexWidth, '0')} | 
      初始值: 0x${algo.init.toString(16).toUpperCase().padStart(hexWidth, '0')} | 
      异或值: 0x${algo.xorOut.toString(16).toUpperCase().padStart(hexWidth, '0')} | 
      输入反转: ${algo.refIn ? '是' : '否'} | 
      输出反转: ${algo.refOut ? '是' : '否'}
    `;
  }

  // 解析输入数据为字节数组
  function parseInput() {
    const mode = inputMode.value;
    const raw = dataInput.value.trim();
    if (!raw) return null;

    if (mode === 'hex') {
      const tokens = raw.split(/\s+/);
      const bytes = [];
      for (const t of tokens) {
        const n = parseInt(t, 16);
        if (isNaN(n) || n < 0 || n > 255) return null;
        bytes.push(n);
      }
      return bytes;
    } else {
      // ASCII 模式
      return Array.from(new TextEncoder().encode(raw));
    }
  }

  // 计算并显示结果
  function calculate() {
    const data = parseInput();
    if (!data || data.length === 0) {
      resultHex.value = '请输入有效数据';
      resultDec.value = '';
      return;
    }

    const algo = ALGORITHMS[algoSelect.value];
    const crc = calcCRC(data, algo);
    const hexWidth = algo.width / 4;

    resultHex.value = '0x' + crc.toString(16).toUpperCase().padStart(hexWidth, '0');
    resultDec.value = crc.toString(10);
  }

  // 切换输入模式时更新 placeholder
  inputMode.addEventListener('change', () => {
    dataInput.placeholder = inputMode.value === 'hex'
      ? 'Hex 模式: 01 03 00 00 00 0A'
      : 'ASCII 模式: Hello World';
  });

  algoSelect.addEventListener('change', () => {
    updateParams();
    // 自动重新计算
    if (dataInput.value.trim()) calculate();
  });

  btnCalc.addEventListener('click', calculate);

  // 回车也可以触发计算
  dataInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calculate();
  });

  btnClear.addEventListener('click', () => {
    dataInput.value = '';
    resultHex.value = '';
    resultDec.value = '';
  });

  // 初始化参数显示
  updateParams();
})();
