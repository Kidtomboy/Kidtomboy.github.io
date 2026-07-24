// 🐍 Snake Game - Canvas, ES Module, bản đồ không biên giới, hỗ trợ nâng cao khi bật chế độ phát triển
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

// 🎨 Khởi tạo canvas & thành phần giao diện
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const bestSpan = document.getElementById('best');
const speedDisplay = document.getElementById('speedDisplay');

// 📐 Tham số cơ bản
const GRID_SIZE = 20;
let cols, rows;                     // số ô theo chiều ngang / dọc
let snake, food, dir, nextDir;
let score = 0, bestScore = 0;
let running = false, paused = false;
let intervalId = null;
let tickMs = 100;                   // mili giây mỗi bước, mặc định 100ms

// 🧰 Các cờ chế độ nâng cao (chỉ có hiệu lực khi DevMode được kích hoạt)
let invincible = false;            // bất tử (không chết khi tự cắn)
let autoPlay = false;              // tự động điều khiển
let tracePath = false;            // hiển thị đường đi đến mồi
let boardVariant = 0;              // kiểu bản đồ: 0-vuông, 1-ngang, 2-dọc
const BOARD_PRESETS = [
  { w: 400, h: 400 },
  { w: 600, h: 300 },
  { w: 300, h: 600 }
];

// 🖥️ Bảng điều khiển nâng cao (ẩn mặc định, chỉ dành cho DevMode)
let advancedPanel = null;
let panelShown = false;

// 🔊 Sẵn sàng âm thanh
audioEngine.init();

// --- Cập nhật kích thước canvas theo biến thể bản đồ ---
function applyBoardSize() {
  const preset = BOARD_PRESETS[boardVariant];
  canvas.width = preset.w;
  canvas.height = preset.h;
  cols = Math.floor(canvas.width / GRID_SIZE);
  rows = Math.floor(canvas.height / GRID_SIZE);
}

// --- Tạo bảng điều khiển nâng cao (chỉ khi ở chế độ phát triển) ---
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
    <div><b>BẢNG HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[G] Bất tử: <span id="inv-stat" class="off">OFF</span></div>
    <div>[A] Tự động: <span id="ai-stat" class="off">OFF</span></div>
    <div>[P] Đường dẫn: <span id="path-stat" class="off">OFF</span></div>
    <div>[M] Kiểu bản đồ: <span id="map-stat">Vuông</span></div>
    <div>[C] Thêm 100 điểm</div>
    <div>[ ] Tốc độ: <span id="panel-speed">100</span>ms</div>
    <div>    [ : -10ms | ] : +10ms</div>
    <div>[T] Chậm (200ms) | [Y] Nhanh (50ms)</div>
    <div>[K] Kết thúc ngay | [R] Dịch chuyển</div>
    <div>[I] +1 đốt | [O] -1 đốt</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshAdvancedPanel();
}

// --- Đồng bộ trạng thái hiển thị của bảng nâng cao ---
function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val ? 'ON' : 'OFF'; el.className = val ? 'on' : 'off'; }
  };
  set('inv-stat', invincible);
  set('ai-stat', autoPlay);
  set('path-stat', tracePath);
  document.getElementById('map-stat').textContent = ['Vuông', 'Ngang', 'Dọc'][boardVariant];
  document.getElementById('panel-speed').textContent = tickMs;
  speedDisplay.textContent = tickMs + 'ms';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelShown = !panelShown;
  advancedPanel.style.display = panelShown ? 'block' : 'none';
}

// --- Điểm cao ---
async function loadBest() {
  try {
    await storage.openDB();
    const all = await storage.getAll('gameScores');
    const entry = all.find(s => s.gameName === 'snake');
    bestScore = entry ? entry.score : 0;
  } catch (_) { bestScore = 0; }
  bestSpan.textContent = bestScore;
}

async function saveBest() {
  if (score > bestScore) {
    bestScore = score;
    bestSpan.textContent = bestScore;
    try {
      await storage.openDB();
      const tx = storage.db.transaction('gameScores', 'readwrite');
      tx.objectStore('gameScores').put({ gameName: 'snake', score: bestScore });
    } catch (_) {}
  }
}

// --- Mồi ---
function randomFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  food = pos;
}

// --- Vẽ ---
function draw() {
  // Chỉ vẽ khi game đang chạy, nếu không sẽ giữ nguyên màn hình hiện tại (có thể là overlay Game Over)
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = getComputedStyle(document.body).getPropertyValue('--bg-primary').trim() || '#0f172a';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lưới mờ khi hiện đường dẫn
  if (tracePath) {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < cols; i++) {
      ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < rows; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * GRID_SIZE); ctx.lineTo(canvas.width, j * GRID_SIZE); ctx.stroke();
    }
  }

  // Mồi
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(food.x * GRID_SIZE + GRID_SIZE/2, food.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 1, 0, Math.PI*2);
  ctx.fill();

  // Rắn
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#10b981' : '#34d399';
    ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    // Mắt rắn
    if (i === 0) {
      ctx.fillStyle = 'white';
      const e = GRID_SIZE / 5;
      const x = seg.x * GRID_SIZE, y = seg.y * GRID_SIZE;
      if (dir.x === 1) {
        ctx.fillRect(x + GRID_SIZE - e - 2, y + 2, e, e);
        ctx.fillRect(x + GRID_SIZE - e - 2, y + GRID_SIZE - e - 2, e, e);
      } else if (dir.x === -1) {
        ctx.fillRect(x + 2, y + 2, e, e);
        ctx.fillRect(x + 2, y + GRID_SIZE - e - 2, e, e);
      } else if (dir.y === -1) {
        ctx.fillRect(x + 2, y + 2, e, e);
        ctx.fillRect(x + GRID_SIZE - e - 2, y + 2, e, e);
      } else if (dir.y === 1) {
        ctx.fillRect(x + 2, y + GRID_SIZE - e - 2, e, e);
        ctx.fillRect(x + GRID_SIZE - e - 2, y + GRID_SIZE - e - 2, e, e);
      }
    }
  });

  // Đường dẫn (nếu bật)
  if (tracePath) drawPath();

  // Hiệu ứng viền khi bất tử
  canvas.style.borderColor = invincible ? '#fbbf24' : 'var(--accent)';
  canvas.style.boxShadow = invincible ? '0 0 15px #fbbf24' : 'none';
}

// --- Tìm và vẽ đường đi đến mồi (BFS) ---
function drawPath() {
  const start = snake[0];
  const q = [[start.x, start.y]];
  const parent = new Map();
  parent.set(`${start.x},${start.y}`, null);
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
  let found = false;
  while (q.length) {
    const [cx, cy] = q.shift();
    if (cx === food.x && cy === food.y) { found = true; break; }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (snake.some(s => s.x === nx && s.y === ny)) continue;
      const key = `${nx},${ny}`;
      if (!parent.has(key)) { parent.set(key, [cx, cy]); q.push([nx, ny]); }
    }
  }
  if (!found) return;
  const path = [];
  let cur = [food.x, food.y];
  while (cur) {
    path.unshift(cur);
    cur = parent.get(`${cur[0]},${cur[1]}`);
  }
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(path[0][0] * GRID_SIZE + GRID_SIZE/2, path[0][1] * GRID_SIZE + GRID_SIZE/2);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0] * GRID_SIZE + GRID_SIZE/2, path[i][1] * GRID_SIZE + GRID_SIZE/2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- AI tự chơi ---
function autoMove() {
  if (!autoPlay || !running || paused) return;
  const head = snake[0];
  const moves = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
  const valid = moves.filter(m => {
    if (m.x === -dir.x && m.y === -dir.y) return false;
    const nx = head.x + m.x, ny = head.y + m.y;
    if (!invincible && snake.some(s => s.x === nx && s.y === ny)) return false;
    return true;
  });
  if (valid.length === 0) return;
  valid.sort((a,b) => {
    const dA = Math.abs(head.x+a.x - food.x) + Math.abs(head.y+a.y - food.y);
    const dB = Math.abs(head.x+b.x - food.x) + Math.abs(head.y+b.y - food.y);
    return dA - dB;
  });
  nextDir = { x: valid[0].x, y: valid[0].y };
}

// --- Di chuyển rắn ---
function step() {
  if (!running || paused) return;
  if (autoPlay) autoMove();

  // Không cho phép quay đầu 180°
  if (nextDir.x === -dir.x && nextDir.y === -dir.y) {
    nextDir = { ...dir };
  }
  dir = { ...nextDir };

  let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Bản đồ luôn cuộn (wrap)
  if (head.x < 0) head.x = cols - 1;
  if (head.x >= cols) head.x = 0;
  if (head.y < 0) head.y = rows - 1;
  if (head.y >= rows) head.y = 0;

  // Kiểm tra tự cắn (trừ khi đang bất tử)
  if (!invincible && snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreSpan.textContent = score;
    randomFood();
    audioEngine.play('coin');
  } else {
    snake.pop();
  }
  draw();
}

// --- Kết thúc game ---
function endGame() {
  clearInterval(intervalId);
  running = false;
  // Vẽ overlay Game Over
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 15);
  ctx.font = '16px sans-serif';
  ctx.fillText('Nhấn "Chơi lại" để tiếp tục', canvas.width/2, canvas.height/2 + 25);
  saveBest();
}

// --- Bắt đầu ván mới ---
function startGame() {
  applyBoardSize();
  const sx = Math.floor(cols / 2), sy = Math.floor(rows / 2);
  snake = [
    { x: sx, y: sy },
    { x: sx-1, y: sy },
    { x: sx-2, y: sy }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  scoreSpan.textContent = score;
  randomFood();
  running = true;
  paused = false;
  document.getElementById('pauseBtn').textContent = '⏸️ Tạm dừng';
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(step, tickMs);
  draw();
  refreshAdvancedPanel();
  speedDisplay.textContent = tickMs + 'ms';
}

// --- Tạm dừng / tiếp tục ---
function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    clearInterval(intervalId);
    document.getElementById('pauseBtn').textContent = '▶️ Tiếp tục';
  } else {
    intervalId = setInterval(step, tickMs);
    document.getElementById('pauseBtn').textContent = '⏸️ Tạm dừng';
  }
}

// --- Thay đổi kiểu bản đồ ---
function cycleBoardVariant() {
  boardVariant = (boardVariant + 1) % 3;
  refreshAdvancedPanel();
  startGame();  // reset để áp dụng
}

// --- Các hàm hỗ trợ nâng cao (chỉ hoạt động khi game đang chạy) ---
function teleportHead() {
  if (!running || paused) return;
  let nx, ny;
  do {
    nx = Math.floor(Math.random() * cols);
    ny = Math.floor(Math.random() * rows);
  } while (snake.some(s => s.x === nx && s.y === ny));
  snake[0] = { x: nx, y: ny };
  draw();
}

function addSegment() {
  if (!running || paused) return;
  const tail = snake[snake.length-1];
  snake.push({ ...tail });
  draw();
}

function removeSegment() {
  if (!running || paused) return;
  if (snake.length > 1) {
    snake.pop();
    draw();
  }
}

// --- Điều khiển bàn phím ---
document.addEventListener('keydown', (e) => {
  const key = e.key;

  // Phím dấu huyền để bật/tắt bảng hỗ trợ (dành cho nhà phát triển)
  if (key === '`') {
    e.preventDefault();
    toggleAdvancedPanel();
    return;
  }

  // Nếu không phải chế độ phát triển, chỉ cho phép điều khiển rắn
  if (!isDevMode()) {
    if (!running || paused) return;
    switch (key) {
      case 'ArrowUp': if (dir.y === 0) nextDir = { x:0, y:-1 }; e.preventDefault(); break;
      case 'ArrowDown': if (dir.y === 0) nextDir = { x:0, y:1 }; e.preventDefault(); break;
      case 'ArrowLeft': if (dir.x === 0) nextDir = { x:-1, y:0 }; e.preventDefault(); break;
      case 'ArrowRight': if (dir.x === 0) nextDir = { x:1, y:0 }; e.preventDefault(); break;
    }
    return;
  }

  // --- Các phím nâng cao dành cho nhà phát triển (DevMode) ---
  e.preventDefault();

  // Điều khiển hướng (vẫn hoạt động bình thường)
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
    if (!running || paused) return;
    if (key === 'ArrowUp' && dir.y === 0) nextDir = { x:0, y:-1 };
    else if (key === 'ArrowDown' && dir.y === 0) nextDir = { x:0, y:1 };
    else if (key === 'ArrowLeft' && dir.x === 0) nextDir = { x:-1, y:0 };
    else if (key === 'ArrowRight' && dir.x === 0) nextDir = { x:1, y:0 };
    return;
  }

  // Các chức năng hỗ trợ chỉ hoạt động khi game đang chạy (trừ một số ngoại lệ)
  if (!running || paused) {
    // Cho phép kết thúc ngay (K) ngay cả khi đang game over? Không, nếu game không chạy thì bỏ qua.
    // Cho phép thay đổi bản đồ (M) và bất tử (G) bất kể trạng thái? Nhưng thay đổi bản đồ sẽ reset game.
    if (key === 'm' || key === 'M') { cycleBoardVariant(); }
    // Các nút khác bị chặn nếu game không chạy
    return;
  }

  switch (key) {
    case 'g': case 'G': invincible = !invincible; refreshAdvancedPanel(); draw(); break;
    case 'a': case 'A': autoPlay = !autoPlay; refreshAdvancedPanel(); break;
    case 'p': case 'P': tracePath = !tracePath; refreshAdvancedPanel(); draw(); break;
    case 'c': case 'C': score += 100; scoreSpan.textContent = score; break;
    case '[': tickMs = Math.max(20, tickMs - 10); refreshAdvancedPanel(); resetInterval(); break;
    case ']': tickMs = Math.min(300, tickMs + 10); refreshAdvancedPanel(); resetInterval(); break;
    case 't': case 'T': tickMs = 200; refreshAdvancedPanel(); resetInterval(); break;
    case 'y': case 'Y': tickMs = 50; refreshAdvancedPanel(); resetInterval(); break;
    case 'k': case 'K': endGame(); break;
    case 'r': case 'R': teleportHead(); break;
    case 'i': case 'I': addSegment(); break;
    case 'o': case 'O': removeSegment(); break;
    default: break;
  }
});

function resetInterval() {
  if (running && !paused) {
    clearInterval(intervalId);
    intervalId = setInterval(step, tickMs);
  }
}

// --- Cảm ứng ---
let touchX0 = 0, touchY0 = 0;
canvas.addEventListener('touchstart', e => {
  touchX0 = e.touches[0].clientX; touchY0 = e.touches[0].clientY;
});
canvas.addEventListener('touchend', e => {
  if (!running || paused) return;
  const dx = e.changedTouches[0].clientX - touchX0;
  const dy = e.changedTouches[0].clientY - touchY0;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && dir.x === 0) nextDir = { x:1, y:0 };
    else if (dx < 0 && dir.x === 0) nextDir = { x:-1, y:0 };
  } else {
    if (dy > 0 && dir.y === 0) nextDir = { x:0, y:1 };
    else if (dy < 0 && dir.y === 0) nextDir = { x:0, y:-1 };
  }
});

// Nút bấm
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (canvas.requestFullscreen) canvas.requestFullscreen();
});

// Khởi động
loadBest().then(() => {
  createAdvancedPanel();
  startGame();
});