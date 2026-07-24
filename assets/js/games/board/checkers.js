// ⚫ Checkers - CSS Grid, AI Minimax, hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const SIZE = 8;
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const playerSpan = document.getElementById('player');
const winsSpan = document.getElementById('wins');
const drawsSpan = document.getElementById('draws');
const aiWinsSpan = document.getElementById('aiWins');
const modeSelect = document.getElementById('modeSelect');
const difficultySelect = document.getElementById('difficultySelect');

let board = [];
let currentPlayer = 'red';
let playerColor = 'red';
let aiColor = 'white';
let gameActive = true;
let mode = 'ai';
let difficulty = 'medium';
let selectedRow = -1, selectedCol = -1;
let validMoves = [];
let wins = 0, draws = 0, aiWins = 0;

// DevMode
let advancedPanel = null, panelVisible = false;

audioEngine.init();

// --- Khởi tạo bàn cờ (quân đỏ ở dưới) ---
function initBoard() {
  board = Array(SIZE).fill().map(() => Array(SIZE).fill(null));
  // Quân đỏ (người) ở 3 hàng dưới cùng (5,6,7)
  for (let r = 5; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { color: 'red', king: false };
    }
  }
  // Quân trắng (AI) ở 3 hàng trên cùng (0,1,2)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { color: 'white', king: false };
    }
  }
  currentPlayer = playerColor; // Người đi trước
  gameActive = true;
  selectedRow = -1; selectedCol = -1;
  validMoves = [];
  renderBoard();
  updateStatus('Lượt của bạn (' + (playerColor === 'red' ? '🔴' : '⚪') + ')');
}

// --- Render bàn cờ bằng CSS Grid ---
function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      if (r === selectedRow && c === selectedCol) cell.classList.add('selected');
      if (validMoves.some(m => m.row === r && m.col === c)) cell.classList.add('valid-move');
      cell.addEventListener('click', () => cellClick(r, c));
      if (board[r][c]) {
        const piece = document.createElement('div');
        piece.className = 'piece ' + board[r][c].color;
        if (board[r][c].king) piece.classList.add('king');
        cell.appendChild(piece);
      }
      boardEl.appendChild(cell);
    }
  }
}

// --- Click ô ---
function cellClick(row, col) {
  if (!gameActive) return;
  if (mode === 'ai' && currentPlayer !== playerColor) return;

  // Nếu đã chọn ô và bấm vào nước đi hợp lệ
  if (selectedRow >= 0 && validMoves.some(m => m.row === row && m.col === col)) {
    const move = validMoves.find(m => m.row === row && m.col === col);
    if (move) {
      applyMove(selectedRow, selectedCol, move);
      return;
    }
  }

  // Chọn quân của mình
  if (board[row][col] && board[row][col].color === currentPlayer) {
    selectedRow = row;
    selectedCol = col;
    validMoves = getValidMoves(row, col);
    renderBoard();
    return;
  }

  // Bỏ chọn
  selectedRow = -1; selectedCol = -1;
  validMoves = [];
  renderBoard();
}

// --- Lấy nước đi hợp lệ (gồm nhảy bắt buộc) ---
function getValidMoves(row, col, boardState = board) {
  const piece = boardState[row][col];
  if (!piece) return [];
  const jumps = getJumps(row, col, boardState);
  if (jumps.length > 0) return jumps; // Bắt buộc nhảy nếu có thể

  // Di chuyển thường
  const moves = [];
  const dr = piece.king ? [-1, 1] : (piece.color === 'red' ? [-1] : [1]); // đỏ đi lên (-1), trắng đi xuống (+1)
  for (const dRow of dr) {
    for (const dCol of [-1, 1]) {
      const nr = row + dRow, nc = col + dCol;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !boardState[nr][nc]) {
        moves.push({ row: nr, col: nc, captures: [] });
      }
    }
  }
  return moves;
}

// --- Lấy tất cả nước nhảy (đệ quy) ---
function getJumps(row, col, boardState, captured = []) {
  const piece = boardState[row][col];
  if (!piece) return [];
  const jumps = [];
  const dr = piece.king ? [-2, 2] : (piece.color === 'red' ? [-2] : [2]); // đỏ nhảy lên (-2), trắng nhảy xuống (+2)
  for (const dRow of dr) {
    for (const dCol of [-2, 2]) {
      const midR = row + dRow/2, midC = col + dCol/2;
      const endR = row + dRow, endC = col + dCol;
      if (endR >= 0 && endR < SIZE && endC >= 0 && endC < SIZE && !boardState[endR][endC]) {
        const midPiece = boardState[midR][midC];
        if (midPiece && midPiece.color !== piece.color && !captured.some(c => c.row === midR && c.col === midC)) {
          const newCaptured = [...captured, { row: midR, col: midC }];
          // Đệ quy tìm nhảy tiếp
          const furtherJumps = getJumps(endR, endC, simulateJump(boardState, row, col, endR, endC, midR, midC), newCaptured);
          if (furtherJumps.length > 0) {
            jumps.push(...furtherJumps.map(j => ({
              row: j.row,
              col: j.col,
              captures: [...newCaptured, ...j.captures]
            })));
          } else {
            jumps.push({ row: endR, col: endC, captures: newCaptured });
          }
        }
      }
    }
  }
  return jumps;
}

function simulateJump(boardState, r1, c1, r2, c2, midR, midC) {
  const newBoard = boardState.map(row => row.map(cell => cell ? { ...cell } : null));
  newBoard[r2][c2] = newBoard[r1][c1];
  newBoard[r1][c1] = null;
  newBoard[midR][midC] = null;
  return newBoard;
}

// --- Kiểm tra còn nước đi không ---
function hasAnyMoves(color, boardState = board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (boardState[r][c] && boardState[r][c].color === color && getValidMoves(r, c, boardState).length > 0) return true;
    }
  }
  return false;
}

// --- Áp dụng nước đi (hỗ trợ ăn liên tiếp) ---
function applyMove(fromRow, fromCol, move, isChain = false) {
  board[move.row][move.col] = board[fromRow][fromCol];
  board[fromRow][fromCol] = null;
  for (const cap of move.captures) {
    board[cap.row][cap.col] = null;
    audioEngine.play('capture');
  }
  const piece = board[move.row][move.col];
  if (!piece.king && (piece.color === 'red' && move.row === 0 || piece.color === 'white' && move.row === SIZE-1)) {
    piece.king = true;
    audioEngine.play('promote');
  } else if (!isChain) {
    audioEngine.play('move-self');
  }

  renderBoard();

  // Kiểm tra xem từ vị trí mới có nhảy được tiếp không (ăn liên tiếp)
  const furtherJumps = getJumps(move.row, move.col, board);
  if (furtherJumps.length > 0) {
    // Phải tiếp tục nhảy, không chuyển lượt
    selectedRow = move.row;
    selectedCol = move.col;
    validMoves = furtherJumps;
    updateStatus('Bạn phải nhảy tiếp!');
    renderBoard();
    if (mode === 'ai' && currentPlayer === aiColor) {
      setTimeout(() => aiChainJump(), 200);
    }
    return;
  }

  // Không còn nhảy được nữa -> kiểm tra thắng
  if (!hasAnyMoves(currentPlayer === 'red' ? 'white' : 'red')) {
    endGame(currentPlayer);
    return;
  }

  // Chuyển lượt
  currentPlayer = currentPlayer === 'red' ? 'white' : 'red';
  selectedRow = -1; selectedCol = -1;
  validMoves = [];
  updateStatus(currentPlayer === playerColor ? 'Lượt của bạn (' + (playerColor === 'red' ? '🔴' : '⚪') + ')' : 'AI đang suy nghĩ...');
  renderBoard();

  if (mode === 'ai' && currentPlayer === aiColor && gameActive) {
    setTimeout(aiMove, 300);
  }
}

// --- AI nhảy liên tiếp ---
function aiChainJump() {
  if (!gameActive || currentPlayer !== aiColor) return;
  const jumps = validMoves; // đã được set từ applyMove
  if (jumps.length === 0) return;
  // Chọn nước nhảy tốt nhất (ngẫu nhiên hoặc heuristic)
  const best = jumps[Math.floor(Math.random() * jumps.length)];
  applyMove(selectedRow, selectedCol, best, true);
}

// --- Kết thúc game ---
function endGame(winner) {
  gameActive = false;
  if (winner === playerColor) {
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
  saveStats();
  selectedRow = -1; selectedCol = -1; validMoves = [];
  renderBoard();
}

// --- AI Minimax (gốc) ---
function aiMove() {
  if (!gameActive) return;
  const depth = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 4 : 6);
  const bestMove = getBestAIMove(depth);
  if (bestMove) {
    applyMove(bestMove.fromRow, bestMove.fromCol, bestMove.move);
  }
}

function getBestAIMove(depth) {
  let bestScore = -Infinity;
  let bestResult = null;
  const allMoves = getAllMoves(aiColor, board);
  for (const { fromRow, fromCol, move } of allMoves) {
    const newBoard = simulateFullMove(board, fromRow, fromCol, move);
    const score = minimaxCheckers(newBoard, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestResult = { fromRow, fromCol, move };
    }
  }
  return bestResult;
}

function minimaxCheckers(b, depth, alpha, beta, isMaximizing) {
  const color = isMaximizing ? aiColor : playerColor;
  if (depth === 0 || !hasAnyMoves(color, b)) {
    return evaluateBoardCheckers(b);
  }
  const moves = getAllMoves(color, b);
  if (moves.length === 0) return isMaximizing ? -1000 : 1000;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const { fromRow, fromCol, move } of moves) {
      const newBoard = simulateFullMove(b, fromRow, fromCol, move);
      const score = minimaxCheckers(newBoard, depth - 1, alpha, beta, false);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const { fromRow, fromCol, move } of moves) {
      const newBoard = simulateFullMove(b, fromRow, fromCol, move);
      const score = minimaxCheckers(newBoard, depth - 1, alpha, beta, true);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function simulateFullMove(b, fromRow, fromCol, move) {
  let newBoard = b.map(row => row.map(cell => cell ? { ...cell } : null));
  newBoard[move.row][move.col] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  for (const cap of move.captures) newBoard[cap.row][cap.col] = null;
  const piece = newBoard[move.row][move.col];
  if (!piece.king && (piece.color === 'red' && move.row === 0 || piece.color === 'white' && move.row === SIZE-1)) {
    piece.king = true;
  }
  return newBoard;
}

function evaluateBoardCheckers(b) {
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = b[r][c];
      if (!piece) continue;
      const value = piece.king ? 3 : 1;
      if (piece.color === aiColor) score += value;
      else score -= value;
    }
  }
  return score;
}

function getAllMoves(color, b) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] && b[r][c].color === color) {
        const valid = getValidMoves(r, c, b);
        for (const move of valid) {
          moves.push({ fromRow: r, fromCol: c, move });
        }
      }
    }
  }
  // Ưu tiên nhảy
  const jumps = moves.filter(m => m.move.captures.length > 0);
  return jumps.length > 0 ? jumps : moves;
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
    <div>[C] Ghi bàn (ăn quân)</div>
    <div>[S] Đảo màu quân</div>
    <div>[R] Reset ván</div>
    <div>[W] Thắng ngay (xóa quân AI)</div>
  `;
  document.body.appendChild(advancedPanel);
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 'c': case 'C': // Tự động nhảy ăn quân nếu có
      if (!gameActive || currentPlayer !== playerColor) break;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (board[r][c] && board[r][c].color === playerColor) {
            const jumps = getJumps(r, c, board);
            if (jumps.length > 0) {
              selectedRow = r; selectedCol = c;
              applyMove(r, c, jumps[0]);
              return;
            }
          }
        }
      }
      break;
    case 's': case 'S':
      playerColor = playerColor === 'red' ? 'white' : 'red';
      aiColor = playerColor === 'red' ? 'white' : 'red';
      playerSpan.textContent = playerColor === 'red' ? '🔴' : '⚪';
      initBoard();
      break;
    case 'r': case 'R': initBoard(); break;
    case 'w': case 'W':
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (board[r][c] && board[r][c].color === aiColor) board[r][c] = null;
      endGame(playerColor);
      break;
    default: break;
  }
});

// UI events
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

function updateStatus(msg) { statusEl.textContent = msg; }

// Lưu thống kê
async function loadStats() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'checkers');
    if (entry) { wins = entry.wins || 0; draws = entry.draws || 0; aiWins = entry.aiWins || 0; }
  } catch (_) {}
  winsSpan.textContent = wins; drawsSpan.textContent = draws; aiWinsSpan.textContent = aiWins;
}
async function saveStats() {
  try {
    await storage.openDB();
    const tx = storage.db.transaction('gameScores', 'readwrite');
    tx.objectStore('gameScores').put({ gameName: 'checkers', wins, draws, aiWins });
  } catch (_) {}
}

// Khởi động
loadStats().then(() => {
  createAdvancedPanel();
  initBoard();
});