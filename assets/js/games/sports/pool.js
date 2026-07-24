// 🎱 Pool - 8 Ball & 9 Ball, Canvas, Vật lý, Điều khiển, Hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

// ========== THAM SỐ ==========
const canvas = document.getElementById('poolCanvas');
const ctx = canvas.getContext('2d');
const powerBarFill = document.getElementById('powerBarFill');
const turnIndicator = document.getElementById('turnIndicator');
const statusText = document.getElementById('statusText');
const pocketsDisplay = document.getElementById('pocketsDisplay');
const gameModeSelect = document.getElementById('gameModeSelect');
const newGameBtn = document.getElementById('newGameBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const W = 800, H = 400; // tỉ lệ 2:1
canvas.width = W;
canvas.height = H;

const BALL_RADIUS = 12;
const POCKET_RADIUS = 18;
const FRICTION = 0.985; // ma sát mỗi khung hình
const MIN_SPEED = 0.1;
const CUSHION_ELASTICITY = 0.75;
const BALL_ELASTICITY = 0.95;

// Băng
const RAIL_WIDTH = 22;
const PLAY_X = RAIL_WIDTH;
const PLAY_Y = RAIL_WIDTH;
const PLAY_W = W - RAIL_WIDTH * 2;
const PLAY_H = H - RAIL_WIDTH * 2;

// Lỗ (6 lỗ)
const pockets = [
  { x: PLAY_X, y: PLAY_Y }, // góc trái trên
  { x: PLAY_X + PLAY_W, y: PLAY_Y }, // góc phải trên
  { x: PLAY_X, y: PLAY_Y + PLAY_H }, // góc trái dưới
  { x: PLAY_X + PLAY_W, y: PLAY_Y + PLAY_H }, // góc phải dưới
  { x: PLAY_X + PLAY_W / 2, y: PLAY_Y - 2 }, // giữa trên
  { x: PLAY_X + PLAY_W / 2, y: PLAY_Y + PLAY_H + 2 } // giữa dưới
];

// Màu bóng
const SOLID_COLORS = [
  '#f1c40f', // 1 - vàng
  '#3498db', // 2 - xanh dương
  '#e74c3c', // 3 - đỏ
  '#9b59b6', // 4 - tím
  '#e67e22', // 5 - cam
  '#2ecc71', // 6 - lục
  '#8b4513', // 7 - nâu
  '#000000', // 8 - đen
  '#f1c40f', // 9 - vàng (9-ball)
  '#3498db', // 10
  '#e74c3c', // 11
  '#9b59b6', // 12
  '#e67e22', // 13
  '#2ecc71', // 14
  '#8b4513'  // 15
];

// ========== LỚP BÓNG ==========
class Ball {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = BALL_RADIUS;
    this.pocketed = false;
  }

  get color() {
    if (this.id === 0) return 'white';
    const idx = this.id - 1;
    if (idx >= 15) return '#ccc';
    return SOLID_COLORS[idx];
  }

  get isCue() { return this.id === 0; }
  get isSolid() { return this.id >= 1 && this.id <= 7; }
  get isStripe() { return this.id >= 9 && this.id <= 15; }
  get is8() { return this.id === 8; }

  clone() {
    const b = new Ball(this.id, this.x, this.y);
    b.vx = this.vx; b.vy = this.vy;
    b.pocketed = this.pocketed;
    return b;
  }

  speed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  update() {
    if (this.pocketed) return;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= FRICTION;
    this.vy *= FRICTION;
    if (this.speed() < MIN_SPEED) {
      this.vx = 0; this.vy = 0;
    }
  }
}

// ========== TRẠNG THÁI GAME ==========
let balls = [];
let gameMode = '8'; // '8' hoặc '9'
let playerTurn = 1; // 1 hoặc 2
let gameState = 'aiming'; // 'aiming', 'shooting', 'simulating', 'gameover'
let solidGroup = null; // null: bàn mở, 1: người 1 đặc, 2: người 2 đặc (hoặc sọc)
let winner = null;

// Điều khiển
let mouseDown = false;
let mouseX = 0, mouseY = 0;
let aimPower = 0; // 0-100
const MAX_POWER = 15;

// Lịch sử để cheat reset
let lastCueBallPos = null;

// ========== KHỞI TẠO ==========
function initGame() {
  gameMode = gameModeSelect.value;
  playerTurn = 1;
  gameState = 'aiming';
  solidGroup = null;
  winner = null;
  balls = [];

  // Tạo bi cái
  const cueX = PLAY_X + PLAY_W * 0.25;
  const cueY = PLAY_Y + PLAY_H / 2;
  balls.push(new Ball(0, cueX, cueY));
  lastCueBallPos = { x: cueX, y: cueY };

  if (gameMode === '8') {
    init8BallRack();
  } else {
    init9BallRack();
  }

  updateDisplay();
  draw();
}

function init8BallRack() {
  const startX = PLAY_X + PLAY_W * 0.72;
  const startY = PLAY_Y + PLAY_H / 2;
  const gap = BALL_RADIUS * 2 + 2;
  const dx = gap * Math.cos(Math.PI / 6);
  const dy = gap * Math.sin(Math.PI / 6);

  const order = [1, 9, 2, 10, 8, 11, 3, 12, 4, 13, 5, 14, 6, 15, 7]; // thứ tự xếp
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = startX + row * dx;
      const y = startY + (col - row / 2) * gap;
      if (idx < order.length) {
        balls.push(new Ball(order[idx], x, y));
        idx++;
      }
    }
  }
}

function init9BallRack() {
  const startX = PLAY_X + PLAY_W * 0.72;
  const startY = PLAY_Y + PLAY_H / 2;
  const gap = BALL_RADIUS * 2 + 2;
  const dx = gap * Math.cos(Math.PI / 6);
  const dy = gap * Math.sin(Math.PI / 6);

  const order = [1, 2, 3, 4, 9, 5, 6, 7, 8]; // 1 đỉnh, 9 giữa
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    const cols = row < 4 ? (row === 0 ? 1 : row + 1) : (row === 4 ? 1 : 0);
    if (row === 4) {
      // Hàng cuối chỉ có 1 bi
      balls.push(new Ball(order[idx], startX + row * dx, startY));
      idx++;
    } else {
      for (let col = 0; col <= row; col++) {
        const x = startX + row * dx;
        const y = startY + (col - row / 2) * gap;
        if (idx < order.length) {
          balls.push(new Ball(order[idx], x, y));
          idx++;
        }
      }
    }
  }
  // Đảm bảo bi 9 ở giữa (vị trí row=2, col=1)
  // Đơn giản hóa: xếp như trên, tạm chấp nhận.
}

// ========== VẬT LÝ ==========
function updatePhysics() {
  for (const ball of balls) {
    if (ball.pocketed) continue;
    ball.update();
    // Va chạm băng
    if (ball.x - ball.radius < PLAY_X) {
      ball.x = PLAY_X + ball.radius;
      ball.vx = Math.abs(ball.vx) * CUSHION_ELASTICITY;
    }
    if (ball.x + ball.radius > PLAY_X + PLAY_W) {
      ball.x = PLAY_X + PLAY_W - ball.radius;
      ball.vx = -Math.abs(ball.vx) * CUSHION_ELASTICITY;
    }
    if (ball.y - ball.radius < PLAY_Y) {
      ball.y = PLAY_Y + ball.radius;
      ball.vy = Math.abs(ball.vy) * CUSHION_ELASTICITY;
    }
    if (ball.y + ball.radius > PLAY_Y + PLAY_H) {
      ball.y = PLAY_Y + PLAY_H - ball.radius;
      ball.vy = -Math.abs(ball.vy) * CUSHION_ELASTICITY;
    }
  }

  // Va chạm giữa các bi
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      if (a.pocketed || b.pocketed) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;
      if (dist < minDist && dist > 0.01) {
        // Đẩy ra
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x += nx * overlap / 2;
        a.y += ny * overlap / 2;
        b.x -= nx * overlap / 2;
        b.y -= ny * overlap / 2;

        // Va chạm đàn hồi
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const vn = dvx * nx + dvy * ny;
        if (vn < 0) {
          const imp = 2 * vn / (1 + 1) * BALL_ELASTICITY;
          a.vx -= imp * nx;
          a.vy -= imp * ny;
          b.vx += imp * nx;
          b.vy += imp * ny;
        }
      }
    }
  }

  // Kiểm tra vào lỗ
  for (const ball of balls) {
    if (ball.pocketed) continue;
    for (const p of pockets) {
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
        ball.pocketed = true;
        audioEngine.play('pocket');
        break;
      }
    }
  }
}

function allStopped() {
  return balls.every(b => b.pocketed || b.speed() < MIN_SPEED);
}

// ========== LƯỢT & LUẬT ==========
function checkFoul(cueBall, firstContact, anyPocketed, anyRailAfterContact) {
  // Trả về true nếu phạm lỗi
  if (cueBall.pocketed) return true;
  if (gameMode === '8' && solidGroup !== null) {
    const playerGroup = (solidGroup === 1) ? 'solid' : 'stripe';
    const firstBall = firstContact;
    if (firstBall === null) return true; // không chạm bi nào
    if (playerGroup === 'solid' && firstBall.isStripe) return true;
    if (playerGroup === 'stripe' && firstBall.isSolid) return true;
  }
  if (gameMode === '9') {
    // Phải chạm bi có số nhỏ nhất
    const minBall = balls.filter(b => !b.pocketed && b.id >= 1).sort((a,b) => a.id - b.id)[0];
    if (minBall && firstContact && firstContact.id !== minBall.id) return true;
  }
  // Kiểm tra sau chạm: phải có bi vào lỗ hoặc bi chạm băng
  if (firstContact && !anyPocketed && !anyRailAfterContact) return true;
  return false;
}

function handleTurnEnd() {
  // Được gọi sau khi bóng dừng
  // Xác định lỗi, cập nhật nhóm, chuyển lượt
  // Giả định: firstContact, anyPocketed, anyRailAfterContact được theo dõi trong quá trình va chạm
  // Trong code này, ta sẽ kiểm tra thủ công sau mỗi cú đánh (hơi phức tạp).
  // Tạm thời bỏ qua chi tiết để code gọn, sẽ bổ sung sau.
  // Chỉ chuyển lượt nếu không có bi vào lỗ hợp lệ.
  const cueBall = balls.find(b => b.id === 0);
  if (cueBall.pocketed) {
    // Scratch
    resetCueBall();
    playerTurn = playerTurn === 1 ? 2 : 1;
    updateDisplay();
    return;
  }
  // Nếu không có bi mục tiêu vào lỗ -> chuyển lượt
  const targetPocketed = balls.some(b => b.id !== 0 && b.pocketed);
  if (!targetPocketed) {
    playerTurn = playerTurn === 1 ? 2 : 1;
  }
  updateDisplay();
}

function resetCueBall() {
  const cue = balls.find(b => b.id === 0);
  if (cue) {
    cue.x = PLAY_X + PLAY_W * 0.25;
    cue.y = PLAY_Y + PLAY_H / 2;
    cue.vx = 0; cue.vy = 0;
    cue.pocketed = false;
  }
}

// ========== VẼ ==========
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawTable();
  drawBalls();
  if (gameState === 'aiming' || gameState === 'shooting') {
    drawAimLine();
  }
}

function drawTable() {
  // Nỉ
  ctx.fillStyle = '#0a5c0a';
  ctx.fillRect(PLAY_X, PLAY_Y, PLAY_W, PLAY_H);
  // Băng
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(0, 0, W, RAIL_WIDTH); // trên
  ctx.fillRect(0, H - RAIL_WIDTH, W, RAIL_WIDTH); // dưới
  ctx.fillRect(0, 0, RAIL_WIDTH, H); // trái
  ctx.fillRect(W - RAIL_WIDTH, 0, RAIL_WIDTH, H); // phải
  // Lỗ
  ctx.fillStyle = '#111';
  for (const p of pockets) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBalls() {
  for (const ball of balls) {
    if (ball.pocketed) continue;
    // Vẽ bóng
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sọc trắng cho bi sọc (9-15)
    if (ball.isStripe) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(ball.x - ball.radius, ball.y - 4, ball.radius * 2, 8);
      // reset clip
    }

    // Số
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ball.id === 0 ? '' : ball.id, ball.x, ball.y);
  }
}

function drawAimLine() {
  const cueBall = balls.find(b => b.id === 0);
  if (!cueBall) return;
  // Vạch ngắm từ bi cái đến vị trí chuột (nếu đang ngắm)
  if (gameState === 'aiming') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Cây cơ
  if (gameState === 'shooting') {
    const dx = cueBall.x - mouseX;
    const dy = cueBall.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const pullback = Math.min(aimPower * 8, 120);
      const startX = cueBall.x + nx * pullback;
      const startY = cueBall.y + ny * pullback;
      const endX = cueBall.x + nx * (pullback + 20);
      const endY = cueBall.y + ny * (pullback + 20);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

function updateDisplay() {
  turnIndicator.textContent = `Lượt: Người chơi ${playerTurn}`;
  if (solidGroup) {
    statusText.textContent = `Nhóm: ${solidGroup === 1 ? 'Đặc' : 'Sọc'} (Người 1) / ${solidGroup === 2 ? 'Đặc' : 'Sọc'} (Người 2)`;
  } else {
    statusText.textContent = gameMode === '8' ? 'Bàn mở' : '9-Ball';
  }
  // Hiển thị bi đã ăn
  const pocketedBalls = balls.filter(b => b.pocketed && b.id !== 0);
  pocketsDisplay.innerHTML = '';
  for (const b of pocketedBalls) {
    const el = document.createElement('span');
    el.className = 'mini-ball';
    el.style.background = b.color;
    el.textContent = b.id;
    pocketsDisplay.appendChild(el);
  }
}

// ========== SỰ KIỆN ==========
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

canvas.addEventListener('mousedown', (e) => {
  if (gameState !== 'aiming' || !allStopped()) return;
  gameState = 'shooting';
  const pos = getCanvasPos(e);
  mouseX = pos.x;
  mouseY = pos.y;
  aimPower = 0;
  updatePowerBar();
  draw();
});

canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasPos(e);
  mouseX = pos.x;
  mouseY = pos.y;
  if (gameState === 'shooting') {
    const cue = balls.find(b => b.id === 0);
    if (cue) {
      const dx = cue.x - mouseX;
      const dy = cue.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      aimPower = Math.min(dist / 15, 100);
      updatePowerBar();
    }
  }
  if (gameState === 'aiming') draw();
});

canvas.addEventListener('mouseup', (e) => {
  if (gameState !== 'shooting') return;
  const cue = balls.find(b => b.id === 0);
  if (cue) {
    const dx = cue.x - mouseX;
    const dy = cue.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      const force = Math.min(aimPower, 100) / 100 * MAX_POWER;
      cue.vx = dx / dist * force;
      cue.vy = dy / dist * force;
      lastCueBallPos = { x: cue.x, y: cue.y };
    }
  }
  gameState = 'simulating';
  aimPower = 0;
  updatePowerBar();
  audioEngine.play('cue-strike');
  simulateUntilStop();
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
  canvas.dispatchEvent(new MouseEvent('mousedown', fakeEvent));
});
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
  canvas.dispatchEvent(new MouseEvent('mousemove', fakeEvent));
});
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  canvas.dispatchEvent(new MouseEvent('mouseup', {}));
});

function simulateUntilStop() {
  const loop = () => {
    updatePhysics();
    draw();
    if (allStopped()) {
      gameState = 'aiming';
      handleTurnEnd();
      updateDisplay();
    } else {
      requestAnimationFrame(loop);
    }
  };
  requestAnimationFrame(loop);
}

function updatePowerBar() {
  powerBarFill.style.height = aimPower + '%';
}

// ========== NÚT ==========
newGameBtn.addEventListener('click', initGame);
fullscreenBtn.addEventListener('click', () => canvas.requestFullscreen());

// ========== CHEAT PANEL ==========
function createAdvancedPanel() {
  if (!isDevMode()) return;
  const panel = document.createElement('div');
  panel.id = 'advanced-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <style>#advanced-panel{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;padding:12px;border-radius:8px;z-index:9999;font-size:12px;max-width:240px;border:1px solid #0f0;}</style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[1] Thắng ngay cho Người 1</div>
    <div>[2] Thắng ngay cho Người 2</div>
    <div>[R] Đặt lại bi cái</div>
    <div>[K] Kết thúc game</div>
  `;
  document.body.appendChild(panel);
  window.advancedPanel = panel;
}

function toggleAdvancedPanel() {
  if (!isDevMode()) return;
  const panel = window.advancedPanel;
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case '1': winner = 1; endGame(); break;
    case '2': winner = 2; endGame(); break;
    case 'r': case 'R': resetCueBall(); updateDisplay(); draw(); break;
    case 'k': case 'K': endGame(); break;
  }
});

function endGame() {
  gameState = 'gameover';
  if (winner) {
    statusText.textContent = `Người chơi ${winner} chiến thắng!`;
  } else {
    statusText.textContent = 'Trò chơi kết thúc';
  }
}

// ========== KHỞI ĐỘNG ==========
createAdvancedPanel();
initGame();
draw();