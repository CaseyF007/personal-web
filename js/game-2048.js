/**
 * 2048 游戏核心逻辑
 */
(function () {
  const SIZE = 4;
  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('best2048') || '0');
  let gameOver = false;

  // 颜色映射 — 使用网站设计系统配色
  const TILE_COLORS = {
    0:    { bg: 'rgba(30,41,59,0.5)', color: 'transparent' },
    2:    { bg: '#1e3a5f', color: '#93c5fd' },
    4:    { bg: '#1e3a8a', color: '#93c5fd' },
    8:    { bg: '#2563eb', color: '#ffffff' },
    16:   { bg: '#3b82f6', color: '#ffffff' },
    32:   { bg: '#6366f1', color: '#ffffff' },
    64:   { bg: '#8b5cf6', color: '#ffffff' },
    128:  { bg: '#a855f7', color: '#ffffff' },
    256:  { bg: '#d946ef', color: '#ffffff' },
    512:  { bg: '#ec4899', color: '#ffffff' },
    1024: { bg: '#f43f5e', color: '#ffffff' },
    2048: { bg: '#f59e0b', color: '#ffffff' },
  };

  const gridEl = document.getElementById('grid-2048');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best-score');
  const overlayEl = document.getElementById('game-over-overlay');
  const finalScoreEl = document.getElementById('final-score');

  // 初始化
  function init() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    gameOver = false;
    overlayEl.classList.remove('active');
    addRandomTile();
    addRandomTile();
    render();
    updateScore();
  }

  // 添加随机方块（90% 概率是 2，10% 是 4）
  function addRandomTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  // 渲染网格
  function render() {
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = grid[r][c];
        const tile = document.createElement('div');
        tile.className = 'tile-2048';
        const colors = TILE_COLORS[val] || { bg: '#f59e0b', color: '#fff' };
        tile.style.background = colors.bg;
        tile.style.color = colors.color;
        tile.textContent = val || '';

        // 大数字缩小字号
        if (val >= 1024) tile.style.fontSize = 'var(--fs-lg)';
        else if (val >= 128) tile.style.fontSize = 'var(--fs-xl)';

        gridEl.appendChild(tile);
      }
    }
  }

  function updateScore() {
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('best2048', bestScore);
    }
    bestEl.textContent = bestScore;
  }

  // 滑动逻辑：将一行压缩合并
  function slideRow(row) {
    let arr = row.filter(v => v !== 0);
    let merged = [];
    let points = 0;

    for (let i = 0; i < arr.length; i++) {
      if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
        const val = arr[i] * 2;
        merged.push(val);
        points += val;
        i++; // 跳过下一个
      } else {
        merged.push(arr[i]);
      }
    }

    while (merged.length < SIZE) merged.push(0);
    return { result: merged, points };
  }

  // 移动方向处理
  function move(direction) {
    if (gameOver) return;

    let moved = false;
    let totalPoints = 0;

    if (direction === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const { result, points } = slideRow(grid[r]);
        if (grid[r].join(',') !== result.join(',')) moved = true;
        grid[r] = result;
        totalPoints += points;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const reversed = [...grid[r]].reverse();
        const { result, points } = slideRow(reversed);
        const final = result.reverse();
        if (grid[r].join(',') !== final.join(',')) moved = true;
        grid[r] = final;
        totalPoints += points;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        const { result, points } = slideRow(col);
        if (col.join(',') !== result.join(',')) moved = true;
        for (let r = 0; r < SIZE; r++) grid[r][c] = result[r];
        totalPoints += points;
      }
    } else if (direction === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
        const { result, points } = slideRow(col);
        const final = result.reverse();
        const origCol = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        if (origCol.join(',') !== final.join(',')) moved = true;
        for (let r = 0; r < SIZE; r++) grid[r][c] = final[r];
        totalPoints += points;
      }
    }

    if (moved) {
      score += totalPoints;
      addRandomTile();
      render();
      updateScore();

      if (checkGameOver()) {
        gameOver = true;
        finalScoreEl.textContent = score;
        overlayEl.classList.add('active');
      }
    }
  }

  // 检查是否游戏结束
  function checkGameOver() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return false;
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  // 键盘事件
  document.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) {
      e.preventDefault();
      move(map[e.key]);
    }
  });

  // 触摸事件
  let touchStartX = 0, touchStartY = 0;
  gridEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  gridEl.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return; // 忽略微小移动

    if (absDx > absDy) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
  }, { passive: true });

  // 重新开始按钮
  document.getElementById('btn-restart').addEventListener('click', init);
  document.getElementById('btn-restart-overlay').addEventListener('click', init);

  // 启动游戏
  bestEl.textContent = bestScore;
  init();
})();
