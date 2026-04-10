/**
 * 贪吃蛇游戏 — 电路板 PCB 主题
 * Canvas 渲染，键盘 + 触摸支持
 */
(function () {
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');

  // 响应式 Canvas 尺寸
  function resizeCanvas() {
    const maxW = Math.min(400, window.innerWidth - 40);
    canvas.width = maxW;
    canvas.height = maxW;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const GRID = 20; // 网格数量
  let cellSize;

  // 游戏状态
  let snake = [];
  let food = null;
  let direction = 'right';
  let nextDirection = 'right';
  let score = 0;
  let level = 1;
  let bestScore = parseInt(localStorage.getItem('bestSnake') || '0');
  let gameRunning = false;
  let gameLoop = null;

  // PCB 主题色
  const COLORS = {
    bg: '#0a2e0a',
    grid: '#0d3b0d',
    trace: '#1a5c1a',
    snakeHead: '#7ee787',
    snakeBody: '#3fb950',
    snakeTail: '#238636',
    food: '#f85149',
    foodGlow: 'rgba(248,81,73,0.4)',
    pad: '#1a472a',
    text: '#7ee787',
  };

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best-score');
  const levelEl = document.getElementById('level');
  const btnStart = document.getElementById('btn-start');

  bestEl.textContent = bestScore;

  // 初始化游戏
  function init() {
    cellSize = canvas.width / GRID;
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    level = 1;
    updateUI();
    spawnFood();
    draw();
  }

  // 生成食物
  function spawnFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID)
      };
    } while (occupied.has(`${pos.x},${pos.y}`));
    food = pos;
  }

  // 绘制
  function draw() {
    cellSize = canvas.width / GRID;

    // 背景 — PCB 底板
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格线 — 模拟 PCB 线路
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // 角落装饰 — PCB 固定孔
    const holeR = cellSize * 0.3;
    const holes = [
      [1.5 * cellSize, 1.5 * cellSize],
      [canvas.width - 1.5 * cellSize, 1.5 * cellSize],
      [1.5 * cellSize, canvas.height - 1.5 * cellSize],
      [canvas.width - 1.5 * cellSize, canvas.height - 1.5 * cellSize],
    ];
    holes.forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, holeR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.pad;
      ctx.fill();
      ctx.strokeStyle = COLORS.trace;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 食物 — 带发光效果
    if (food) {
      const fx = food.x * cellSize + cellSize / 2;
      const fy = food.y * cellSize + cellSize / 2;

      // 发光
      const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, cellSize);
      glow.addColorStop(0, COLORS.foodGlow);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(food.x * cellSize - cellSize / 2, food.y * cellSize - cellSize / 2, cellSize * 2, cellSize * 2);

      // 食物方块
      ctx.fillStyle = COLORS.food;
      const pad = 2;
      ctx.beginPath();
      ctx.roundRect(food.x * cellSize + pad, food.y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2, 3);
      ctx.fill();
    }

    // 蛇身
    snake.forEach((seg, i) => {
      const pad = 1;
      const x = seg.x * cellSize + pad;
      const y = seg.y * cellSize + pad;
      const w = cellSize - pad * 2;
      const h = cellSize - pad * 2;

      if (i === 0) {
        ctx.fillStyle = COLORS.snakeHead;
        // 蛇头发光
        ctx.shadowColor = COLORS.snakeHead;
        ctx.shadowBlur = 8;
      } else if (i < snake.length * 0.5) {
        ctx.fillStyle = COLORS.snakeBody;
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = COLORS.snakeTail;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 蛇头眼睛
      if (i === 0) {
        ctx.fillStyle = COLORS.bg;
        const eyeSize = cellSize * 0.15;
        let e1x, e1y, e2x, e2y;
        const cx = seg.x * cellSize + cellSize / 2;
        const cy = seg.y * cellSize + cellSize / 2;

        if (direction === 'right') { e1x = cx + 3; e1y = cy - 3; e2x = cx + 3; e2y = cy + 3; }
        else if (direction === 'left') { e1x = cx - 3; e1y = cy - 3; e2x = cx - 3; e2y = cy + 3; }
        else if (direction === 'up') { e1x = cx - 3; e1y = cy - 3; e2x = cx + 3; e2y = cy - 3; }
        else { e1x = cx - 3; e1y = cy + 3; e2x = cx + 3; e2y = cy + 3; }

        ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2); ctx.fill();
      }
    });

    // 如果游戏未运行，显示提示
    if (!gameRunning && snake.length <= 3 && score === 0) {
      ctx.fillStyle = COLORS.text;
      ctx.font = `bold ${cellSize * 0.8}px "Space Grotesk", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('按「开始游戏」', canvas.width / 2, canvas.height / 2 - cellSize);
      ctx.font = `${cellSize * 0.6}px "Space Grotesk", sans-serif`;
      ctx.fillText('或按方向键开始', canvas.width / 2, canvas.height / 2 + cellSize * 0.5);
    }
  }

  // 游戏步进
  function step() {
    direction = nextDirection;

    const head = { ...snake[0] };
    if (direction === 'up') head.y--;
    else if (direction === 'down') head.y++;
    else if (direction === 'left') head.x--;
    else if (direction === 'right') head.x++;

    // 碰壁检测
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      endGame();
      return;
    }

    // 碰自身检测
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);

    // 吃到食物
    if (food && head.x === food.x && head.y === food.y) {
      score++;
      level = Math.floor(score / 5) + 1;
      updateUI();
      spawnFood();

      // 加速
      clearInterval(gameLoop);
      const speed = Math.max(60, 150 - (level - 1) * 10);
      gameLoop = setInterval(step, speed);
    } else {
      snake.pop();
    }

    draw();
  }

  // 结束游戏
  function endGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    gameLoop = null;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('bestSnake', bestScore);
      bestEl.textContent = bestScore;
    }

    // 闪烁效果然后显示 Game Over
    ctx.fillStyle = 'rgba(10,14,26,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff7b72';
    ctx.font = `bold ${cellSize * 1.2}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - cellSize);

    ctx.fillStyle = COLORS.text;
    ctx.font = `${cellSize * 0.7}px "Space Grotesk", sans-serif`;
    ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + cellSize * 0.5);
    ctx.font = `${cellSize * 0.5}px "Space Grotesk", sans-serif`;
    ctx.fillText('点击「开始游戏」重来', canvas.width / 2, canvas.height / 2 + cellSize * 2);

    btnStart.textContent = '重新开始';
  }

  function updateUI() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
  }

  // 开始
  function startGame() {
    if (gameRunning) return;
    init();
    gameRunning = true;
    btnStart.textContent = '游戏中...';
    const speed = 150;
    gameLoop = setInterval(step, speed);
  }

  // 键盘控制
  document.addEventListener('keydown', (e) => {
    const map = {
      ArrowUp: 'up', ArrowDown: 'down',
      ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right'
    };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();

    // 不能反向移动
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (dir === opposites[direction]) return;

    nextDirection = dir;

    // 如果游戏未运行，自动开始
    if (!gameRunning) startGame();
  });

  // 虚拟方向键
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (dir === opposites[direction]) return;
      nextDirection = dir;
      if (!gameRunning) startGame();
    });
  });

  // 触摸滑动
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;

    let dir;
    if (absDx > absDy) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';

    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (dir !== opposites[direction]) {
      nextDirection = dir;
      if (!gameRunning) startGame();
    }
  }, { passive: true });

  // 按钮
  btnStart.addEventListener('click', startGame);

  // 初始绘制
  init();
})();
