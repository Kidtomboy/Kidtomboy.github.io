// 🎯 Tic Tac Toe - hỗ trợ nhiều kích thước, Endless Canvas, AI, DevMode
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const boardGrid = document.getElementById('boardGrid');
const endlessCanvas = document.getElementById('endlessCanvas');
const ctx = endlessCanvas.getContext('2d');
const statusEl = document.getElementById('status');
const playerSpan = document.getElementById('player');
const winsSpan = document.getElementById('wins');
const drawsSpan = document.getElementById('draws');
const aiWinsSpan = document.getElementById('aiWins');
const modeSelect = document.getElementById('modeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const sizeSelect = document.getElementById('sizeSelect');
const newGameBtn = document.getElementById('newGameBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Trạng thái
let board = [];
let size = 3;               // 3,4,5,20
let winLength = 3;          // số ô liên tiếp để thắng
let currentPlayer = 'X';
let playerSymbol = 'X', aiSymbol = 'O';
let gameActive = true;
let mode = 'ai';            // 'pvp' hoặc 'ai'
let difficulty = 'medium';  // 'easy','medium','hard'
let wins = 0, draws = 0, aiWins = 0;

// Endless canvas variables
let canvasScale = 1;
let canvasOffsetX = 0, canvasOffsetY = 0;
let isDragging = false;
let lastMouseX, lastMouseY;
let lastPinchDist = 0;

// DevMode
let showDevPanel = false;
let advancedPanel = null;
let panelVisible = false;

audioEngine.init();

// --- Khởi tạo bảng ---
function initBoard(newSize) {
  size = newSize;
  winLength = size === 20 ? 5 : size; // Endless yêu cầu 5 ô liên tiếp
  board = Array(size).fill().map(() => Array(size).fill(null));
  currentPlayer = playerSymbol;
  gameActive = true;
  renderBoard();
  updateStatus('Lượt của bạn (' + playerSymbol + ')');
  if (size === 20) {
    // Chuyển sang canvas
    boardGrid.style.display = 'none';
    endlessCanvas.style.display = 'block';
    resetCanvasView();
    drawCanvas();
  } else {
    boardGrid.style.display = 'grid';
    endlessCanvas.style.display = 'none';
    boardGrid.style.gridTemplateColumns = `repeat(${size}, minmax(40px, 80px))`;
    boardGrid.style.gridTemplateRows = `repeat(${size}, minmax(40px, 80px))`;
    renderGridCells();
  }
}

// --- Render Grid (bảng nhỏ) ---
function renderGridCells() {
  boardGrid.innerHTML = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => cellClick(r, c));
      boardGrid.appendChild(cell);
    }
  }
}

function renderBoard() {
  if (size === 20) {
    drawCanvas();
    return;
  }
  const cells = boardGrid.querySelectorAll('.cell');
  cells.forEach(cell => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    const val = board[r][c];
    cell.textContent = val || '';
    cell.className = 'cell';
    if (val === 'X') cell.classList.add('x');
    if (val === 'O') cell.classList.add('o');
  });
}

// --- Xử lý click trên grid ---
function cellClick(row, col) {
  if (!gameActive) return;
  if (board[row][col] !== null) return;
  if (mode === 'ai' && currentPlayer !== playerSymbol) return;
  makeMove(row, col);
}

function makeMove(row, col) {
  board[row][col] = currentPlayer;
  renderBoard();
  audioEngine.play('click');

  const result = checkWinner(board, row, col, winLength);
  if (result) {
    endGame(result.winner, result.line);
    return;
  }
  if (isBoardFull()) {
    endGame(null);
    return;
  }

  // Chuyển lượt
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateStatus(currentPlayer === playerSymbol ? 'Lượt của bạn (' + playerSymbol + ')' : 'AI đang suy nghĩ...');
  
  if (mode === 'ai' && currentPlayer === aiSymbol && gameActive) {
    setTimeout(aiMove, 200);
  }
}

// --- Kiểm tra thắng (tổng quát) ---
function checkWinner(b, row, col, len) {
  const directions = [[0,1],[1,0],[1,1],[1,-1]];
  const val = b[row][col];
  if (!val) return null;

  for (const [dx, dy] of directions) {
    let count = 1;
    const line = [[row, col]];
    // Kiểm tra theo hướng dương
    for (let i = 1; i < len; i++) {
      const r = row + dx * i, c = col + dy * i;
      if (r >= 0 && r < size && c >= 0 && c < size && b[r][c] === val) {
        count++;
        line.push([r,c]);
      } else break;
    }
    // Kiểm tra theo hướng âm
    for (let i = 1; i < len; i++) {
      const r = row - dx * i, c = col - dy * i;
      if (r >= 0 && r < size && c >= 0 && c < size && b[r][c] === val) {
        count++;
        line.unshift([r,c]);
      } else break;
    }
    if (count >= len) {
      return { winner: val, line };
    }
  }
  return null;
}

function isBoardFull() {
  return board.every(row => row.every(cell => cell !== null));
}

function endGame(winner, line = null) {
  gameActive = false;
  if (winner) {
    if (winner === playerSymbol) {
      wins++;
      winsSpan.textContent = wins;
      statusEl.textContent = 'Bạn thắng! 🎉';
      audioEngine.play('win');
    } else {
      aiWins++;
      aiWinsSpan.textContent = aiWins;
      statusEl.textContent = 'AI thắng! 😞';
      audioEngine.play('lose');
    }
    if (line && size < 20) highlightWin(line);
    if (size === 20) drawCanvas(); // vẽ lại để thấy đường thắng
  } else {
    draws++;
    drawsSpan.textContent = draws;
    statusEl.textContent = 'Hòa! 🤝';
    audioEngine.play('draw');
  }
  saveStats();
}

function highlightWin(line) {
  const cells = boardGrid.querySelectorAll('.cell');
  line.forEach(([r,c]) => {
    const idx = r * size + c;
    if (cells[idx]) cells[idx].classList.add('win');
  });
}

// --- AI sử dụng Minimax + Alpha-Beta cho bảng nhỏ, heuristic cho bảng lớn ---
function aiMove() {
  if (!gameActive) return;
  let move;
  if (size <= 5) {
    move = getBestMoveMinimax();
  } else {
    move = getBestMoveHeuristic();
  }
  if (move) {
    makeMove(move.row, move.col);
  }
}

function getBestMoveMinimax() {
  const depth = difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 3 : 5);
  let bestScore = -Infinity;
  let bestMove = null;
  const moves = getEmptyCells();
  // Sắp xếp moves để tăng cắt tỉa (gần trung tâm hơn)
  moves.sort((a,b) => Math.abs(a.row - size/2) + Math.abs(a.col - size/2) - (Math.abs(b.row - size/2) + Math.abs(b.col - size/2)));
  for (const {row, col} of moves) {
    board[row][col] = aiSymbol;
    const score = alphaBeta(board, depth - 1, -Infinity, Infinity, false);
    board[row][col] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = {row, col};
    }
  }
  return bestMove;
}

function alphaBeta(b, depth, alpha, beta, isMaximizing) {
  // Đánh giá trạng thái cuối
  const result = evaluateBoard(b);
  if (result !== null) return result === aiSymbol ? 1000 : -1000;
  if (depth === 0 || isBoardFull()) return heuristic(b);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const {row, col} of getEmptyCells(b)) {
      b[row][col] = aiSymbol;
      const score = alphaBeta(b, depth - 1, alpha, beta, false);
      b[row][col] = null;
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const {row, col} of getEmptyCells(b)) {
      b[row][col] = playerSymbol;
      const score = alphaBeta(b, depth - 1, alpha, beta, true);
      b[row][col] = null;
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function evaluateBoard(b) {
  // Kiểm tra xem có ai thắng không
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (b[r][c]) {
        const res = checkWinner(b, r, c, winLength);
        if (res) return res.winner;
      }
    }
  }
  return null;
}

function heuristic(b) {
  // Đếm số hàng mở cho mỗi bên (đơn giản: ưu tiên chiếm trung tâm)
  let score = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (b[r][c] === aiSymbol) score += (10 - Math.abs(r - size/2) - Math.abs(c - size/2));
      else if (b[r][c] === playerSymbol) score -= (10 - Math.abs(r - size/2) - Math.abs(c - size/2));
    }
  }
  return score;
}

function getEmptyCells(b = board) {
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!b[r][c]) cells.push({row: r, col: c});
    }
  }
  return cells;
}

// AI cho bảng lớn: heuristic nhanh
function getBestMoveHeuristic() {
  // Tìm nước có điểm cao nhất dựa trên pattern xung quanh
  const candidates = getEmptyCells();
  if (candidates.length === 0) return null;
  // Giới hạn chỉ xét các ô gần quân đã đánh (bán kính 2) để tăng tốc
  const nearby = candidates.filter(({row, col}) => {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < size && c >= 0 && c < size && board[r][c]) return true;
      }
    }
    return false;
  });
  const pool = nearby.length > 0 ? nearby : candidates;
  let bestScore = -Infinity;
  let bestMove = pool[0];
  for (const {row, col} of pool) {
    // Điểm: ưu tiên tạo hàng dài hoặc chặn đối thủ
    board[row][col] = aiSymbol;
    const aiScore = evaluatePosition(board, row, col, aiSymbol);
    board[row][col] = playerSymbol;
    const playerScore = evaluatePosition(board, row, col, playerSymbol);
    board[row][col] = null;
    const total = aiScore * 1.1 + playerScore; // chặn đối thủ quan trọng hơn
    if (total > bestScore) {
      bestScore = total;
      bestMove = {row, col};
    }
  }
  return bestMove;
}

function evaluatePosition(b, row, col, symbol) {
  // Đếm số hàng liên tiếp tối đa có thể tạo ra
  let max = 0;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let i = 1; i < winLength; i++) {
      const r = row + dx*i, c = col + dy*i;
      if (r>=0 && r<size && c>=0 && c<size && b[r][c] === symbol) count++;
      else break;
    }
    for (let i = 1; i < winLength; i++) {
      const r = row - dx*i, c = col - dy*i;
      if (r>=0 && r<size && c>=0 && c<size && b[r][c] === symbol) count++;
      else break;
    }
    if (count > max) max = count;
  }
  return max;
}

// --- Canvas cho Endless ---
function resetCanvasView() {
  canvasScale = 1;
  canvasOffsetX = 0;
  canvasOffsetY = 0;
}

function drawCanvas() {
  const W = endlessCanvas.width, H = endlessCanvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(canvasOffsetX, canvasOffsetY);
  ctx.scale(canvasScale, canvasScale);

  const cellSize = 30;
  // Vẽ lưới
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--card-border').trim() || '#ccc';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size * cellSize, i * cellSize);
    ctx.stroke();
  }
  // Vẽ quân cờ
  ctx.font = `${cellSize * 0.8}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c]) {
        ctx.fillStyle = board[r][c] === 'X' ? '#e74c3c' : '#3498db';
        ctx.fillText(board[r][c], c * cellSize + cellSize/2, r * cellSize + cellSize/2);
      }
    }
  }
  ctx.restore();
}

// Xử lý chuột/cảm ứng cho Canvas
function getCanvasCoords(e) {
  const rect = endlessCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - canvasOffsetX) / canvasScale,
    y: (e.clientY - rect.top - canvasOffsetY) / canvasScale
  };
}

endlessCanvas.addEventListener('click', (e) => {
  if (size !== 20 || !gameActive) return;
  if (mode === 'ai' && currentPlayer !== playerSymbol) return;
  const {x, y} = getCanvasCoords(e);
  const col = Math.floor(x / 30);
  const row = Math.floor(y / 30);
  if (row >= 0 && row < size && col >= 0 && col < size && !board[row][col]) {
    cellClick(row, col);
  }
});

// Pan và zoom
endlessCanvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  endlessCanvas.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => {
  isDragging = false;
  endlessCanvas.style.cursor = 'grab';
});
window.addEventListener('mousemove', (e) => {
  if (!isDragging || size !== 20) return;
  canvasOffsetX += e.clientX - lastMouseX;
  canvasOffsetY += e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  drawCanvas();
});
endlessCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = endlessCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  canvasOffsetX = mx - zoom * (mx - canvasOffsetX);
  canvasOffsetY = my - zoom * (my - canvasOffsetY);
  canvasScale *= zoom;
  drawCanvas();
});

// Touch events cho pinch zoom
endlessCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    lastPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }
});
endlessCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 2) {
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const zoom = dist / lastPinchDist;
    const rect = endlessCanvas.getBoundingClientRect();
    const cx = (e.touches[0].clientX + e.touches[1].clientX)/2 - rect.left;
    const cy = (e.touches[0].clientY + e.touches[1].clientY)/2 - rect.top;
    canvasOffsetX = cx - zoom * (cx - canvasOffsetX);
    canvasOffsetY = cy - zoom * (cy - canvasOffsetY);
    canvasScale *= zoom;
    lastPinchDist = dist;
    drawCanvas();
  }
}, { passive: false });

// --- DevMode Panel ---
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
    <div>[C] Ghi bàn cho người</div>
    <div>[S] Đảo cờ</div>
    <div>[R] Reset ván</div>
    <div>[W] Thắng ngay</div>
  `;
  document.body.appendChild(advancedPanel);
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    e.preventDefault();
    toggleAdvancedPanel();
    return;
  }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 'c': case 'C': // Ghi bàn cho người
      if (!gameActive) break;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!board[r][c]) {
            makeMove(r, c);
            return;
          }
        }
      }
      break;
    case 's': case 'S': // Đảo cờ
      playerSymbol = playerSymbol === 'X' ? 'O' : 'X';
      aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
      playerSpan.textContent = playerSymbol;
      initBoard(size);
      break;
    case 'r': case 'R': initBoard(size); break;
    case 'w': case 'W': // Thắng ngay: tìm nước thắng cho người chơi
      if (!gameActive) break;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!board[r][c]) {
            board[r][c] = playerSymbol;
            const res = checkWinner(board, r, c, winLength);
            board[r][c] = null;
            if (res && res.winner === playerSymbol) {
              makeMove(r, c);
              return;
            }
          }
        }
      }
      break;
    default: break;
  }
});

// --- Cập nhật giao diện ---
function updateStatus(msg) {
  statusEl.textContent = msg;
}

// --- Lưu thống kê ---
async function loadStats() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'tictactoe');
    if (entry) { wins = entry.wins || 0; draws = entry.draws || 0; aiWins = entry.aiWins || 0; }
  } catch (_) {}
  winsSpan.textContent = wins;
  drawsSpan.textContent = draws;
  aiWinsSpan.textContent = aiWins;
}
async function saveStats() {
  try {
    await storage.openDB();
    const tx = storage.db.transaction('gameScores', 'readwrite');
    tx.objectStore('gameScores').put({ gameName: 'tictactoe', wins, draws, aiWins });
  } catch (_) {}
}

// --- Xử lý thay đổi cài đặt ---
modeSelect.addEventListener('change', () => {
  mode = modeSelect.value;
  difficultySelect.disabled = mode === 'pvp';
  initBoard(size);
});
difficultySelect.addEventListener('change', () => {
  difficulty = difficultySelect.value;
  initBoard(size);
});
sizeSelect.addEventListener('change', () => {
  initBoard(parseInt(sizeSelect.value));
});
newGameBtn.addEventListener('click', () => initBoard(size));
fullscreenBtn.addEventListener('click', () => {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
});

// Khởi động
loadStats().then(() => {
  createAdvancedPanel();
  initBoard(3);
});