// 🧱 Breakout - Canvas, ES Module, hỗ trợ nâng cao đầy đủ & AI thông minh
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

// 🎨 Canvas & giao diện
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const bestSpan = document.getElementById('best');
const livesSpan = document.getElementById('lives');
const speedDisplay = document.getElementById('speedDisplay');

// 📐 Kích thước
const W = canvas.width, H = canvas.height;

// 🧱 Gạch
const BRICK_ROWS = 6, BRICK_COLS = 8;
const BRICK_W = W / BRICK_COLS - 2;
const BRICK_H = 20;

// 🏓 Thanh trượt
let PADDLE_W = 80;
const PADDLE_H = 14;
const PADDLE_SPEED = 6;

// ⚪ Bóng
let BALL_RADIUS = 6;  // bán kính thay đổi được
const BALL_RADIUS_DEFAULT = 6;
const BALL_RADIUS_BIG = 12;
const BALL_SPEED_INIT = 4;

// 🎒 Item
const ITEM_SIZE = 14;
const ITEM_SPEED = 2;
const ITEM_TYPES = ['widen', 'slow', 'extra_life', 'bonus_score', 'multi_ball', 'big_ball'];
const ITEM_COLORS = {
  widen: '#f1c40f',
  slow: '#3498db',
  extra_life: '#e74c3c',
  bonus_score: '#2ecc71',
  multi_ball: '#9b59b6',
  big_ball: '#e67e22'
};

// 🕹️ Trạng thái game
let bricks = [];
let paddleX;
let balls = [];
let items = [];
let score = 0, bestScore = 0, lives = 3;
let running = false, paused = false, gameOverFlag = false;
let animationFrameId = null;
let speedMultiplier = 1;

// 🧰 Hỗ trợ nâng cao (DevMode) & trạng thái tạm từ item
let paddleWide = false;
let ballSlow = false;
let multiBall = false;
let autoPilot = false;
let showCollision = false;
let invincible = false;     // bất tử
let bigBall = false;        // bóng to (cheat)

// Bộ đếm thời gian cho item tạm thời (sẽ dùng setTimeout, không cần biến global)

// 🖥️ Bảng hỗ trợ phát triển
let advancedPanel = null, panelShown = false;

// 🔊 Âm thanh
audioEngine.init();

// --- 🧱 Tạo mảng gạch ---
function createBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const hue = (r * 40) % 360;
      bricks.push({
        x: c * (BRICK_W + 2) + 1,
        y: r * (BRICK_H + 2) + 30,
        w: BRICK_W,
        h: BRICK_H,
        alive: true,
        color: `hsl(${hue}, 80%, 55%)`
      });
    }
  }
}

// --- 🔄 Reset bóng và paddle ---
function resetBallAndPaddle() {
  paddleX = W / 2 - PADDLE_W / 2;
  const baseDX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_INIT;
  balls = [{
    x: paddleX + PADDLE_W / 2,
    y: H - PADDLE_H - BALL_RADIUS - 5,
    dx: baseDX,
    dy: -BALL_SPEED_INIT
  }];
  // Khôi phục bán kính mặc định (nếu không có cheat bigBall)
  if (!bigBall) {
    BALL_RADIUS = BALL_RADIUS_DEFAULT;
  } else {
    BALL_RADIUS = BALL_RADIUS_BIG;
  }
}

// --- 🟢 Bắt đầu game ---
function startGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  createBricks();
  score = 0;
  lives = 3;
  speedMultiplier = 1;
  running = true;
  paused = false;
  gameOverFlag = false;
  scoreSpan.textContent = score;
  livesSpan.textContent = lives;
  speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
  document.getElementById('pauseBtn').textContent = '⏸️ Tạm dừng';
  items = [];
  // Reset kích thước thanh và bóng về mặc định (các cheat vẫn giữ nguyên trạng thái bật/tắt)
  PADDLE_W = 80;
  BALL_RADIUS = bigBall ? BALL_RADIUS_BIG : BALL_RADIUS_DEFAULT;
  resetBallAndPaddle();
  refreshAdvancedPanel();
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- ☠️ Mất mạng (hoặc không nếu bất tử) ---
function handleBallOut(ball) {
  // Nếu bất tử, đảo hướng bóng và nảy lên từ đáy
  if (invincible) {
    ball.y = H - BALL_RADIUS;
    ball.dy = -Math.abs(ball.dy);
    audioEngine.play('jump');
    return false; // không mất mạng
  }
  // Bình thường: xóa bóng này, nếu hết bóng thì mất mạng
  const idx = balls.indexOf(ball);
  if (idx >= 0) balls.splice(idx, 1);
  if (balls.length === 0) {
    lives--;
    livesSpan.textContent = lives;
    if (lives <= 0) {
      gameOver();
      return true;
    }
    resetBallAndPaddle();
    audioEngine.play('error');
    return true;
  }
  return false;
}

// --- 💀 Game Over ---
function gameOver() {
  running = false;
  gameOverFlag = true;
  cancelAnimationFrame(animationFrameId);
  saveBestScore();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', W / 2, H / 2 - 15);
  ctx.font = '16px sans-serif';
  ctx.fillText('Nhấn "Chơi lại" để tiếp tục', W / 2, H / 2 + 25);
  audioEngine.play('gameover');
}

// --- 🎁 Sinh item khi phá gạch ---
function spawnItem(brick) {
  if (Math.random() > 0.2) return;
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  items.push({
    x: brick.x + brick.w / 2 - ITEM_SIZE / 2,
    y: brick.y + brick.h,
    w: ITEM_SIZE,
    h: ITEM_SIZE,
    type: type,
    color: ITEM_COLORS[type]
  });
}

// --- 🧲 Nhận item ---
function collectItem(item) {
  switch (item.type) {
    case 'widen':
      paddleWide = true;
      PADDLE_W = 130;
      setTimeout(() => { paddleWide = false; PADDLE_W = 80; }, 10000);
      break;
    case 'slow':
      ballSlow = true;
      speedMultiplier = 0.5;
      setTimeout(() => { ballSlow = false; speedMultiplier = 1; }, 10000);
      break;
    case 'extra_life':
      lives = Math.min(5, lives + 1);
      livesSpan.textContent = lives;
      break;
    case 'bonus_score':
      score += 100;
      scoreSpan.textContent = score;
      break;
    case 'multi_ball':
      // Thêm 2 bóng
      for (let i = 0; i < 2 && balls.length < 5; i++) {
        const base = balls[0] || { x: paddleX + PADDLE_W/2, y: H/2, dx: 2, dy: -2 };
        balls.push({
          x: base.x,
          y: base.y,
          dx: -base.dx * (0.8 + Math.random() * 0.4),
          dy: base.dy * (0.8 + Math.random() * 0.4)
        });
      }
      break;
    case 'big_ball':
      // Tăng bán kính bóng tạm thời
      if (!bigBall) {
        BALL_RADIUS = BALL_RADIUS_BIG;
        setTimeout(() => {
          if (!bigBall) BALL_RADIUS = BALL_RADIUS_DEFAULT;
        }, 8000);
      }
      break;
  }
  audioEngine.play('coin');
}

// --- 🎨 Vẽ ---
function draw() {
  if (!running) return;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  // Gạch
  for (const brick of bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
  }

  // Thanh trượt
  ctx.fillStyle = '#ecf0f1';
  ctx.fillRect(paddleX, H - PADDLE_H - 10, PADDLE_W, PADDLE_H);
  ctx.strokeStyle = '#bdc3c7';
  ctx.strokeRect(paddleX, H - PADDLE_H - 10, PADDLE_W, PADDLE_H);

  // Tất cả bóng (với bán kính hiện tại)
  for (const ball of balls) {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // Viền trắng nếu bóng to
    if (BALL_RADIUS > BALL_RADIUS_DEFAULT) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Item
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const letter = item.type === 'big_ball' ? 'B' : item.type.charAt(0).toUpperCase();
    ctx.fillText(letter, item.x + item.w / 2, item.y + item.h / 2 + 3);
  }

  // Hitbox
  if (showCollision) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    for (const ball of balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeRect(paddleX, H - PADDLE_H - 10, PADDLE_W, PADDLE_H);
    for (const b of bricks) {
      if (b.alive) ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
  }
}

// --- 🤖 AI thông minh: dự đoán điểm rơi của bóng, ưu tiên item ---
function autoMovePaddle() {
  if (!autoPilot || !running || paused || gameOverFlag) return;

  // Nếu có item, ưu tiên di chuyển đến item gần nhất
  let targetX = null;
  if (items.length > 0) {
    // Tìm item sắp chạm thanh (gần đáy nhất)
    const closestItem = items.reduce((a, b) => (b.y > a.y) ? b : a, items[0]);
    if (closestItem.y > H - 100) { // chỉ ưu tiên nếu item gần thanh
      targetX = closestItem.x + closestItem.w/2 - PADDLE_W/2;
    }
  }

  // Nếu không có item gần, dự đoán điểm rơi của bóng gần nhất
  if (targetX === null && balls.length > 0) {
    // Chọn bóng gần chạm thanh nhất (bóng có y lớn nhất và dy dương)
    const candidates = balls.filter(b => b.dy > 0);
    if (candidates.length === 0) {
      // Không có bóng đang rơi xuống, giữ nguyên vị trí
      return;
    }
    const ball = candidates.reduce((a, b) => (a.y > b.y) ? a : b, candidates[0]);

    // Dự đoán thời gian chạm thanh (từ vị trí hiện tại đến H - PADDLE_H - BALL_RADIUS)
    const targetY = H - PADDLE_H - BALL_RADIUS;
    const time = (targetY - ball.y) / ball.dy; // khung hình (giả sử mỗi frame 1 đơn vị)
    let predictX = ball.x + ball.dx * time * speedMultiplier;

    // Phản xạ qua tường nếu cần
    if (predictX < BALL_RADIUS || predictX > W - BALL_RADIUS) {
      const mirrorX = predictX < BALL_RADIUS ? BALL_RADIUS - predictX : 2*(W - BALL_RADIUS) - predictX;
      predictX = Math.max(BALL_RADIUS, Math.min(W - BALL_RADIUS, mirrorX));
    }

    targetX = predictX - PADDLE_W / 2;
  }

  if (targetX !== null) {
    // Di chuyển thanh mượt mà đến targetX
    const dx = targetX - paddleX;
    if (Math.abs(dx) < 1) return;
    paddleX += Math.sign(dx) * Math.min(PADDLE_SPEED, Math.abs(dx));
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));
  }
}

// --- 🧠 Cập nhật logic mỗi khung hình ---
function update() {
  if (!running || paused || gameOverFlag) return;

  autoMovePaddle(); // AI di chuyển thanh

  // Cập nhật từng bóng
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    ball.x += ball.dx * speedMultiplier;
    ball.y += ball.dy * speedMultiplier;

    // Va tường trái/phải
    if (ball.x - BALL_RADIUS < 0) {
      ball.x = BALL_RADIUS;
      ball.dx = -ball.dx;
      audioEngine.play('hit');
    } else if (ball.x + BALL_RADIUS > W) {
      ball.x = W - BALL_RADIUS;
      ball.dx = -ball.dx;
      audioEngine.play('hit');
    }
    // Tường trên
    if (ball.y - BALL_RADIUS < 0) {
      ball.y = BALL_RADIUS;
      ball.dy = -ball.dy;
      audioEngine.play('hit');
    }

    // Đáy: xử lý bất tử hoặc mất mạng
    if (ball.y + BALL_RADIUS > H) {
      if (handleBallOut(ball)) {
        // Nếu mất mạng và game over, dừng update
        if (!running) return;
      }
      continue;
    }

    // Va chạm thanh trượt
    if (
      ball.y + BALL_RADIUS >= H - PADDLE_H - 10 &&
      ball.x >= paddleX && ball.x <= paddleX + PADDLE_W
    ) {
      ball.y = H - PADDLE_H - 10 - BALL_RADIUS;
      const hitPos = (ball.x - paddleX) / PADDLE_W;
      ball.dx = (hitPos - 0.5) * 8 + (ball.dx > 0 ? 1 : -1) * 2;
      ball.dy = -Math.abs(ball.dy);
      audioEngine.play('jump');
    }

    // Va chạm gạch
    for (const brick of bricks) {
      if (!brick.alive) continue;
      if (
        ball.x + BALL_RADIUS > brick.x &&
        ball.x - BALL_RADIUS < brick.x + brick.w &&
        ball.y + BALL_RADIUS > brick.y &&
        ball.y - BALL_RADIUS < brick.y + brick.h
      ) {
        brick.alive = false;
        score += 10;
        scoreSpan.textContent = score;
        audioEngine.play('break');
        spawnItem(brick);

        // Xác định hướng nảy dựa trên phía va chạm
        const ol = (ball.x + BALL_RADIUS) - brick.x;
        const or = (brick.x + brick.w) - (ball.x - BALL_RADIUS);
        const ot = (ball.y + BALL_RADIUS) - brick.y;
        const ob = (brick.y + brick.h) - (ball.y - BALL_RADIUS);
        if (Math.min(ol, or) < Math.min(ot, ob)) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }
        break;
      }
    }
  }

  // Cập nhật item
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.y += ITEM_SPEED;
    // Va chạm thanh
    if (
      item.y + item.h >= H - PADDLE_H - 10 &&
      item.x + item.w > paddleX && item.x < paddleX + PADDLE_W
    ) {
      collectItem(item);
      items.splice(i, 1);
      continue;
    }
    if (item.y > H) items.splice(i, 1);
  }

  // Hết gạch -> level up
  if (bricks.every(b => !b.alive)) {
    score += 500;
    scoreSpan.textContent = score;
    speedMultiplier = Math.min(3, speedMultiplier + 0.2);
    createBricks();
    resetBallAndPaddle();
    items = [];
    audioEngine.play('win');
  }

  speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
}

// --- 🎮 Vòng lặp ---
function gameLoop() {
  update();
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- ⏯️ Tạm dừng ---
function togglePause() {
  if (!running || gameOverFlag) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
}

// --- ⌨️ Điều khiển & cheat ---
document.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    e.preventDefault();
    toggleAdvancedPanel();
    return;
  }

  if (!running || paused || gameOverFlag) {
    if (!isDevMode()) return;
    // Cho phép bật/tắt cheat khi game dừng
    handleCheatToggle(e.key);
    return;
  }

  if (!isDevMode()) {
    if (e.key === 'ArrowLeft') { paddleX = Math.max(0, paddleX - PADDLE_SPEED); e.preventDefault(); }
    if (e.key === 'ArrowRight') { paddleX = Math.min(W - PADDLE_W, paddleX + PADDLE_SPEED); e.preventDefault(); }
    return;
  }

  e.preventDefault();
  if (e.key === 'ArrowLeft') paddleX = Math.max(0, paddleX - PADDLE_SPEED);
  if (e.key === 'ArrowRight') paddleX = Math.min(W - PADDLE_W, paddleX + PADDLE_SPEED);
  handleCheatToggle(e.key);
});

function handleCheatToggle(key) {
  switch (key) {
    case 'i': case 'I': // Bất tử
      invincible = !invincible;
      refreshAdvancedPanel();
      break;
    case 'w': case 'W': // Thanh rộng (cheat độc lập, giữ vĩnh viễn)
      paddleWide = !paddleWide;
      PADDLE_W = paddleWide ? 130 : 80;
      refreshAdvancedPanel();
      break;
    case 's': case 'S': // Bóng chậm (vĩnh viễn)
      ballSlow = !ballSlow;
      speedMultiplier = ballSlow ? 0.5 : 1;
      refreshAdvancedPanel();
      break;
    case 'm': case 'M': // Nhiều bóng
      multiBall = !multiBall;
      if (multiBall) {
        while (balls.length < 3 && balls.length < 5) {
          const base = balls[0] || { x: paddleX + PADDLE_W/2, y: H/2, dx: 2, dy: -2 };
          balls.push({
            x: base.x, y: base.y,
            dx: -base.dx * 1.2,
            dy: base.dy
          });
        }
      } else {
        if (balls.length > 1) balls = [balls[0]];
      }
      refreshAdvancedPanel();
      break;
    case 'a': case 'A': // Tự động
      autoPilot = !autoPilot;
      refreshAdvancedPanel();
      break;
    case 'h': case 'H': // Hitbox
      showCollision = !showCollision;
      refreshAdvancedPanel();
      break;
    case 'b': case 'B': // Bóng to (cheat vĩnh viễn)
      bigBall = !bigBall;
      if (bigBall) {
        BALL_RADIUS = BALL_RADIUS_BIG;
      } else {
        BALL_RADIUS = BALL_RADIUS_DEFAULT;
      }
      refreshAdvancedPanel();
      break;
    case 'c': case 'C': score += 100; scoreSpan.textContent = score; break;
    case '[': speedMultiplier = Math.max(0.25, speedMultiplier - 0.25); refreshAdvancedPanel(); break;
    case ']': speedMultiplier = Math.min(5, speedMultiplier + 0.25); refreshAdvancedPanel(); break;
    case 't': case 'T': speedMultiplier = 0.5; refreshAdvancedPanel(); break;
    case 'y': case 'Y': speedMultiplier = 2; refreshAdvancedPanel(); break;
    case 'k': case 'K': gameOver(); break;
    case 'd': case 'D': // Phá hết gạch
      for (const b of bricks) b.alive = false;
      score += bricks.length * 10;
      scoreSpan.textContent = score;
      break;
    case 'x': case 'X': createBricks(); resetBallAndPaddle(); items = []; break;
    default: break;
  }
}

// Chuột / cảm ứng
canvas.addEventListener('mousemove', (e) => {
  if (!running || paused || gameOverFlag || autoPilot) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, mouseX - PADDLE_W / 2));
});
canvas.addEventListener('touchmove', (e) => {
  if (!running || paused || gameOverFlag || autoPilot) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, touchX - PADDLE_W / 2));
});

// Nút UI
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (canvas.requestFullscreen) canvas.requestFullscreen();
});

// --- 💾 Best score ---
async function loadBestScore() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'breakout');
    bestScore = entry ? entry.score : 0;
  } catch (_) { bestScore = 0; }
  bestSpan.textContent = bestScore;
}
async function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    bestSpan.textContent = bestScore;
    try {
      await storage.openDB();
      const tx = storage.db.transaction('gameScores', 'readwrite');
      tx.objectStore('gameScores').put({ gameName: 'breakout', score: bestScore });
    } catch (_) {}
  }
}

// --- 🖥️ Bảng hỗ trợ phát triển ---
function createAdvancedPanel() {
  if (!isDevMode()) return;
  advancedPanel = document.createElement('div');
  advancedPanel.id = 'advanced-panel';
  advancedPanel.style.display = 'none';
  advancedPanel.innerHTML = `
    <style>
      #advanced-panel {
        position: fixed; top: 10px; right: 10px;
        background: rgba(0,0,0,0.85); color: #0f0;
        font-family: monospace; padding: 12px;
        border-radius: 8px; z-index: 9999;
        font-size: 12px; max-width: 250px;
        border: 1px solid #0f0;
      }
      .on { color: #0f0; } .off { color: #f00; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[I] Bất tử: <span id="inv-stat" class="off">OFF</span></div>
    <div>[W] Thanh rộng: <span id="wide-stat" class="off">OFF</span></div>
    <div>[S] Bóng chậm: <span id="slow-stat" class="off">OFF</span></div>
    <div>[M] Nhiều bóng: <span id="multi-stat" class="off">OFF</span></div>
    <div>[B] Bóng to: <span id="big-stat" class="off">OFF</span></div>
    <div>[A] Tự động: <span id="auto-stat" class="off">OFF</span></div>
    <div>[H] Hitbox: <span id="hit-stat" class="off">OFF</span></div>
    <div>[C] +100 điểm</div>
    <div>[ ] Tốc độ: <span id="panel-speed">1</span>x</div>
    <div>    [ : -0.25x | ] : +0.25x</div>
    <div>[T] Chậm (0.5x) | [Y] Nhanh (2x)</div>
    <div>[K] Kết thúc ngay</div>
    <div>[D] Phá hết gạch</div>
    <div>[X] Tạo lại gạch</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshAdvancedPanel();
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val ? 'ON' : 'OFF'; el.className = val ? 'on' : 'off'; }
  };
  set('inv-stat', invincible);
  set('wide-stat', paddleWide);
  set('slow-stat', ballSlow);
  set('multi-stat', multiBall);
  set('big-stat', bigBall);
  set('auto-stat', autoPilot);
  set('hit-stat', showCollision);
  document.getElementById('panel-speed').textContent = speedMultiplier.toFixed(1);
  speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelShown = !panelShown;
  advancedPanel.style.display = panelShown ? 'block' : 'none';
}

// Khởi động
loadBestScore().then(() => {
  createAdvancedPanel();
  startGame();
});