// 🏹 Archery - Vật lý parabol, hỗ trợ cảm ứng, DevMode
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const canvas = document.getElementById('archeryCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Vị trí bắn và bia
const ARCHER_X = 80;
const ARCHER_Y = H - 60;
const TARGET_X = 600;
const TARGET_Y = 120;
const TARGET_RADIUS = 70;

let arrow = null; // { x, y, vx, vy, active }
let score = 0, bestScore = 0;
let gameActive = true;
let power = 0;
let maxPower = 100;
let chargeRate = 0.7;
let isCharging = false;
let wind = 0; // Gió ngang (pixel/frame)
let arrowCount = Infinity;

// DevMode
let advancedPanel = null, panelVisible = false;
let autoAim = false;
let noWind = false;
let perfectShot = false;

audioEngine.init();

function resetGame() {
  arrow = null;
  power = 0;
  gameActive = true;
  wind = Math.random() * 4 - 2; // Gió ngẫu nhiên -2 đến 2
  updateHUD();
  render();
}

function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('bestDisplay').textContent = bestScore;
  document.getElementById('powerFill').style.height = power + '%';
  document.getElementById('powerText').textContent = Math.round(power) + '%';
  const windEl = document.getElementById('windDisplay');
  const absWind = Math.abs(wind);
  const dir = wind > 0 ? '➡️' : '⬅️';
  windEl.textContent = dir + ' ' + absWind.toFixed(1);
  document.getElementById('arrowsLeft').textContent = arrowCount === Infinity ? '∞' : arrowCount;
}

function render() {
  ctx.clearRect(0, 0, W, H);
  // Nền
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#87CEEB');
  grad.addColorStop(0.7, '#98FB98');
  grad.addColorStop(1, '#228B22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Mặt đất
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, H - 45, W, 10);

  // Cung thủ (hình người que)
  drawArcher();

  // Bia
  drawTarget(TARGET_X, TARGET_Y);

  // Mũi tên đang bay
  if (arrow && arrow.active) {
    drawArrow(arrow.x, arrow.y, Math.atan2(arrow.vy, arrow.vx));
  }

  // Đường ngắm (nếu đang sạc và chưa bắn)
  if (!arrow || !arrow.active) {
    if (isCharging || power > 0) {
      drawAimLine();
    }
  }
}

function drawArcher() {
  ctx.save();
  ctx.translate(ARCHER_X, ARCHER_Y);
  // Thân
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -40); // thân
  ctx.moveTo(0, -20);
  ctx.lineTo(-15, -30); // tay trái
  ctx.moveTo(0, -20);
  ctx.lineTo(15, -35); // tay phải (kéo cung)
  ctx.moveTo(0, -40);
  ctx.arc(0, -45, 8, 0, Math.PI * 2); // đầu
  ctx.stroke();
  // Cung
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(10, -30, 20, -Math.PI / 3, Math.PI / 3);
  ctx.stroke();
  // Dây cung (kéo theo power)
  const stringPull = power / maxPower * 15;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10 + 20 * Math.cos(-Math.PI / 3), -30 + 20 * Math.sin(-Math.PI / 3));
  ctx.lineTo(15, -35 - stringPull);
  ctx.lineTo(10 + 20 * Math.cos(Math.PI / 3), -30 + 20 * Math.sin(Math.PI / 3));
  ctx.stroke();
  ctx.restore();
}

function drawTarget(x, y) {
  const rings = [
    { r: TARGET_RADIUS, color: '#ffffff' },
    { r: TARGET_RADIUS * 0.8, color: '#000000' },
    { r: TARGET_RADIUS * 0.6, color: '#3498db' },
    { r: TARGET_RADIUS * 0.4, color: '#e74c3c' },
    { r: TARGET_RADIUS * 0.2, color: '#f1c40f' },
  ];
  for (const ring of rings) {
    ctx.beginPath();
    ctx.arc(x, y, ring.r, 0, Math.PI * 2);
    ctx.fillStyle = ring.color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawArrow(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(-25, -2, 50, 4);
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(25, -5);
  ctx.lineTo(35, 0);
  ctx.lineTo(25, 5);
  ctx.fill();
  ctx.fillStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(-25, -5);
  ctx.lineTo(-35, 0);
  ctx.lineTo(-25, 5);
  ctx.fill();
  ctx.restore();
}

function drawAimLine() {
  const angle = -Math.PI / 6 - (power / maxPower) * 0.3;
  const vx = Math.cos(angle) * power * 0.2;
  const vy = Math.sin(angle) * power * 0.2;
  let x = ARCHER_X, y = ARCHER_Y - 30;
  ctx.strokeStyle = 'rgba(255,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let t = 0; t < 50; t++) {
    x += vx;
    y += vy + t * 0.05; // Trọng lực
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- VẬT LÝ ---
function shootArrow() {
  if (arrow && arrow.active) return;
  if (!gameActive) return;
  if (arrowCount <= 0) return;

  const angle = -Math.PI / 6 - (power / maxPower) * 0.3;
  const speed = power * 0.2;
  arrow = {
    x: ARCHER_X,
    y: ARCHER_Y - 30,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    active: true
  };
  if (arrowCount !== Infinity) arrowCount--;
  power = 0;
  audioEngine.play('shoot');
  updateHUD();
}

function updateArrow() {
  if (!arrow || !arrow.active) return;
  // Trọng lực
  arrow.vy += 0.15;
  // Gió
  if (!noWind) arrow.vx += wind * 0.01;
  arrow.x += arrow.vx;
  arrow.y += arrow.vy;

  // Va chạm bia
  const dx = arrow.x - TARGET_X;
  const dy = arrow.y - TARGET_Y;
  const dist = Math.hypot(dx, dy);
  if (dist < TARGET_RADIUS + 15) {
    arrow.active = false;
    const points = calculateScore(dist);
    score += points;
    saveBest();
    audioEngine.play('hit');
    render(); // Vẽ lại để hiển thị vị trí mũi tên ghim vào bia
    return;
  }

  // Ra ngoài màn hình
  if (arrow.x > W + 50 || arrow.y > H + 50 || arrow.y < -50) {
    arrow.active = false;
    audioEngine.play('miss');
  }
}

function calculateScore(dist) {
  if (dist < TARGET_RADIUS * 0.2) return 10;
  if (dist < TARGET_RADIUS * 0.4) return 8;
  if (dist < TARGET_RADIUS * 0.6) return 6;
  if (dist < TARGET_RADIUS * 0.8) return 4;
  if (dist < TARGET_RADIUS) return 2;
  return 1;
}

// --- INPUT ---
canvas.addEventListener('mousedown', (e) => {
  if (!gameActive) return;
  if (arrow && arrow.active) return;
  isCharging = true;
  power = 0;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isCharging) return;
  power = Math.min(maxPower, power + chargeRate);
  updateHUD();
  render();
});

canvas.addEventListener('mouseup', () => {
  if (!isCharging) return;
  isCharging = false;
  shootArrow();
  render();
});

canvas.addEventListener('mouseleave', () => {
  if (isCharging) {
    isCharging = false;
    shootArrow();
    render();
  }
});

// Cảm ứng
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!gameActive) return;
  if (arrow && arrow.active) return;
  isCharging = true;
  power = 0;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isCharging) return;
  power = Math.min(maxPower, power + chargeRate * 1.5);
  updateHUD();
  render();
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (!isCharging) return;
  isCharging = false;
  shootArrow();
  render();
});

// --- GAME LOOP ---
function gameLoop() {
  if (arrow && arrow.active) {
    updateArrow();
    render();
  }
  requestAnimationFrame(gameLoop);
}

// --- BEST SCORE ---
async function loadBest() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'archery');
    bestScore = entry ? entry.score : 0;
  } catch (_) { bestScore = 0; }
  document.getElementById('bestDisplay').textContent = bestScore;
}
async function saveBest() {
  if (score > bestScore) {
    bestScore = score;
    document.getElementById('bestDisplay').textContent = bestScore;
    try {
      await storage.openDB();
      const tx = storage.db.transaction('gameScores', 'readwrite');
      tx.objectStore('gameScores').put({ gameName: 'archery', score: bestScore });
    } catch (_) {}
  }
}

// --- DEV PANEL ---
function createAdvancedPanel() {
  if (!isDevMode()) return;
  advancedPanel = document.createElement('div');
  advancedPanel.id = 'advanced-panel';
  advancedPanel.style.display = 'none';
  advancedPanel.innerHTML = `
    <style>#advanced-panel{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;padding:12px;border-radius:8px;z-index:9999;font-size:12px;max-width:240px;border:1px solid #0f0;}</style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[A] Tự động ngắm: <span id="autoStat">OFF</span></div>
    <div>[W] Tắt gió: <span id="windStat">OFF</span></div>
    <div>[P] Bắn hoàn hảo: <span id="perfStat">OFF</span></div>
    <div>[R] Reset</div>
  `;
  document.body.appendChild(advancedPanel);
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

document.addEventListener('keydown', e => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 'a': case 'A': autoAim = !autoAim; break;
    case 'w': case 'W': noWind = !noWind; break;
    case 'p': case 'P': perfectShot = !perfectShot; break;
    case 'r': case 'R': resetGame(); break;
  }
});

document.getElementById('newGameBtn').addEventListener('click', resetGame);
document.getElementById('fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen());

// Khởi động
loadBest().then(() => {
  createAdvancedPanel();
  resetGame();
  gameLoop();
});