// 🧱 Tetris - Canvas, ES Module, hỗ trợ nâng cao khi bật chế độ phát triển
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

// 📐 Kích thước bảng
const COLS = 10;
const ROWS = 20;
const CELL = 30;           // pixel mỗi ô
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// 📊 Thành phần giao diện
const scoreSpan = document.getElementById('score');
const linesSpan = document.getElementById('lines');
const bestSpan = document.getElementById('best');
const speedDisplay = document.getElementById('speedDisplay');

// 🧩 Định nghĩa các khối gạch (7 loại)
const PIECES = [
  { shape: [[1,1,1,1]], color: '#00f0f0' }, // I
  { shape: [[1,1],[1,1]], color: '#f0f000' }, // O
  { shape: [[0,1,0],[1,1,1]], color: '#a000f0' }, // T
  { shape: [[0,1,1],[1,1,0]], color: '#00f000' }, // S
  { shape: [[1,1,0],[0,1,1]], color: '#f00000' }, // Z
  { shape: [[1,0,0],[1,1,1]], color: '#0000f0' }, // J
  { shape: [[0,0,1],[1,1,1]], color: '#f0a000' }  // L
];

// 🎮 Trạng thái game
let board = [];
let currentPiece = null;
let nextPiece = null;           // piece tiếp theo (hiển thị next)
let queuePieces = [];           // danh sách chờ (5 piece)
let score = 0, lines = 0;
let bestScore = 0;
let running = false, paused = false, gameOverFlag = false;
let dropInterval = 1000;       // ms giữa các lần rơi tự động
let lastDropTime = 0;
let animationFrameId = null;

// 🕹️ Cờ hỗ trợ nâng cao (chỉ có hiệu lực trong DevMode)
let noGameOver = false;         // B: bất tử - không game over, tự động xóa dòng khi đầy
let showQueue = false;          // Q: hiển thị 5 piece tiếp theo
let ghostEnabled = true;        // G: bóng mờ (mặc định bật, nhưng có thể tắt bằng cheat)
let pieceSwap = false;          // cho phép đổi piece hiện tại (sẽ dùng phím riêng)

// 🖥️ Bảng điều khiển nâng cao (ẩn)
let advancedPanel = null;
let panelShown = false;

// 🔊 Khởi tạo âm thanh
audioEngine.init();

// --- 🛠️ Hàm tiện ích ---
function createBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPieceIndex() {
  return Math.floor(Math.random() * PIECES.length);
}

function makePiece(index) {
  const original = PIECES[index];
  return {
    shape: original.shape.map(row => [...row]),
    color: original.color,
    x: Math.floor((COLS - original.shape[0].length) / 2),
    y: 0,
    index: index
  };
}

function randomPiece() {
  return makePiece(randomPieceIndex());
}

// --- 🧱 Kiểm tra va chạm ---
function collides(piece, board) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const bx = piece.x + c;
        const by = piece.y + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
  }
  return false;
}

// --- 🔄 Xoay khối (có wall kick nhẹ) ---
function rotatePiece(piece) {
  const shape = piece.shape;
  const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
  const newPiece = { ...piece, shape: rotated };
  if (!collides(newPiece, board)) {
    piece.shape = rotated;
    return;
  }
  // Thử dịch trái/phải 1 ô
  for (let offset of [-1, 1]) {
    const kicked = { ...newPiece, x: piece.x + offset };
    if (!collides(kicked, board)) {
      piece.shape = rotated;
      piece.x += offset;
      return;
    }
  }
}

// --- 🔒 Gắn piece vào bảng ---
function lockPiece() {
  if (!currentPiece) return;
  for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[r].length; c++) {
      if (currentPiece.shape[r][c]) {
        const by = currentPiece.y + r;
        const bx = currentPiece.x + c;
        if (by < 0) {
          // Khối vượt quá đỉnh -> game over (trừ khi bất tử)
          if (noGameOver) {
            // Xóa toàn bộ bảng và tiếp tục
            board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
            // Không game over, nhưng phải đặt piece lại từ đầu
            currentPiece = nextPiece;
            nextPiece = queuePieces.length ? makePiece(queuePieces.shift()) : randomPiece();
            fillQueue();
            return;
          } else {
            endGame();
            return;
          }
        }
        board[by][bx] = currentPiece.color;
      }
    }
  }
  clearLines();
  // Lấy piece tiếp theo từ hàng chờ
  currentPiece = nextPiece;
  nextPiece = queuePieces.length ? makePiece(queuePieces.shift()) : randomPiece();
  fillQueue();
  // Kiểm tra game over ngay sau khi đặt piece mới
  if (collides(currentPiece, board)) {
    if (noGameOver) {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      // Tiếp tục
    } else {
      endGame();
    }
  }
}

// --- 🧹 Xóa dòng đầy và tính điểm ---
function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++; // kiểm tra lại dòng này (vì dòng mới được thêm vào)
    }
  }
  if (cleared > 0) {
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] || 800;
    lines += cleared;
    scoreSpan.textContent = score;
    linesSpan.textContent = lines;
    // Tăng tốc độ sau mỗi 2 dòng
    if (lines % 2 === 0 && dropInterval > 100) {
      dropInterval -= 50;
      speedDisplay.textContent = dropInterval + 'ms';
      refreshAdvancedPanel();
    }
    audioEngine.play('clear');
  }
}

// --- 💀 Kết thúc game ---
function endGame() {
  running = false;
  gameOverFlag = true;
  cancelAnimationFrame(animationFrameId);
  saveBest();
  // Vẽ overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 15);
  ctx.font = '16px sans-serif';
  ctx.fillText('Nhấn "Chơi lại" để tiếp tục', canvas.width/2, canvas.height/2 + 25);
  audioEngine.play('gameover');
}

// --- 🖼️ Vẽ toàn bộ khung hình ---
function draw() {
  // Không vẽ nếu game over (giữ nguyên overlay)
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Lưới nền
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== 0) {
        ctx.fillStyle = board[row][col];
        ctx.fillRect(col * CELL, row * CELL, CELL - 1, CELL - 1);
      }
      ctx.strokeRect(col * CELL, row * CELL, CELL, CELL);
    }
  }

  // Ghost piece (bóng mờ)
  if (ghostEnabled && currentPiece && !gameOverFlag) {
    let ghostY = currentPiece.y;
    while (!collides({ ...currentPiece, y: ghostY + 1 }, board)) {
      ghostY++;
    }
    ctx.globalAlpha = 0.3;
    drawPiece(currentPiece, ghostY);
    ctx.globalAlpha = 1.0;
  }

  // Piece hiện tại
  if (currentPiece && !gameOverFlag) {
    drawPiece(currentPiece, currentPiece.y);
  }
}

function drawPiece(piece, yPos) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const x = (piece.x + c) * CELL;
        const y = (yPos + r) * CELL;
        ctx.fillStyle = piece.color;
        ctx.fillRect(x, y, CELL - 1, CELL - 1);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, CELL, CELL);
      }
    }
  }
}

// --- 🧩 Vẽ piece tiếp theo (next) ---
function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextPiece) return;
  drawPieceOnCanvas(nextCtx, nextPiece, nextCanvas.width, nextCanvas.height);
}

// --- 🧩🧩 Vẽ hàng chờ (queue) ---
function drawQueue() {
  const container = document.getElementById('queueCanvases');
  if (!container) return;
  container.innerHTML = '';
  if (!showQueue) return;
  const size = 80; // mỗi canvas nhỏ
  for (let i = 0; i < queuePieces.length; i++) {
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    const ctx2 = cvs.getContext('2d');
    drawPieceOnCanvas(ctx2, makePiece(queuePieces[i]), size, size);
    container.appendChild(cvs);
  }
}

function drawPieceOnCanvas(context, piece, w, h) {
  context.clearRect(0, 0, w, h);
  const shape = piece.shape;
  const color = piece.color;
  const blockSize = 20;
  const offsetX = (w - shape[0].length * blockSize) / 2;
  const offsetY = (h - shape.length * blockSize) / 2;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        context.fillStyle = color;
        context.fillRect(offsetX + c * blockSize, offsetY + r * blockSize, blockSize - 1, blockSize - 1);
        context.strokeStyle = '#fff';
        context.strokeRect(offsetX + c * blockSize, offsetY + r * blockSize, blockSize, blockSize);
      }
    }
  }
}

// --- ⏬ Di chuyển xuống ---
function moveDown() {
  if (!currentPiece || gameOverFlag || paused) return;
  const moved = { ...currentPiece, y: currentPiece.y + 1 };
  if (!collides(moved, board)) {
    currentPiece.y++;
  } else {
    lockPiece();
  }
}

// --- ⬅➡ Di chuyển ngang ---
function moveLeft() {
  if (!currentPiece || gameOverFlag || paused) return;
  const moved = { ...currentPiece, x: currentPiece.x - 1 };
  if (!collides(moved, board)) {
    currentPiece.x--;
    audioEngine.play('move');
  }
}
function moveRight() {
  if (!currentPiece || gameOverFlag || paused) return;
  const moved = { ...currentPiece, x: currentPiece.x + 1 };
  if (!collides(moved, board)) {
    currentPiece.x++;
    audioEngine.play('move');
  }
}

// --- 🚀 Hard drop (rơi nhanh) ---
function hardDrop() {
  if (!currentPiece || gameOverFlag || paused) return;
  while (!collides({ ...currentPiece, y: currentPiece.y + 1 }, board)) {
    currentPiece.y++;
  }
  lockPiece();
  lastDropTime = performance.now();
}

// --- 🔄 Xoay ---
function rotate() {
  if (!currentPiece || gameOverFlag || paused) return;
  rotatePiece(currentPiece);
  audioEngine.play('rotate');
}

// --- ⏯️ Tạm dừng / tiếp tục ---
function togglePause() {
  if (!running || gameOverFlag) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
}

// --- 🟢 Bắt đầu / chơi lại ---
function startGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  createBoard();
  score = 0; lines = 0;
  dropInterval = 1000;
  gameOverFlag = false;
  running = true;
  paused = false;
  document.getElementById('pauseBtn').textContent = '⏸️ Tạm dừng';
  scoreSpan.textContent = score;
  linesSpan.textContent = lines;
  speedDisplay.textContent = dropInterval + 'ms';

  // Tạo hàng chờ
  queuePieces = [];
  for (let i = 0; i < 5; i++) queuePieces.push(randomPieceIndex());
  currentPiece = randomPiece();
  nextPiece = makePiece(queuePieces.shift());
  fillQueue();
  lastDropTime = performance.now();
  draw();
  drawNext();
  drawQueue();
  animationFrameId = requestAnimationFrame(gameLoop);
  refreshAdvancedPanel();
}

// Đảm bảo hàng chờ luôn có 5 piece
function fillQueue() {
  while (queuePieces.length < 5) {
    queuePieces.push(randomPieceIndex());
  }
  drawQueue();
}

// --- 🎮 Vòng lặp game ---
function gameLoop(timestamp) {
  if (!running || paused || gameOverFlag) {
    animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }
  if (timestamp - lastDropTime > dropInterval) {
    moveDown();
    lastDropTime = timestamp;
  }
  draw();
  drawNext();
  animationFrameId = requestAnimationFrame(gameLoop);
}

// --- 💾 Best score ---
async function loadBestScore() {
  try {
    await storage.openDB();
    const scores = await storage.getAll('gameScores');
    const entry = scores.find(s => s.gameName === 'tetris');
    bestScore = entry ? entry.score : 0;
  } catch (e) {
    bestScore = 0;
  }
  bestSpan.textContent = bestScore;
}

async function saveBest() {
  if (score > bestScore) {
    bestScore = score;
    bestSpan.textContent = bestScore;
    try {
      await storage.openDB();
      const tx = storage.db.transaction('gameScores', 'readwrite');
      tx.objectStore('gameScores').put({ gameName: 'tetris', score: bestScore });
    } catch (e) { /* offline */ }
  }
}

// --- 🖥️ Bảng điều khiển nâng cao (dành cho nhà phát triển) ---
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
    <div>[G] Ghost: <span id="ghost-stat" class="on">ON</span></div>
    <div>[Q] Hàng chờ: <span id="queue-stat" class="off">OFF</span></div>
    <div>[B] Bất tử: <span id="nogame-stat" class="off">OFF</span></div>
    <div>[C] +100 điểm</div>
    <div>[ ] Tốc độ: <span id="panel-speed">1000</span>ms</div>
    <div>    [ : -50ms | ] : +50ms</div>
    <div>[T] Chậm (500ms) | [Y] Nhanh (200ms)</div>
    <div>[K] Kết thúc ngay</div>
    <div>[R] Đổi piece hiện tại</div>
    <div>[D] Xóa một dòng cuối</div>
    <div>[S] Spawn piece mong muốn (1-7)</div>
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
  set('ghost-stat', ghostEnabled);
  set('queue-stat', showQueue);
  set('nogame-stat', noGameOver);
  document.getElementById('panel-speed').textContent = dropInterval;
  speedDisplay.textContent = dropInterval + 'ms';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelShown = !panelShown;
  advancedPanel.style.display = panelShown ? 'block' : 'none';
}

// --- ⌨️ Xử lý phím (bao gồm phím tắt nâng cao) ---
document.addEventListener('keydown', (e) => {
  const key = e.key;

  // Phím dấu huyền để bật/tắt bảng hỗ trợ
  if (key === '`') {
    e.preventDefault();
    toggleAdvancedPanel();
    return;
  }

  // Nếu không phải DevMode, chỉ điều khiển game thường
  if (!isDevMode()) {
    if (!running || paused || gameOverFlag) return;
    switch (key) {
      case 'ArrowLeft': moveLeft(); e.preventDefault(); break;
      case 'ArrowRight': moveRight(); e.preventDefault(); break;
      case 'ArrowDown': moveDown(); e.preventDefault(); break;
      case 'ArrowUp': rotate(); e.preventDefault(); break;
      case ' ': hardDrop(); e.preventDefault(); break;
      case 'Escape': togglePause(); break;
    }
    return;
  }

  // DevMode: ưu tiên phím nâng cao
  e.preventDefault();

  // Điều khiển cơ bản vẫn hoạt động
  if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(key)) {
    if (!running || paused || gameOverFlag) return;
    if (key === 'ArrowLeft') moveLeft();
    else if (key === 'ArrowRight') moveRight();
    else if (key === 'ArrowDown') moveDown();
    else if (key === 'ArrowUp') rotate();
    else if (key === ' ') hardDrop();
    return;
  }

  if (key === 'Escape') { togglePause(); return; }

  // Các chức năng nâng cao (chỉ khi game đang chạy và không game over)
  if (!running || gameOverFlag) {
    // Cho phép thay đổi ghost, queue, bất tử ngay cả khi game over (để tiện)
    if (key === 'g' || key === 'G') {
      ghostEnabled = !ghostEnabled; refreshAdvancedPanel(); if (running) draw();
    } else if (key === 'q' || key === 'Q') {
      showQueue = !showQueue;
      document.getElementById('queueContainer').style.display = showQueue ? 'block' : 'none';
      drawQueue(); refreshAdvancedPanel();
    } else if (key === 'b' || key === 'B') {
      noGameOver = !noGameOver; refreshAdvancedPanel();
    }
    return;
  }
  if (paused) return;

  switch (key) {
    case 'g': case 'G': ghostEnabled = !ghostEnabled; refreshAdvancedPanel(); draw(); break;
    case 'q': case 'Q':
      showQueue = !showQueue;
      document.getElementById('queueContainer').style.display = showQueue ? 'block' : 'none';
      drawQueue();
      refreshAdvancedPanel();
      break;
    case 'b': case 'B': noGameOver = !noGameOver; refreshAdvancedPanel(); break;
    case 'c': case 'C': score += 100; scoreSpan.textContent = score; break;
    case '[': dropInterval = Math.max(100, dropInterval - 50); refreshAdvancedPanel(); break;
    case ']': dropInterval = Math.min(2000, dropInterval + 50); refreshAdvancedPanel(); break;
    case 't': case 'T': dropInterval = 500; refreshAdvancedPanel(); break;
    case 'y': case 'Y': dropInterval = 200; refreshAdvancedPanel(); break;
    case 'k': case 'K': endGame(); break;
    case 'r': case 'R': // Đổi piece hiện tại thành piece ngẫu nhiên
      if (currentPiece) {
        const newIdx = randomPieceIndex();
        const newPiece = makePiece(newIdx);
        // Giữ nguyên vị trí x, y nếu không va chạm
        newPiece.x = currentPiece.x;
        newPiece.y = currentPiece.y;
        if (!collides(newPiece, board)) {
          currentPiece = newPiece;
          draw();
        }
      }
      break;
    case 'd': case 'D': // Xóa dòng cuối cùng có gạch
      {
        let rowToClear = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].some(cell => cell !== 0)) {
            rowToClear = r;
            break;
          }
        }
        if (rowToClear >= 0) {
          board.splice(rowToClear, 1);
          board.unshift(new Array(COLS).fill(0));
          draw();
        }
      }
      break;
    case 's': case 'S': // Spawn piece mong muốn (phím số 1-7 sau đó)
      // Sẽ lắng nghe phím số tiếp theo
      // Tạm thời ta dùng prompt? Để tránh phức tạp, ta gán piece mong muốn qua biến tạm
      // Ở đây ta có thể mở prompt nếu muốn, nhưng để giữ trải nghiệm, ta dùng cách: khi nhấn S, sau đó nhấn số 1-7.
      // Thêm biến `pendingSpawn` và xử lý ở keydown tiếp theo.
      break;
    default: break;
  }
});

// Xử lý spawn piece mong muốn sau khi nhấn S
let spawnPending = false;
document.addEventListener('keydown', function spawnHandler(e) {
  if (!isDevMode() || !running || paused || gameOverFlag) return;
  if (spawnPending && e.key >= '1' && e.key <= '7') {
    e.preventDefault();
    const idx = parseInt(e.key) - 1;
    currentPiece = makePiece(idx);
    // Đặt lại vị trí giữa đỉnh
    currentPiece.x = Math.floor((COLS - currentPiece.shape[0].length) / 2);
    currentPiece.y = 0;
    if (collides(currentPiece, board)) {
      if (noGameOver) {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      } else {
        endGame();
        return;
      }
    }
    draw();
    spawnPending = false;
  } else if (e.key === 's' || e.key === 'S') {
    spawnPending = true;
    e.preventDefault();
    // Đặt timeout để hủy nếu không nhấn số
    setTimeout(() => { spawnPending = false; }, 1000);
  }
});

// --- 📱 Cảm ứng (chỉ hỗ trợ vuốt cơ bản) ---
// (Có thể thêm sau, hiện tại tập trung bàn phím)

// Nút điều khiển
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