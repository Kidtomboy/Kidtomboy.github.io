// ♟️ Chess - 2 người, đồng hồ, luật đầy đủ, nhập thành sửa mới hoàn toàn
import { isDevMode } from '../../core/devMode.js';
import { audioEngine } from '../../core/audio-engine.js';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const whiteClockBtn = document.getElementById('whiteClockBtn');
const blackClockBtn = document.getElementById('blackClockBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const SIZE = 8;
let board = [];
let currentTurn = 'white';
let selectedCell = null;
let validMoves = [];
let gameActive = true;
let paused = false;
let enPassantTarget = null;
let castlingRights = {
  whiteKingMoved: false, whiteRookA: false, whiteRookH: false,
  blackKingMoved: false, blackRookA: false, blackRookH: false
};

const INITIAL_TIME = 600;
let whiteTime = INITIAL_TIME;
let blackTime = INITIAL_TIME;
let timerInterval = null;

let moveHistory = [];
let pendingHandicap = {
  white: { queen: false, rookA: false, rookH: false, bishopC: false, bishopF: false, knightB: false, knightG: false, pawnF2: false },
  black: { queen: false, rookA: false, rookH: false, bishopC: false, bishopF: false, knightB: false, knightG: false, pawnF7: false }
};

let advancedPanel = null, panelVisible = false;
let handicapMsgElement = null;

// ========== KHỞI TẠO ==========
function createStandardBoard() {
  board = Array(SIZE).fill().map(() => Array(SIZE).fill(null));
  // Trắng dưới (hàng 7)
  board[7][0] = { type: 'rook', color: 'white' };
  board[7][1] = { type: 'knight', color: 'white' };
  board[7][2] = { type: 'bishop', color: 'white' };
  board[7][3] = { type: 'queen', color: 'white' };
  board[7][4] = { type: 'king', color: 'white' };
  board[7][5] = { type: 'bishop', color: 'white' };
  board[7][6] = { type: 'knight', color: 'white' };
  board[7][7] = { type: 'rook', color: 'white' };
  for (let c = 0; c < SIZE; c++) board[6][c] = { type: 'pawn', color: 'white' };

  // Đen trên (hàng 0)
  board[0][0] = { type: 'rook', color: 'black' };
  board[0][1] = { type: 'knight', color: 'black' };
  board[0][2] = { type: 'bishop', color: 'black' };
  board[0][3] = { type: 'queen', color: 'black' };
  board[0][4] = { type: 'king', color: 'black' };
  board[0][5] = { type: 'bishop', color: 'black' };
  board[0][6] = { type: 'knight', color: 'black' };
  board[0][7] = { type: 'rook', color: 'black' };
  for (let c = 0; c < SIZE; c++) board[1][c] = { type: 'pawn', color: 'black' };
}

function applyHandicap() {
  const h = pendingHandicap;
  if (h.white.queen) board[7][3] = null;
  if (h.white.rookA) board[7][0] = null;
  if (h.white.rookH) board[7][7] = null;
  if (h.white.bishopC) board[7][2] = null;
  if (h.white.bishopF) board[7][5] = null;
  if (h.white.knightB) board[7][1] = null;
  if (h.white.knightG) board[7][6] = null;
  if (h.white.pawnF2) board[6][5] = null;

  if (h.black.queen) board[0][3] = null;
  if (h.black.rookA) board[0][0] = null;
  if (h.black.rookH) board[0][7] = null;
  if (h.black.bishopC) board[0][2] = null;
  if (h.black.bishopF) board[0][5] = null;
  if (h.black.knightB) board[0][1] = null;
  if (h.black.knightG) board[0][6] = null;
  if (h.black.pawnF7) board[1][5] = null;
}

function resetGame() {
  stopTimer();
  createStandardBoard();
  applyHandicap();
  currentTurn = 'white';
  whiteTime = INITIAL_TIME;
  blackTime = INITIAL_TIME;
  gameActive = true;
  paused = false;
  enPassantTarget = null;
  castlingRights = {
    whiteKingMoved: false, whiteRookA: false, whiteRookH: false,
    blackKingMoved: false, blackRookA: false, blackRookH: false
  };
  selectedCell = null;
  validMoves = [];
  moveHistory = [];
  pauseBtn.textContent = '⏸️ Tạm dừng';
  updateClockDisplay();
  renderBoard();
  updateStatus('Lượt Trắng');
  startTimerFor('white');
  if (handicapMsgElement) handicapMsgElement.style.display = 'none';
}

// ========== RENDER ==========
function pieceSymbol(piece) {
  if (!piece) return '';
  const sym = {
    king: { white: '♔', black: '♚' },
    queen: { white: '♕', black: '♛' },
    rook: { white: '♖', black: '♜' },
    bishop: { white: '♗', black: '♝' },
    knight: { white: '♘', black: '♞' },
    pawn: { white: '♙', black: '♟' }
  };
  return sym[piece.type][piece.color];
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (selectedCell && selectedCell.row === r && selectedCell.col === c) {
        cell.classList.add('selected');
      }
      const move = validMoves.find(m => m.row === r && m.col === c);
      if (move) {
        cell.classList.add('move-dot');
        cell.classList.add(currentTurn === 'white' ? 'white-dot' : 'black-dot');
      }

      const piece = board[r][c];
      if (piece) {
        const span = document.createElement('span');
        span.className = `piece ${piece.color}`;
        span.textContent = pieceSymbol(piece);
        cell.appendChild(span);
      }
      cell.addEventListener('click', () => handleCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

// ========== DI CHUYỂN CƠ BẢN ==========
function isWithinBoard(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }

function getRawMoves(row, col, piece, boardOverride) {
  const b = boardOverride || board;
  const color = piece.color;
  const opponentColor = color === 'white' ? 'black' : 'white';
  const moves = [];

  const stateAt = (r, c) => {
    if (!isWithinBoard(r, c)) return 'invalid';
    const target = b[r][c];
    if (!target) return 'empty';
    return target.color === color ? 'blocked' : 'capture';
  };

  if (piece.type === 'pawn') {
    const dir = color === 'white' ? -1 : 1;
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (stateAt(row + dir, nc) === 'capture') moves.push({ row: row + dir, col: nc });
      if (enPassantTarget && enPassantTarget.row === row + dir && enPassantTarget.col === nc)
        moves.push({ row: row + dir, col: nc });
    }
  } else if (piece.type === 'knight') {
    const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of offsets) {
      const nr = row + dr, nc = col + dc;
      if (stateAt(nr, nc) !== 'invalid') moves.push({ row: nr, col: nc });
    }
  } else if (piece.type === 'king') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = row + dr, nc = col + dc;
      if (stateAt(nr, nc) !== 'invalid') moves.push({ row: nr, col: nc });
    }
  } else {
    const dirs = {
      rook: [[0,1],[0,-1],[1,0],[-1,0]],
      bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
      queen: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
    }[piece.type];
    for (const [dr, dc] of dirs) {
      for (let i = 1; i < SIZE; i++) {
        const nr = row + dr * i, nc = col + dc * i;
        const state = stateAt(nr, nc);
        if (state === 'invalid' || state === 'blocked') break;
        moves.push({ row: nr, col: nc });
        if (state === 'capture') break;
      }
    }
  }
  return moves;
}

function isKingInCheck(color) {
  const opponentColor = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        const moves = getRawMoves(r, c, piece);
        if (moves.some(m => {
          const target = board[m.row]?.[m.col];
          return target && target.type === 'king' && target.color === color;
        })) return true;
      }
    }
  }
  return false;
}

function isSquareAttacked(row, col, defenderColor) {
  const opponentColor = defenderColor === 'white' ? 'black' : 'white';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        const moves = getRawMoves(r, c, piece);
        if (moves.some(m => m.row === row && m.col === col)) return true;
      }
    }
  }
  return false;
}

// ========== NƯỚC ĐI HỢP LỆ (KHÔNG THỬ NGHIỆM) ==========
function getValidMoves(row, col) {
  const piece = board[row][col];
  if (!piece || piece.color !== currentTurn) return [];
  const color = piece.color;
  const opponentColor = color === 'white' ? 'black' : 'white';
  const moves = [];

  const addMove = (targetRow, targetCol, special = null) => {
    // Kiểm tra đơn giản: không cần thử nước đi vì luật nhập thành không yêu cầu vua không bị chiếu sau khi nhập thành (chỉ cần không đi qua ô bị tấn công)
    moves.push({ row: targetRow, col: targetCol, special });
  };

  if (piece.type === 'pawn') {
    const dir = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const oneStep = row + dir;
    // Tiến 1 ô
    if (isWithinBoard(oneStep, col) && !board[oneStep][col]) {
      addMove(oneStep, col);
      // Tiến 2 ô từ vị trí xuất phát
      const twoStep = row + 2 * dir;
      if (row === startRow && !board[twoStep][col]) addMove(twoStep, col);
    }
    // Bắt chéo & en passant
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (!isWithinBoard(oneStep, nc)) continue;
      if (board[oneStep]?.[nc]?.color === opponentColor) addMove(oneStep, nc);
      else if (enPassantTarget && enPassantTarget.row === oneStep && enPassantTarget.col === nc) addMove(oneStep, nc, 'enpassant');
    }
  } else if (piece.type === 'knight') {
    const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of offsets) {
      const nr = row + dr, nc = col + dc;
      if (isWithinBoard(nr, nc) && board[nr][nc]?.color !== color) addMove(nr, nc);
    }
  } else if (piece.type === 'king') {
    // Di chuyển thường
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = row + dr, nc = col + dc;
      if (isWithinBoard(nr, nc) && board[nr][nc]?.color !== color) addMove(nr, nc);
    }
    // Nhập thành – không cần thử nước đi, kiểm tra điều kiện trực tiếp
    const backRow = color === 'white' ? 7 : 0;
    if (!castlingRights[color + 'KingMoved'] && row === backRow && col === 4 && !isKingInCheck(color)) {
      // Cánh vua (O-O)
      if (!castlingRights[color + 'RookH'] && board[backRow][7]?.type === 'rook' && board[backRow][7]?.color === color) {
        if (!board[backRow][5] && !board[backRow][6]) {
          if (!isSquareAttacked(backRow, 5, color) && !isSquareAttacked(backRow, 6, color)) {
            addMove(backRow, 6, 'castleK');
          }
        }
      }
      // Cánh hậu (O-O-O)
      if (!castlingRights[color + 'RookA'] && board[backRow][0]?.type === 'rook' && board[backRow][0]?.color === color) {
        if (!board[backRow][3] && !board[backRow][2] && !board[backRow][1]) {
          if (!isSquareAttacked(backRow, 3, color) && !isSquareAttacked(backRow, 2, color)) {
            addMove(backRow, 2, 'castleQ');
          }
        }
      }
    }
  } else { // rook, bishop, queen
    const dirs = {
      rook: [[0,1],[0,-1],[1,0],[-1,0]],
      bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
      queen: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
    }[piece.type];
    for (const [dr, dc] of dirs) {
      for (let i = 1; i < SIZE; i++) {
        const nr = row + dr * i, nc = col + dc * i;
        if (!isWithinBoard(nr, nc)) break;
        const target = board[nr][nc];
        if (!target) { addMove(nr, nc); continue; }
        if (target.color === opponentColor) { addMove(nr, nc); break; }
        break; // quân cùng màu
      }
    }
  }

  // Lọc bỏ nước đi khiến vua bị chiếu (chỉ cần với các nước không phải nhập thành, vì nhập thành đã kiểm tra riêng)
  return moves.filter(move => {
    if (move.special === 'castleK' || move.special === 'castleQ') return true; // đã an toàn
    // Thử thực hiện nước đi
    const origTarget = board[move.row][move.col];
    const origEnPassant = enPassantTarget;
    board[move.row][move.col] = piece;
    board[row][col] = null;
    if (move.special === 'enpassant') {
      board[enPassantTarget.row][enPassantTarget.col] = null;
    }
    const safe = !isKingInCheck(color);
    // Hoàn tác
    board[row][col] = piece;
    board[move.row][move.col] = origTarget;
    if (move.special === 'enpassant') {
      board[enPassantTarget.row][enPassantTarget.col] = { type: 'pawn', color: opponentColor };
    }
    enPassantTarget = origEnPassant;
    return safe;
  });
}

// ========== THỰC HIỆN NƯỚC ĐI ==========
function movePiece(fromRow, fromCol, toRow, toCol, special = null) {
  const piece = board[fromRow][fromCol];
  if (!piece) return;
  const captured = board[toRow][toCol];

  // Lưu lịch sử
  moveHistory.push({
    fromRow, fromCol, toRow, toCol,
    captured: captured ? { ...captured } : null,
    special,
    castlingRights: { ...castlingRights },
    enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
    whiteTime, blackTime
  });
  if (moveHistory.length > 50) moveHistory.shift();

  // Cập nhật en passant
  enPassantTarget = null;
  if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
    enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
  }

  // Cập nhật quyền nhập thành
  if (piece.type === 'king') castlingRights[piece.color + 'KingMoved'] = true;
  if (piece.type === 'rook') {
    if (fromRow === 7 && fromCol === 0) castlingRights.whiteRookA = true;
    if (fromRow === 7 && fromCol === 7) castlingRights.whiteRookH = true;
    if (fromRow === 0 && fromCol === 0) castlingRights.blackRookA = true;
    if (fromRow === 0 && fromCol === 7) castlingRights.blackRookH = true;
  }
  if (captured?.type === 'rook') {
    if (toRow === 7 && toCol === 0) castlingRights.whiteRookA = true;
    if (toRow === 7 && toCol === 7) castlingRights.whiteRookH = true;
    if (toRow === 0 && toCol === 0) castlingRights.blackRookA = true;
    if (toRow === 0 && toCol === 7) castlingRights.blackRookH = true;
  }

  // Thực hiện di chuyển vua
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  // Xử lý các nước đặc biệt
  if (special === 'enpassant') {
    const capturedRow = toRow + (piece.color === 'white' ? 1 : -1);
    board[capturedRow][toCol] = null;
  } else if (special === 'castleK') {
    const rookRow = toRow; // cùng hàng với vua
    board[rookRow][5] = board[rookRow][7];
    board[rookRow][7] = null;
    castlingRights[piece.color + 'RookH'] = true;
  } else if (special === 'castleQ') {
    const rookRow = toRow;
    board[rookRow][3] = board[rookRow][0];
    board[rookRow][0] = null;
    castlingRights[piece.color + 'RookA'] = true;
  }

  // Phong cấp tự động thành hậu
  if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
    board[toRow][toCol] = { type: 'queen', color: piece.color };
  }

  // Đổi lượt
  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  selectedCell = null;
  validMoves = [];
  renderBoard();
  updateStatus(`Lượt ${currentTurn === 'white' ? 'Trắng' : 'Đen'}`);
  startTimerFor(currentTurn);
  checkGameOver();
}

function checkGameOver() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]?.color === currentTurn) {
        if (getValidMoves(r, c).length > 0) return false;
      }
    }
  }
  gameActive = false;
  stopTimer();
  if (isKingInCheck(currentTurn)) {
    const winner = currentTurn === 'white' ? 'Đen' : 'Trắng';
    statusEl.textContent = `Chiếu hết! ${winner} thắng.`;
  } else {
    statusEl.textContent = 'Hòa (Stalemate)!';
  }
  return true;
}

function undoMove() {
  if (!moveHistory.length || !gameActive) return;
  const last = moveHistory.pop();
  board[last.fromRow][last.fromCol] = board[last.toRow][last.toCol];
  board[last.toRow][last.toCol] = last.captured;
  enPassantTarget = last.enPassantTarget;
  Object.assign(castlingRights, last.castlingRights);
  whiteTime = last.whiteTime;
  blackTime = last.blackTime;

  if (last.special === 'castleK') {
    const row = last.toRow;
    board[row][7] = board[row][5];
    board[row][5] = null;
  } else if (last.special === 'castleQ') {
    const row = last.toRow;
    board[row][0] = board[row][3];
    board[row][3] = null;
  } else if (last.special === 'enpassant') {
    const capturedRow = last.toRow + (board[last.fromRow][last.fromCol]?.color === 'white' ? 1 : -1);
    board[capturedRow][last.toCol] = { type: 'pawn', color: board[last.fromRow][last.fromCol]?.color === 'white' ? 'black' : 'white' };
  }

  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  selectedCell = null;
  validMoves = [];
  renderBoard();
  updateStatus(`Lượt ${currentTurn === 'white' ? 'Trắng' : 'Đen'} (đã hoàn tác)`);
  startTimerFor(currentTurn);
}

function handleCellClick(row, col) {
  if (!gameActive || paused) return;
  if (selectedCell && validMoves.some(m => m.row === row && m.col === col)) {
    const move = validMoves.find(m => m.row === row && m.col === col);
    movePiece(selectedCell.row, selectedCell.col, row, col, move.special);
    return;
  }
  if (board[row][col]?.color === currentTurn) {
    selectedCell = { row, col };
    validMoves = getValidMoves(row, col);
    renderBoard();
  } else {
    selectedCell = null;
    validMoves = [];
    renderBoard();
  }
}

// ========== ĐỒNG HỒ ==========
function startTimerFor(color) {
  stopTimer();
  if (!gameActive || paused) return;
  timerInterval = setInterval(() => {
    if (paused || !gameActive) return;
    if (currentTurn === 'white') {
      whiteTime--;
      if (whiteTime <= 0) { whiteTime = 0; timeOut('white'); }
    } else {
      blackTime--;
      if (blackTime <= 0) { blackTime = 0; timeOut('black'); }
    }
    updateClockDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function timeOut(color) {
  stopTimer();
  gameActive = false;
  const winner = color === 'white' ? 'Đen' : 'Trắng';
  statusEl.textContent = `Hết giờ! ${winner} thắng.`;
  updateClockDisplay();
}

function updateClockDisplay() {
  const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  whiteClockBtn.textContent = fmt(whiteTime);
  blackClockBtn.textContent = fmt(blackTime);
  whiteClockBtn.classList.toggle('active', currentTurn === 'white' && gameActive && !paused);
  blackClockBtn.classList.toggle('active', currentTurn === 'black' && gameActive && !paused);
}

whiteClockBtn.addEventListener('click', () => {
  if (!gameActive || paused || currentTurn !== 'white') return;
  currentTurn = 'black';
  updateStatus('Lượt Đen');
  startTimerFor('black');
  updateClockDisplay();
});
blackClockBtn.addEventListener('click', () => {
  if (!gameActive || paused || currentTurn !== 'black') return;
  currentTurn = 'white';
  updateStatus('Lượt Trắng');
  startTimerFor('white');
  updateClockDisplay();
});

// ========== TẠM DỪNG / CHƠI LẠI ==========
pauseBtn.addEventListener('click', () => {
  if (!gameActive) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
  if (paused) stopTimer();
  else startTimerFor(currentTurn);
  updateClockDisplay();
});

resetBtn.addEventListener('click', resetGame);
fullscreenBtn.addEventListener('click', () => {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
});

// ========== DEV PANEL ==========
function createAdvancedPanel() {
  if (!isDevMode()) return;
  advancedPanel = document.createElement('div');
  advancedPanel.id = 'advanced-panel';
  advancedPanel.style.display = 'none';
  advancedPanel.innerHTML = `
    <style>
      #advanced-panel {
        position: fixed; top: 10px; right: 10px;
        background: rgba(0,0,0,0.85); color: #0f0; font-family: monospace;
        padding: 12px; border-radius: 8px; z-index: 9999;
        font-size: 12px; max-width: 280px; border: 1px solid #0f0;
      }
      button { margin: 2px; padding: 4px 8px; background: #333; color: #0f0; border: 1px solid #0f0; border-radius: 4px; cursor: pointer; }
      #handicapMsg { color: yellow; margin-top: 4px; display: none; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím ~)</div>
    <div>[R] Reset ván | [S] Đảo màu (yêu cầu chơi lại)</div>
    <div>[U] Hoàn tác nước đi</div>
    <div>Chấp Trắng: 
      <button id="removeWhiteQueen">Hậu</button>
      <button id="removeWhiteRookA">Xe A</button>
      <button id="removeWhiteRookH">Xe H</button>
      <button id="removeWhiteBishopC">Tượng C</button>
      <button id="removeWhiteBishopF">Tượng F</button>
      <button id="removeWhiteKnightB">Mã B</button>
      <button id="removeWhiteKnightG">Mã G</button>
      <button id="removeWhitePawnF2">Tốt F2</button>
    </div>
    <div>Chấp Đen:
      <button id="removeBlackQueen">Hậu</button>
      <button id="removeBlackRookA">Xe A</button>
      <button id="removeBlackRookH">Xe H</button>
      <button id="removeBlackBishopC">Tượng C</button>
      <button id="removeBlackBishopF">Tượng F</button>
      <button id="removeBlackKnightB">Mã B</button>
      <button id="removeBlackKnightG">Mã G</button>
      <button id="removeBlackPawnF7">Tốt F7</button>
    </div>
    <p id="handicapMsg">Yêu cầu chấp – ấn "Chơi lại" để áp dụng</p>
  `;
  document.body.appendChild(advancedPanel);
  handicapMsgElement = document.getElementById('handicapMsg');

  const setHandicap = (side, pieceKey) => {
    if (gameActive) {
      gameActive = false;
      stopTimer();
      statusEl.textContent = 'Đã yêu cầu chấp quân – hãy ấn "Chơi lại" để tiếp tục';
      if (handicapMsgElement) handicapMsgElement.style.display = 'block';
    }
    pendingHandicap[side][pieceKey] = true;
  };
  // Gán sự kiện cho tất cả nút (đã lược bớt cho gọn, thực tế sẽ gán đầy đủ)
  document.getElementById('removeWhiteQueen').onclick = () => setHandicap('white', 'queen');
  document.getElementById('removeWhiteRookA').onclick = () => setHandicap('white', 'rookA');
  document.getElementById('removeWhiteRookH').onclick = () => setHandicap('white', 'rookH');
  document.getElementById('removeWhiteBishopC').onclick = () => setHandicap('white', 'bishopC');
  document.getElementById('removeWhiteBishopF').onclick = () => setHandicap('white', 'bishopF');
  document.getElementById('removeWhiteKnightB').onclick = () => setHandicap('white', 'knightB');
  document.getElementById('removeWhiteKnightG').onclick = () => setHandicap('white', 'knightG');
  document.getElementById('removeWhitePawnF2').onclick = () => setHandicap('white', 'pawnF2');
  document.getElementById('removeBlackQueen').onclick = () => setHandicap('black', 'queen');
  document.getElementById('removeBlackRookA').onclick = () => setHandicap('black', 'rookA');
  document.getElementById('removeBlackRookH').onclick = () => setHandicap('black', 'rookH');
  document.getElementById('removeBlackBishopC').onclick = () => setHandicap('black', 'bishopC');
  document.getElementById('removeBlackBishopF').onclick = () => setHandicap('black', 'bishopF');
  document.getElementById('removeBlackKnightB').onclick = () => setHandicap('black', 'knightB');
  document.getElementById('removeBlackKnightG').onclick = () => setHandicap('black', 'knightG');
  document.getElementById('removeBlackPawnF7').onclick = () => setHandicap('black', 'pawnF7');
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
    case 'r': case 'R': resetGame(); break;
    case 'u': case 'U': undoMove(); break;
    case 's': case 'S':
      if (gameActive) {
        gameActive = false;
        stopTimer();
        statusEl.textContent = 'Đã yêu cầu đảo màu – hãy ấn "Chơi lại" để tiếp tục';
      }
      break;
    default: break;
  }
});

function updateStatus(msg) { statusEl.textContent = msg; }

// Khởi động
resetGame();
createAdvancedPanel();