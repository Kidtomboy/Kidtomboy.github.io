// 🔴 Connect Four - CSS Grid, AI Minimax, hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const COLS = 7;
const ROWS = 6;

const gridEl = document.getElementById('grid');
const columnButtonsEl = document.getElementById('columnButtons');
const statusEl = document.getElementById('status');
const playerSpan = document.getElementById('player');
const winsSpan = document.getElementById('wins');
const drawsSpan = document.getElementById('draws');
const aiWinsSpan = document.getElementById('aiWins');
const modeSelect = document.getElementById('modeSelect');
const difficultySelect = document.getElementById('difficultySelect');

let board = [];
let currentPlayer = 'red'; // 'red' hoặc 'yellow'
let playerSymbol = 'red';
let aiSymbol = 'yellow';
let gameActive = true;
let mode = 'ai';
let difficulty = 'medium';
let wins = 0, draws = 0, aiWins = 0;

// DevMode
let advancedPanel = null, panelVisible = false;

audioEngine.init();

// --- Khởi tạo bảng ---
function initBoard() {
  board = Array(ROWS).fill().map(() => Array(COLS).fill(null));
  currentPlayer = playerSymbol;
  gameActive = true;
  renderGrid();
  renderColumnButtons();
  updateStatus('Lượt của bạn (' + (playerSymbol === 'red' ? '🔴' : '🟡') + ')');
}

// --- Render lưới CSS ---
function renderGrid() {
  gridEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (board[r][c] === 'red') cell.classList.add('red');
      else if (board[r][c] === 'yellow') cell.classList.add('yellow');
      gridEl.appendChild(cell);
    }
  }
}

// --- Render nút chọn cột ---
function renderColumnButtons() {
  columnButtonsEl.innerHTML = '';
  for (let c = 0; c < COLS; c++) {
    const btn = document.createElement('button');
    btn.className = 'col-btn';
    btn.textContent = '↓';
    btn.addEventListener('click', () => dropPiece(c));
    if (!gameActive || board[0][c] !== null) btn.disabled = true;
    columnButtonsEl.appendChild(btn);
  }
}

// --- Thả bóng vào cột ---
function dropPiece(col) {
  if (!gameActive) return;
  if (board[0][col] !== null) return; // Cột đầy

  // Tìm hàng trống thấp nhất
  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      row = r;
      break;
    }
  }
  if (row === -1) return;

  board[row][col] = currentPlayer;
  audioEngine.play('drop');
  renderGrid();
  renderColumnButtons();

  const result = checkWinner(row, col);
  if (result) {
    endGame(result.winner);
    return;
  }
  if (isBoardFull()) {
    endGame(null);
    return;
  }

  // Chuyển lượt
  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  updateStatus(currentPlayer === playerSymbol ? 'Lượt của bạn (' + (playerSymbol === 'red' ? '🔴' : '🟡') + ')' : 'AI đang suy nghĩ...');

  if (mode === 'ai' && currentPlayer === aiSymbol && gameActive) {
    setTimeout(aiMove, 300);
  }
}

// --- Kiểm tra thắng (4 ô liên tiếp) ---
function checkWinner(row, col) {
  const val = board[row][col];
  if (!val) return null;
  const directions = [[0,1],[1,0],[1,1],[1,-1]];

  for (const [dx, dy] of directions) {
    let count = 1;
    // Theo hướng dương
    for (let i = 1; i < 4; i++) {
      const r = row + dx * i;
      const c = col + dy * i;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === val) count++;
      else break;
    }
    // Theo hướng âm
    for (let i = 1; i < 4; i++) {
      const r = row - dx * i;
      const c = col - dy * i;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === val) count++;
      else break;
    }
    if (count >= 4) {
      return { winner: val };
    }
  }
  return null;
}

function isBoardFull() {
  return board[0].every(cell => cell !== null);
}

// --- Kết thúc ván ---
function endGame(winner) {
  gameActive = false;
  renderColumnButtons();
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
  } else {
    draws++;
    drawsSpan.textContent = draws;
    statusEl.textContent = 'Hòa! 🤝';
    audioEngine.play('draw');
  }
  saveStats();
}

// --- AI Minimax với Alpha-Beta ---
function aiMove() {
  if (!gameActive) return;
  const depth = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 4 : 6);
  const bestMove = getBestMove(depth);
  if (bestMove !== -1) {
    dropPiece(bestMove);
  }
}

function getBestMove(depth) {
  let bestScore = -Infinity;
  let bestCol = -1;
  const validCols = getValidColumns();
  // Sắp xếp cột theo trung tâm (cột 3) để tăng cắt tỉa
  validCols.sort((a,b) => Math.abs(a-3) - Math.abs(b-3));

  for (const col of validCols) {
    const row = getLowestEmptyRow(col);
    board[row][col] = aiSymbol;
    const score = minimax(board, depth - 1, -Infinity, Infinity, false);
    board[row][col] = null;
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

function minimax(b, depth, alpha, beta, isMaximizing) {
  // Kiểm tra kết quả cuối
  const result = evaluateBoard(b);
  if (result === aiSymbol) return 1000;
  if (result === playerSymbol) return -1000;
  if (result === 'draw') return 0;
  if (depth === 0) return heuristicScore(b);

  const validCols = getValidColumns(b);
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const col of validCols) {
      const row = getLowestEmptyRow(col, b);
      b[row][col] = aiSymbol;
      const score = minimax(b, depth - 1, alpha, beta, false);
      b[row][col] = null;
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const col of validCols) {
      const row = getLowestEmptyRow(col, b);
      b[row][col] = playerSymbol;
      const score = minimax(b, depth - 1, alpha, beta, true);
      b[row][col] = null;
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function evaluateBoard(b) {
  // Kiểm tra thắng
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c]) {
        const res = checkWinnerAt(r, c, b);
        if (res) return res;
      }
    }
  }
  if (isBoardFullState(b)) return 'draw';
  return null;
}

function checkWinnerAt(row, col, b) {
  const val = b[row][col];
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let i = 1; i < 4; i++) {
      const r = row + dx*i, c = col + dy*i;
      if (r>=0 && r<ROWS && c>=0 && c<COLS && b[r][c]===val) count++;
      else break;
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dx*i, c = col - dy*i;
      if (r>=0 && r<ROWS && c>=0 && c<COLS && b[r][c]===val) count++;
      else break;
    }
    if (count >= 4) return val;
  }
  return null;
}

function isBoardFullState(b) {
  return b[0].every(cell => cell !== null);
}

function heuristicScore(b) {
  // Điểm dựa trên cửa sổ 4 ô
  let score = 0;
  // Duyệt tất cả các cửa sổ 4 ô
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Ngang
      if (c + 3 < COLS) {
        const window = [b[r][c], b[r][c+1], b[r][c+2], b[r][c+3]];
        score += evaluateWindow(window);
      }
      // Dọc
      if (r + 3 < ROWS) {
        const window = [b[r][c], b[r+1][c], b[r+2][c], b[r+3][c]];
        score += evaluateWindow(window);
      }
      // Chéo chính
      if (r + 3 < ROWS && c + 3 < COLS) {
        const window = [b[r][c], b[r+1][c+1], b[r+2][c+2], b[r+3][c+3]];
        score += evaluateWindow(window);
      }
      // Chéo phụ
      if (r + 3 < ROWS && c - 3 >= 0) {
        const window = [b[r][c], b[r+1][c-1], b[r+2][c-2], b[r+3][c-3]];
        score += evaluateWindow(window);
      }
    }
  }
  return score;
}

function evaluateWindow(window) {
  const aiCount = window.filter(v => v === aiSymbol).length;
  const playerCount = window.filter(v => v === playerSymbol).length;
  const empty = window.filter(v => v === null).length;

  if (aiCount === 4) return 100;
  if (aiCount === 3 && empty === 1) return 10;
  if (aiCount === 2 && empty === 2) return 3;
  if (playerCount === 4) return -100;
  if (playerCount === 3 && empty === 1) return -10;
  if (playerCount === 2 && empty === 2) return -3;
  return 0;
}

function getValidColumns(b = board) {
  return Array.from({length: COLS}, (_, i) => i).filter(c => b[0][c] === null);
}

function getLowestEmptyRow(col, b = board) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (b[r][col] === null) return r;
  }
  return -1;
}

// --- DevMode Cheat Panel ---
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
      const validCols = getValidColumns();
      if (validCols.length > 0) dropPiece(validCols[Math.floor(Math.random() * validCols.length)]);
      break;
    case 's': case 'S': // Đảo cờ
      playerSymbol = playerSymbol === 'red' ? 'yellow' : 'red';
      aiSymbol = playerSymbol === 'red' ? 'yellow' : 'red';
      playerSpan.textContent = playerSymbol === 'red' ? '🔴' : '🟡';
      initBoard();
      break;
    case 'r': case 'R': initBoard(); break;
    case 'w': case 'W': // Thắng ngay
      if (!gameActive) break;
      for (let c = 0; c < COLS; c++) {
        if (board[0][c] === null) {
          const row = getLowestEmptyRow(c);
          board[row][c] = playerSymbol;
          if (checkWinnerAt(row, c, board) === playerSymbol) {
            board[row][c] = null;
            dropPiece(c);
            return;
          }
          board[row][c] = null;
        }
      }
      break;
    default: break;
  }
});

// --- Cập nhật UI ---
function updateStatus(msg) { statusEl.textContent = msg; }

// --- Lưu thống kê ---
async function loadStats() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'connectfour');
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
    tx.objectStore('gameScores').put({ gameName: 'connectfour', wins, draws, aiWins });
  } catch (_) {}
}

// --- Xử lý thay đổi cài đặt ---
modeSelect.addEventListener('change', () => {
  mode = modeSelect.value;
  difficultySelect.disabled = mode === 'pvp';
  initBoard();
});
difficultySelect.addEventListener('change', () => {
  difficulty = difficultySelect.value;
  initBoard();
});
document.getElementById('newGameBtn').addEventListener('click', initBoard);
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
});

// Khởi động
loadStats().then(() => {
  createAdvancedPanel();
  initBoard();
});