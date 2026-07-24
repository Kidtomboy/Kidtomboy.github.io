// 🦖 Dino Runner - Canvas, mô phỏng Chrome Dino, hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

// 🎨 Canvas & giao diện
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const bestSpan = document.getElementById('best');
const speedDisplay = document.getElementById('speedDisplay');

// 📐 Kích thước cố định
const W = canvas.width;
const H = canvas.height;

// 🦖 Khủng long (kích thước)
const DINO_WIDTH = 44;
const DINO_HEIGHT = 48;
const DINO_CROUCH_WIDTH = 52;
const DINO_CROUCH_HEIGHT = 28;
const DINO_X = 80;

// 🌵 Chướng ngại vật
const OBSTACLE_MIN_GAP = 280;
const OBSTACLE_SPEED_BASE = 5.5;

// 🦎 Thằn lằn bay
const PTERA_WIDTH = 42;
const PTERA_HEIGHT = 30;

// ☁️ Mây
const CLOUD_WIDTH = 80;
const CLOUD_HEIGHT = 28;

// 🎨 Màu nền
const DAY_SKY = '#ffffff';
const NIGHT_SKY = '#1a1a2e';
const DAY_GROUND = '#535353';
const NIGHT_GROUND = '#2d2d44';

// 🕹️ Trạng thái game
let dinoY = 0;
let dinoVY = 0;
let isJumping = false;
let isCrouching = false;
const groundY = H - 50;
let score = 0, bestScore = 0;
let running = false, paused = false, gameOverFlag = false;
let animationFrameId = null;
let speedMultiplier = 1;
let obstacles = [];
let clouds = [];
let frameCount = 0;
let nightMode = false;

// ⏱️ Đếm điểm theo thời gian thực (10 điểm/giây)
let lastScoreTime = 0;

// 🧰 Hỗ trợ nâng cao (DevMode)
let invincible = false;
let autoPilot = false;
let showHitbox = false;
let flying = false; // cheat bay lên đỉnh màn hình

// 🖥️ Bảng điều khiển nâng cao (ẩn)
let advancedPanel = null, panelShown = false;

// 🔊 Âm thanh
audioEngine.init();

// --- Vẽ khủng long (pixel art đơn giản) ---
function drawDino() {
  const x = DINO_X;
  const baseY = isCrouching ? groundY - DINO_CROUCH_HEIGHT : dinoY;
  const w = isCrouching ? DINO_CROUCH_WIDTH : DINO_WIDTH;
  const h = isCrouching ? DINO_CROUCH_HEIGHT : DINO_HEIGHT;
  const mainColor = '#535353';
  const darkColor = '#333';

  ctx.save();
  // Thân chính
  ctx.fillStyle = mainColor;
  ctx.fillRect(x, baseY + 10, w - 6, h - 20);

  // Đầu
  ctx.fillRect(x + w - 16, baseY, 16, 16);
  // Mắt
  ctx.fillStyle = 'white';
  ctx.fillRect(x + w - 10, baseY + 4, 5, 5);
  ctx.fillStyle = 'black';
  ctx.fillRect(x + w - 8, baseY + 6, 2, 2);

  // Đuôi
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(x, baseY + 15);
  ctx.lineTo(x - 10, baseY + 25);
  ctx.lineTo(x, baseY + 25);
  ctx.fill();

  // Chân (hoạt ảnh chạy đơn giản)
  ctx.fillStyle = darkColor;
  const legSwing = isCrouching ? 0 : Math.sin(frameCount * 0.3) * 3;
  ctx.fillRect(x + 4, baseY + h - 10, 5, 10 + legSwing);
  ctx.fillRect(x + w - 20, baseY + h - 10, 5, 10 - legSwing);

  // Gai trên lưng (nếu đứng)
  if (!isCrouching) {
    ctx.fillStyle = mainColor;
    ctx.fillRect(x + w - 14, baseY - 2, 3, 4);
    ctx.fillRect(x + w - 10, baseY - 1, 3, 3);
  }

  ctx.restore();
}

// --- Vẽ xương rồng (hình chữ nhật xếp chồng) ---
function drawCactus(obs) {
  ctx.fillStyle = nightMode ? '#5a7a5a' : '#2d6a2d';
  if (obs.cols === 1) {
    ctx.fillRect(obs.x, obs.y, 10, obs.h);
  } else if (obs.cols === 2) {
    ctx.fillRect(obs.x, obs.y, 10, obs.h);
    ctx.fillRect(obs.x + 14, obs.y, 10, obs.h);
  } else if (obs.cols === 3) {
    ctx.fillRect(obs.x, obs.y, 10, obs.h);
    ctx.fillRect(obs.x + 16, obs.y - 8, 10, obs.h + 8);
    ctx.fillRect(obs.x + 32, obs.y, 10, obs.h);
  }
}

// --- Vẽ thằn lằn bay (tam giác + cánh) ---
function drawPtera(obs) {
  ctx.fillStyle = nightMode ? '#7a7a5a' : '#6a6a2d';
  const wingFlap = Math.sin(obs.wingPhase * 0.35) * 4;
  // Thân
  ctx.beginPath();
  ctx.moveTo(obs.x + obs.w / 2, obs.y);
  ctx.lineTo(obs.x + obs.w, obs.y + obs.h / 2);
  ctx.lineTo(obs.x, obs.y + obs.h / 2);
  ctx.closePath();
  ctx.fill();
  // Cánh
  ctx.fillStyle = nightMode ? '#6a6a4a' : '#4a4a1a';
  ctx.beginPath();
  ctx.ellipse(obs.x + obs.w / 2, obs.y - 4 + wingFlap, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Vẽ mây ---
function drawCloud(cloud) {
  ctx.fillStyle = nightMode ? 'rgba(200,200,200,0.4)' : 'rgba(200,200,200,0.7)';
  ctx.beginPath();
  ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2);
  ctx.ellipse(cloud.x - 15, cloud.y + 5, cloud.w / 3, cloud.h / 3, 0, 0, Math.PI * 2);
  ctx.ellipse(cloud.x + 15, cloud.y + 5, cloud.w / 3, cloud.h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- 🎨 Vẽ toàn bộ khung hình ---
function draw() {
  if (!running) return; // không vẽ gì khi game kết thúc (giữ overlay game over)

  const bgColor = nightMode ? NIGHT_SKY : DAY_SKY;
  const groundColor = nightMode ? NIGHT_GROUND : DAY_GROUND;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Mặt đất
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = nightMode ? '#444' : '#888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // Vạch kẻ đường
  ctx.strokeStyle = nightMode ? '#666' : '#aaa';
  ctx.setLineDash([12, 18]);
  ctx.beginPath();
  ctx.moveTo(0, groundY + 15);
  ctx.lineTo(W, groundY + 15);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mây
  for (const cloud of clouds) drawCloud(cloud);

  // Chướng ngại vật
  for (const obs of obstacles) {
    if (obs.type === 'cactus') drawCactus(obs);
    else drawPtera(obs);
  }

  // Khủng long
  drawDino();

  // Hitbox (nếu bật)
  if (showHitbox) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    const dinoW = isCrouching ? DINO_CROUCH_WIDTH : DINO_WIDTH;
    const dinoH = isCrouching ? DINO_CROUCH_HEIGHT : DINO_HEIGHT;
    const dinoYY = isCrouching ? groundY - dinoH : dinoY;
    ctx.strokeRect(DINO_X, dinoYY, dinoW, dinoH);
    for (const obs of obstacles) ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
  }
}

// --- 🤖 AI tự động (tương tự các game trước) ---
function autoControl() {
  if (!autoPilot || !running || paused || gameOverFlag) return;
  for (const obs of obstacles) {
    const dinoW = isCrouching ? DINO_CROUCH_WIDTH : DINO_WIDTH;
    const dinoH = isCrouching ? DINO_CROUCH_HEIGHT : DINO_HEIGHT;
    const dinoYY = isCrouching ? groundY - dinoH : dinoY;
    if (obs.x + obs.w > DINO_X && obs.x < DINO_X + dinoW + 50) {
      if (obs.type === 'ptera' && obs.y + obs.h > dinoYY + 20) {
        isCrouching = true;
        isJumping = false;
      } else {
        if (!isJumping && dinoY === groundY - DINO_HEIGHT) {
          dinoVY = -12;
          isJumping = true;
          isCrouching = false;
        }
      }
      return;
    }
  }
  if (obstacles.length === 0 || obstacles[0].x > DINO_X + 100) {
    isCrouching = false;
  }
}

// --- ☁️🌵 Tạo đối tượng ---
function spawnCloud() {
  clouds.push({
    x: W + Math.random() * 200,
    y: 20 + Math.random() * 50,
    w: CLOUD_WIDTH + Math.random() * 60,
    h: CLOUD_HEIGHT + Math.random() * 10
  });
}

function spawnObstacle() {
  const r = Math.random();
  if (r < 0.5) {
    const cols = Math.random() < 0.5 ? 1 : 2;
    obstacles.push({
      type: 'cactus', x: W,
      y: groundY - 30 - (cols > 1 ? 18 : 0),
      w: 12 * cols + 2, h: 30 + (cols > 1 ? 18 : 0), cols
    });
  } else if (r < 0.8) {
    obstacles.push({
      type: 'cactus', x: W, y: groundY - 48,
      w: 46, h: 48, cols: 3
    });
  } else {
    obstacles.push({
      type: 'ptera', x: W,
      y: groundY - 55 - Math.random() * 35,
      w: PTERA_WIDTH, h: PTERA_HEIGHT, wingPhase: 0
    });
  }
}

// --- 🧠 Cập nhật logic mỗi frame ---
function update(now) {
  if (!running || paused || gameOverFlag) return;

  // Điểm tăng theo thời gian: 10 điểm mỗi giây (1 điểm mỗi 100ms)
  if (!lastScoreTime) lastScoreTime = now;
  while (now - lastScoreTime >= 100) {
    score++;
    lastScoreTime += 100;
    scoreSpan.textContent = score;
  }

  frameCount++;
  autoControl();

  // Vật lý khủng long (nếu không bay cheat)
  if (flying) {
    dinoY = 0; // dính đỉnh màn hình
    dinoVY = 0;
    isJumping = false;
    isCrouching = false;
  } else {
    if (isJumping) {
      dinoY += dinoVY;
      dinoVY += 0.7;
      if (dinoY >= groundY - DINO_HEIGHT) {
        dinoY = groundY - DINO_HEIGHT;
        isJumping = false;
        dinoVY = 0;
      }
    } else if (!isCrouching) {
      dinoY = groundY - DINO_HEIGHT;
    }
  }

  const baseSpeed = OBSTACLE_SPEED_BASE + Math.floor(score / 200) * 0.6;
  const speed = baseSpeed * speedMultiplier;

  // Di chuyển chướng ngại vật
  for (const obs of obstacles) {
    obs.x -= speed;
    if (obs.type === 'ptera') obs.wingPhase++;
  }
  // Di chuyển mây
  for (const cloud of clouds) cloud.x -= 1.2;

  // Xóa đối tượng ngoài màn hình
  obstacles = obstacles.filter(obs => obs.x + obs.w > -50);
  clouds = clouds.filter(c => c.x + c.w > -50);

  // Sinh mới
  if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < W - OBSTACLE_MIN_GAP) {
    if (Math.random() < 0.015) spawnObstacle();
  }
  if (clouds.length < 3 && Math.random() < 0.004) spawnCloud();

  // Va chạm (nếu không bất tử và không bay)
  if (!invincible && !flying) {
    const dinoW = isCrouching ? DINO_CROUCH_WIDTH : DINO_WIDTH;
    const dinoH = isCrouching ? DINO_CROUCH_HEIGHT : DINO_HEIGHT;
    const dinoYY = isCrouching ? groundY - dinoH : dinoY;
    for (const obs of obstacles) {
      if (
        DINO_X + dinoW - 6 > obs.x &&
        DINO_X + 6 < obs.x + obs.w &&
        dinoYY + dinoH - 4 > obs.y &&
        dinoYY + 4 < obs.y + obs.h
      ) {
        gameOver();
        return;
      }
    }
  }

  // Chuyển đổi ngày/đêm mỗi 500 điểm
  nightMode = Math.floor(score / 500) % 2 === 1;
  speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
}

// --- 💀 Kết thúc game ---
function gameOver() {
  running = false;
  gameOverFlag = true;
  cancelAnimationFrame(animationFrameId);
  saveBestScore();
  // Vẽ overlay game over (không gọi draw() để tránh mất overlay)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', W / 2, H / 2 - 15);
  ctx.font = '16px sans-serif';
  ctx.fillText('Nhấn "Chơi lại" để tiếp tục', W / 2, H / 2 + 25);
  audioEngine.play('gameover');
}

// --- 🟢 Bắt đầu lại ---
function startGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  score = 0;
  speedMultiplier = 1;
  running = true;
  paused = false;
  gameOverFlag = false;
  obstacles = [];
  clouds = [];
  frameCount = 0;
  nightMode = false;
  lastScoreTime = 0;
  dinoY = groundY - DINO_HEIGHT;
  dinoVY = 0;
  isJumping = false;
  isCrouching = false;
  flying = false;
  scoreSpan.textContent = '0';
  speedDisplay.textContent = '1.0x';
  document.getElementById('pauseBtn').textContent = '⏸️ Tạm dừng';
  for (let i = 0; i < 3; i++) spawnCloud();
  refreshAdvancedPanel();
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- ⏯️ Tạm dừng ---
function togglePause() {
  if (!running || gameOverFlag) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
}

// --- 🎮 Vòng lặp chính ---
function gameLoop(timestamp) {
  if (running && !paused && !gameOverFlag) {
    update(timestamp);
    draw();
  }
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- ⌨️ Điều khiển bàn phím & cheat ---
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === '`') {
    e.preventDefault();
    toggleAdvancedPanel();
    return;
  }

  // Nếu không phải DevMode: chỉ điều khiển game
  if (!isDevMode()) {
    if (!running || paused || gameOverFlag) return;
    if (key === ' ' || key === 'ArrowUp') {
      e.preventDefault();
      if (!isJumping && !isCrouching && !flying) {
        dinoVY = -12;
        isJumping = true;
      }
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      if (!flying) { isCrouching = true; isJumping = false; }
    }
    return;
  }

  // DevMode: ưu tiên cheat, nhưng vẫn cho điều khiển
  e.preventDefault();
  if (key === ' ' || key === 'ArrowUp') {
    if (running && !paused && !gameOverFlag && !isJumping && !isCrouching && !flying) {
      dinoVY = -12;
      isJumping = true;
    }
    return;
  }
  if (key === 'ArrowDown') {
    if (running && !paused && !gameOverFlag && !flying) {
      isCrouching = true; isJumping = false;
    }
    return;
  }

  // Cheat keys
  handleCheat(key);
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') isCrouching = false;
});

// --- 📱 Cảm ứng phân vùng ---
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!running || paused || gameOverFlag) return;
  const rect = canvas.getBoundingClientRect();
  const touchY = e.touches[0].clientY - rect.top;
  if (touchY < rect.height / 2) {
    if (!isJumping && !isCrouching && !flying) {
      dinoVY = -12;
      isJumping = true;
    }
  } else {
    if (!flying) { isCrouching = true; isJumping = false; }
  }
});
canvas.addEventListener('touchend', () => { isCrouching = false; });
canvas.addEventListener('touchcancel', () => { isCrouching = false; });

// --- 🧰 Xử lý cheat ---
function handleCheat(key) {
  switch (key) {
    case 'i': case 'I': invincible = !invincible; refreshAdvancedPanel(); break;
    case 'a': case 'A': autoPilot = !autoPilot; refreshAdvancedPanel(); break;
    case 'h': case 'H': showHitbox = !showHitbox; refreshAdvancedPanel(); break;
    case 'c': case 'C': score += 100; scoreSpan.textContent = score; break;
    case '[': speedMultiplier = Math.max(0.25, speedMultiplier - 0.25); refreshAdvancedPanel(); break;
    case ']': speedMultiplier = Math.min(5, speedMultiplier + 0.25); refreshAdvancedPanel(); break;
    case 't': case 'T': speedMultiplier = 0.5; refreshAdvancedPanel(); break;
    case 'y': case 'Y': speedMultiplier = 2; refreshAdvancedPanel(); break;
    case 'k': case 'K': if (running) gameOver(); break;
    case 'r': case 'R': // Bay lên đỉnh màn hình
      flying = !flying;
      if (flying) {
        dinoY = 0;
        dinoVY = 0;
        isJumping = false;
        isCrouching = false;
      }
      refreshAdvancedPanel();
      break;
    default: break;
  }
}

// --- 💾 Best score (IndexedDB) ---
async function loadBestScore() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'dino');
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
      tx.objectStore('gameScores').put({ gameName: 'dino', score: bestScore });
    } catch (_) {}
  }
}

// --- 🖥️ Bảng hỗ trợ phát triển (cheat panel ẩn) ---
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
    <div>[A] Tự động: <span id="ai-stat" class="off">OFF</span></div>
    <div>[H] Hitbox: <span id="hit-stat" class="off">OFF</span></div>
    <div>[R] Bay lên: <span id="fly-stat" class="off">OFF</span></div>
    <div>[C] +100 điểm</div>
    <div>[ ] Tốc độ: <span id="panel-speed">1</span>x</div>
    <div>    [ : -0.25x | ] : +0.25x</div>
    <div>[T] Chậm (0.5x) | [Y] Nhanh (2x)</div>
    <div>[K] Kết thúc ngay</div>
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
  set('ai-stat', autoPilot);
  set('hit-stat', showHitbox);
  set('fly-stat', flying);
  document.getElementById('panel-speed').textContent = speedMultiplier.toFixed(1);
  speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelShown = !panelShown;
  advancedPanel.style.display = panelShown ? 'block' : 'none';
}

// Nút UI
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