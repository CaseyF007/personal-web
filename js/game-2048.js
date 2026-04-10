/**
 * 2048 游戏核心逻辑 — 带过渡动画
 * 含排行榜系统（TOP 5）
 */
(function () {
  const SIZE = 4;
  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('best2048') || '0');
  let gameOver = false;

  // 跟踪新增和合并的位置，用于动画
  let newTiles = new Set();
  let mergedTiles = new Set();

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

  // ========== 排行榜系统 ==========
  const LEADERBOARD_KEY = 'leaderboard_2048';
  const MAX_RANK = 5;

  // 从 localStorage 读取排行榜
  function getLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    } catch { return []; }
  }

  // 保存排行榜到 localStorage
  function saveLeaderboard(board) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
  }

  // 检查分数是否能进入排行榜，返回排名位置（1-based），不能进入则返回 -1
  function checkRank(newScore) {
    if (newScore <= 0) return -1;
    const board = getLeaderboard();
    if (board.length < MAX_RANK) return board.filter(e => e.score >= newScore).length + 1;
    if (newScore > board[board.length - 1].score) {
      return board.filter(e => e.score >= newScore).length + 1;
    }
    return -1;
  }

  // 将分数插入排行榜
  function insertScore(newScore) {
    const board = getLeaderboard();
    const entry = {
      score: newScore,
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const trimmed = board.slice(0, MAX_RANK);
    saveLeaderboard(trimmed);
    // 返回此 entry 在排行榜中的索引（0-based）
    return trimmed.findIndex(e => e === entry);
  }

  // 渲染排行榜 UI
  function renderLeaderboard(highlightIndex) {
    const container = document.getElementById('leaderboard-content');
    const board = getLeaderboard();

    if (board.length === 0) {
      container.innerHTML = '<p class="leaderboard-empty">暂无记录，快来挑战吧！</p>';
      return;
    }

    const rankIcons = ['🥇', '🥈', '🥉', '4', '5'];
    let html = `<table class="leaderboard-table">
      <thead><tr><th>排名</th><th>分数</th><th class="date-cell">时间</th></tr></thead><tbody>`;

    board.forEach((entry, i) => {
      const isHighlight = i === highlightIndex;
      html += `<tr${isHighlight ? ' class="highlight"' : ''}>
        <td class="rank-cell">${rankIcons[i] || i + 1}</td>
        <td class="score-cell">${entry.score}</td>
        <td class="date-cell">${entry.date || '-'}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // 显示排名 Toast 提醒
  function showRankToast(rank, finalScore) {
    const toast = document.getElementById('rank-toast');
    const iconEl = document.getElementById('rank-toast-icon');
    const titleEl = document.getElementById('rank-toast-title');
    const detailEl = document.getElementById('rank-toast-detail');

    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
    iconEl.textContent = icons[rank] || '🎉';
    titleEl.textContent = rank <= 3 ? `恭喜获得第 ${rank} 名！` : '恭喜进入排行榜！';
    detailEl.textContent = `得分 ${finalScore} · 排名 #${rank}`;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // 页面加载时渲染排行榜
  renderLeaderboard(-1);
  // ========== 排行榜系统结束 ==========

  // 初始化
  function init() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    gameOver = false;
    newTiles.clear();
    mergedTiles.clear();
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
    newTiles.add(`${r},${c}`);
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

        // 动画 class
        const key = `${r},${c}`;
        if (newTiles.has(key)) {
          tile.classList.add('tile-new');
        }
        if (mergedTiles.has(key)) {
          tile.classList.add('tile-merged');
        }
        // 高数值发光
        if (val >= 512) {
          tile.classList.add('tile-glow');
        }

        gridEl.appendChild(tile);
      }
    }
    // 清除动画标记
    newTiles.clear();
    mergedTiles.clear();
  }

  function updateScore() {
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('best2048', bestScore);
    }
    bestEl.textContent = bestScore;
  }

  // 滑动逻辑：将一行压缩合并，同时追踪合并位置
  function slideRow(row, rowIndex, isVertical, isReverse) {
    let arr = row.filter(v => v !== 0);
    let merged = [];
    let points = 0;
    let mergePositions = [];

    for (let i = 0; i < arr.length; i++) {
      if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
        const val = arr[i] * 2;
        merged.push(val);
        mergePositions.push(merged.length - 1);
        points += val;
        i++; // 跳过下一个
      } else {
        merged.push(arr[i]);
      }
    }

    while (merged.length < SIZE) merged.push(0);
    return { result: merged, points, mergePositions };
  }

  // 移动方向处理
  function move(direction) {
    if (gameOver) return;

    let moved = false;
    let totalPoints = 0;
    mergedTiles.clear();

    if (direction === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const { result, points, mergePositions } = slideRow(grid[r]);
        if (grid[r].join(',') !== result.join(',')) moved = true;
        grid[r] = result;
        totalPoints += points;
        mergePositions.forEach(c => mergedTiles.add(`${r},${c}`));
      }
    } else if (direction === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const reversed = [...grid[r]].reverse();
        const { result, points, mergePositions } = slideRow(reversed);
        const final = result.reverse();
        if (grid[r].join(',') !== final.join(',')) moved = true;
        grid[r] = final;
        totalPoints += points;
        mergePositions.forEach(pos => mergedTiles.add(`${r},${SIZE - 1 - pos}`));
      }
    } else if (direction === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        const { result, points, mergePositions } = slideRow(col);
        if (col.join(',') !== result.join(',')) moved = true;
        for (let r = 0; r < SIZE; r++) grid[r][c] = result[r];
        totalPoints += points;
        mergePositions.forEach(r => mergedTiles.add(`${r},${c}`));
      }
    } else if (direction === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
        const { result, points, mergePositions } = slideRow(col);
        const final = result.reverse();
        const origCol = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        if (origCol.join(',') !== final.join(',')) moved = true;
        for (let r = 0; r < SIZE; r++) grid[r][c] = final[r];
        totalPoints += points;
        mergePositions.forEach(pos => mergedTiles.add(`${SIZE - 1 - pos},${c}`));
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

        // 排行榜处理
        const rank = checkRank(score);
        let highlightIdx = -1;
        if (rank !== -1) {
          highlightIdx = insertScore(score);
          // 延迟显示 Toast，让 Game Over 遮罩先展示
          setTimeout(() => showRankToast(rank, score), 1000);
        }
        renderLeaderboard(highlightIdx);

        setTimeout(() => overlayEl.classList.add('active'), 400);
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
