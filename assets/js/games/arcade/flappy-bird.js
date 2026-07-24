// 🐦 Flappy Bird - Canvas, ES Module, hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

// 🎨 Canvas & UI
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const bestSpan = document.getElementById('best');
const speedDisplay = document.getElementById('speedDisplay');

const W = canvas.width;
const H = canvas.height;

// 🐦 Cấu hình chim
const BIRD_X = 80;
const BIRD_RADIUS = 15;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;

// 🏞️ Ống – gap lớn để tránh kẹt
const PIPE_WIDTH = 50;
const PIPE_GAP = 200;
const BASE_PIPE_SPEED = 2;

// 🕹️ Trạng thái game
let birdY, birdVelocity;
let pipes = [];
let score = 0, bestScore = 0;
let running = false, paused = false, gameOverFlag = false;
let animationFrameId = null;
let frameCount = 0;
let speedMultiplier = 1;

// 🧰 Cờ nâng cao (DevMode)
let invincible = false;
let autoPlay = false;
let showHitbox = false;

// 🤖 Biến hỗ trợ Auto Play
let lastAutoJumpFrame = 0;      // frame cuối cùng nhảy (để giãn cách)
const AUTO_JUMP_COOLDOWN = 8;   // số frame tối thiểu giữa hai lần nhảy
const TARGET_MARGIN = 20;       // khoảng cách cho phép dưới tâm khe trước khi nhảy

// 🖥️ Bảng điều khiển
let advancedPanel = null;
let panelShown = false;

// 🔊 Âm thanh
audioEngine.init();

// --- Tiện ích ---
function rand(min, max) { return Math.random() * (max - min) + min; }

// --- Tạo ống mới ---
function spawnPipe() {
  const gapY = rand(80, H - 80 - PIPE_GAP);
  pipes.push({
    x: W,
    topHeight: gapY,
    bottomY: gapY + PIPE_GAP,
    passed: false
  });
}

// --- Reset game ---
function resetGame() {
  birdY = H / 2;
  birdVelocity = 0;
  pipes = [];
  score = 0;
  speedMultiplier = 1;
  running = true;
  paused = false;
  gameOverFlag = false;
  frameCount = 0;
  lastAutoJumpFrame = -AUTO_JUMP_COOLDOWN; // có thể nhảy ngay
  document.getElementById('pauseBtn').textContent = '⏸️ Tạm dừng';
  scoreSpan.textContent = score;
  speedDisplay.textContent = speedMultiplier + 'x';
}

// --- 💀 Game Over ---
function gameOver() {
  if (!running) return;
  running = false;
  gameOverFlag = true;
  cancelAnimationFrame(animationFrameId);
  saveBestScore();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', W/2, H/2 - 15);
  ctx.font = '16px sans-serif';
  ctx.fillText('Nhấn "Chơi lại" để tiếp tục', W/2, H/2 + 25);
  audioEngine.play('gameover');
}

// --- 🎨 Vẽ ---
function draw() {
  if (!running) return;

  ctx.clearRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#4dc9f6');
  grad.addColorStop(1, '#a0d8ef');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Ống
  for (const pipe of pipes) {
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.fillStyle = '#1e8449';
    ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20);
    ctx.strokeRect(pipe.x - 2, pipe.topHeight - 20, PIPE_WIDTH + 4, 20);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, H - pipe.bottomY);
    ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, H - pipe.bottomY);
    ctx.fillStyle = '#1e8449';
    ctx.fillRect(pipe.x - 2, pipe.bottomY, PIPE_WIDTH + 4, 20);
    ctx.strokeRect(pipe.x - 2, pipe.bottomY, PIPE_WIDTH + 4, 20);
    ctx.fillStyle = '#2ecc71';
  }

  // Chim
  const wingAngle = Math.sin(frameCount * 0.1) * 0.5;
  ctx.save();
  ctx.translate(BIRD_X, birdY);
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(5, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(7, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f39c12';
  ctx.save();
  ctx.rotate(wingAngle);
  ctx.fillRect(-5, -BIRD_RADIUS + 5, 15, 8);
  ctx.restore();
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.moveTo(BIRD_RADIUS, 0);
  ctx.lineTo(BIRD_RADIUS + 10, -2);
  ctx.lineTo(BIRD_RADIUS, 4);
  ctx.fill();
  ctx.restore();

  if (showHitbox) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(BIRD_X, birdY, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    for (const pipe of pipes) {
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, H - pipe.bottomY);
    }
  }
}

// --- 🤖 Auto Play nâng cao: nhắm vào tâm khe hở ---
function autoPlayLogic() {
  if (!autoPlay || !running || paused || gameOverFlag) return;
  // Tìm cột tiếp theo chưa vượt qua và có x + PIPE_WIDTH > BIRD_X
  const upcoming = pipes.filter(p => !p.passed && p.x + PIPE_WIDTH > BIRD_X - BIRD_RADIUS);
  if (upcoming.length === 0) {
    // Không có cột: giữ chim ở giữa màn hình
    const targetY = H / 2;
    if (birdY > targetY + 10 && birdVelocity >= 0) {
      birdVelocity = JUMP_FORCE;
      lastAutoJumpFrame = frameCount;
    }
    return;
  }
  // Chọn cột gần nhất
  const targetPipe = upcoming.reduce((prev, curr) => (curr.x < prev.x ? curr : prev), upcoming[0]);
  const gapCenter = (targetPipe.topHeight + targetPipe.bottomY) / 2;

  // Nếu chim ở trên tâm khe quá cao, không nhảy, để rơi tự do
  // Nếu chim ở dưới tâm khe + margin, và đang rơi hoặc sắp rơi, thì nhảy
  const distanceToCenter = birdY - gapCenter; // dương nếu chim thấp hơn tâm
  if (distanceToCenter > TARGET_MARGIN && birdVelocity >= -1) { // birdVelocity >= -1 tức là đang rơi hoặc gần đứng yên
    // Kiểm tra cooldown
    if (frameCount - lastAutoJumpFrame >= AUTO_JUMP_COOLDOWN) {
      birdVelocity = JUMP_FORCE;
      lastAutoJumpFrame = frameCount;
      audioEngine.play('jump');
    }
  }
}

// --- 🧠 Cập nhật logic ---
function update() {
  if (!running || paused || gameOverFlag) return;

  // Auto play
  autoPlayLogic();

  // Vật lý chim
  birdVelocity += GRAVITY * speedMultiplier;
  birdY += birdVelocity;

  // Giới hạn màn hình (nếu không bất tử thì chết)
  if (birdY + BIRD_RADIUS > H || birdY - BIRD_RADIUS < 0) {
    if (!invincible) {
      gameOver();
      return;
    } else {
      birdY = Math.max(BIRD_RADIUS, Math.min(H - BIRD_RADIUS, birdY));
      birdVelocity = 0;
    }
  }

  // Di chuyển ống
  for (const pipe of pipes) {
    pipe.x -= BASE_PIPE_SPEED * speedMultiplier;

    const birdLeft = BIRD_X - BIRD_RADIUS;
    const birdRight = BIRD_X + BIRD_RADIUS;
    const birdTop = birdY - BIRD_RADIUS;
    const birdBottom = birdY + BIRD_RADIUS;
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        if (!invincible) {
          gameOver();
          return;
        } else {
          pipes = pipes.filter(p => p !== pipe);
          continue;
        }
      }
    }

    if (!pipe.passed && pipeRight < BIRD_X) {
      pipe.passed = true;
      score++;
      scoreSpan.textContent = score;
      audioEngine.play('coin');
    }
  }

  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

  const spawnRate = Math.max(60, Math.floor(120 / speedMultiplier));
  if (frameCount % spawnRate === 0) {
    spawnPipe();
  }
  frameCount++;
}

// --- Nhảy (người chơi) ---
function jump() {
  if (!running || paused || gameOverFlag) return;
  birdVelocity = JUMP_FORCE;
  audioEngine.play('jump');
}

// --- Tạm dừng ---
function togglePause() {
  if (!running || gameOverFlag) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
}

// --- Bắt đầu lại ---
function startGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  resetGame();
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
  refreshAdvancedPanel();
}

// --- Vòng lặp game ---
function gameLoop() {
  update();
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- 💾 Best score ---
async function loadBestScore() {
  try {
    await storage.openDB();
    const scores = await storage.getAll('gameScores');
    const entry = scores.find(s => s.gameName === 'flappybird');
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
      tx.objectStore('gameScores').put({ gameName: 'flappybird', score: bestScore });
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
        font-size: 12px; max-width: 240px;
        border: 1px solid #0f0;
      }
      .on { color: #0f0; } .off { color: #f00; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[I] Bất tử: <span id="inv-stat" class="off">OFF</span></div>
    <div>[A] Tự động: <span id="ai-stat" class="off">OFF</span></div>
    <div>[H] Hitbox: <span id="hitbox-stat" class="off">OFF</span></div>
    <div>[C] +100 điểm</div>
    <div>[ ] Tốc độ: <span id="panel-speed">1</span>x</div>
    <div>    [ : -0.25x | ] : +0.25x</div>
    <div>[T] Chậm (0.5x) | [Y] Nhanh (2x)</div>
    <div>[K] Kết thúc ngay</div>
    <div>[R] Dịch chuyển vào giữa khe cột</div>
    <div>[X] Xóa tất cả ống</div>
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
  set('ai-stat', autoPlay);
  set('hitbox-stat', showHitbox);
  document.getElementById('panel-speed').textContent = speedMultiplier;
  speedDisplay.textContent = speedMultiplier + 'x';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelShown = !panelShown;
  advancedPanel.style.display = panelShown ? 'block' : 'none';
}

// 📍 Dịch chuyển vào giữa khe cột gần nhất
function teleportToGap() {
  if (!running || paused || gameOverFlag) return;
  const upcoming = pipes.filter(p => !p.passed && p.x + PIPE_WIDTH > BIRD_X);
  if (upcoming.length === 0) {
    birdY = H / 2;
    birdVelocity = 0;
    return;
  }
  const target = upcoming.reduce((prev, curr) => (curr.x < prev.x ? curr : prev), upcoming[0]);
  const gapCenter = (target.topHeight + target.bottomY) / 2;
  birdY = gapCenter;
  birdVelocity = 0;
}

// --- ⌨️ Xử lý phím ---
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if (key === '`') {
    e.preventDefault();
    toggleAdvancedPanel();
    return;
  }

  if (key === ' ' || key === 'ArrowUp') {
    e.preventDefault();
    jump();
    return;
  }

  if (!isDevMode()) return;

  e.preventDefault();
  if (key === 'i' || key === 'I') { invincible = !invincible; refreshAdvancedPanel(); return; }
  if (key === 'a' || key === 'A') {
    autoPlay = !autoPlay;
    if (autoPlay) lastAutoJumpFrame = -AUTO_JUMP_COOLDOWN; // reset cooldown
    refreshAdvancedPanel();
    return;
  }
  if (key === 'h' || key === 'H') { showHitbox = !showHitbox; refreshAdvancedPanel(); draw(); return; }

  if (!running || gameOverFlag) return;
  if (paused) return;

  switch (key) {
    case 'c': case 'C': score += 100; scoreSpan.textContent = score; break;
    case '[': speedMultiplier = Math.max(0.25, speedMultiplier - 0.25); refreshAdvancedPanel(); break;
    case ']': speedMultiplier = Math.min(5, speedMultiplier + 0.25); refreshAdvancedPanel(); break;
    case 't': case 'T': speedMultiplier = 0.5; refreshAdvancedPanel(); break;
    case 'y': case 'Y': speedMultiplier = 2; refreshAdvancedPanel(); break;
    case 'k': case 'K': gameOver(); break;
    case 'r': case 'R': teleportToGap(); break;
    case 'x': case 'X': pipes = []; break;
    default: break;
  }
});

// Nút giao diện
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (canvas.requestFullscreen) canvas.requestFullscreen();
});

// Khởi động
loadBestScore().then(() => {
  createAdvancedPanel();
  startGame();
});