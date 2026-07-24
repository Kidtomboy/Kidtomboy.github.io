// 💣 Minesweeper - Puzzle, hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const minesLeftEl = document.getElementById('minesLeft');
const difficultySelect = document.getElementById('difficultySelect');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const DIFFICULTIES = {
  easy:   { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard:   { rows: 16, cols: 30, mines: 99 }
};

let rows, cols, totalMines;
let grid = [];         // 2D: { mine, revealed, flagged, adjacentMines }
let gameActive = true;
let gameWon = false;
let timer = 0;
let timerInterval = null;
let flagsPlaced = 0;
let firstMoveDone = false;

// DevMode
let showMines = false;
let advancedPanel = null, panelVisible = false;

audioEngine.init();

function initGame() {
  const diff = difficultySelect.value;
  const config = DIFFICULTIES[diff];
  rows = config.rows;
  cols = config.cols;
  totalMines = config.mines;
  
  stopTimer();
  timer = 0;
  timerEl.textContent = '000';
  flagsPlaced = 0;
  minesLeftEl.textContent = totalMines;
  gameActive = true;
  gameWon = false;
  firstMoveDone = false;
  
  // Tạo grid rỗng
  grid = Array(rows).fill().map(() => Array(cols).fill().map(() => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacentMines: 0
  })));
  
  renderBoard();
}

// Đặt mìn sau nước đi đầu tiên (tránh đặt vào ô đã click)
function placeMines(safeRow, safeCol) {
  let minesPlaced = 0;
  while (minesPlaced < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (grid[r][c].mine) continue;
    // Không đặt mìn vào ô an toàn và các ô xung quanh
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    grid[r][c].mine = true;
    minesPlaced++;
  }
  // Tính số mìn lân cận
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) count++;
        }
      }
      grid[r][c].adjacentMines = count;
    }
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    timerEl.textContent = timer.toString().padStart(3, '0');
    if (timer >= 999) {
      timer = 999;
      timerEl.textContent = '999';
      clearInterval(timerInterval);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
  boardEl.style.gridTemplateRows = `repeat(${rows}, 32px)`;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const g = grid[r][c];
      
      if (g.revealed) {
        cell.classList.add('revealed');
        if (g.mine) cell.classList.add('mine-revealed');
        else if (g.adjacentMines > 0) {
          cell.textContent = g.adjacentMines;
          // Màu sắc theo số
          const colors = ['', '#1a6dff', '#2ecc71', '#e74c3c', '#8e44ad', '#f39c12', '#16a085', '#c0392b', '#2c3e50'];
          cell.style.color = colors[g.adjacentMines] || '#000';
        }
      } else if (g.flagged) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      }
      
      // Cheat: tô màu mìn
      if (showMines && g.mine && !g.revealed && !g.flagged) {
        cell.classList.add('mine-highlight');
        cell.textContent = '💣';
      }
      
      cell.addEventListener('click', (e) => handleCellClick(r, c, e));
      cell.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(r, c); });
      
      // Cảm ứng giữ để cắm cờ
      let touchTimer;
      cell.addEventListener('touchstart', (e) => {
        touchTimer = setTimeout(() => {
          toggleFlag(r, c);
          navigator.vibrate?.(50);
        }, 500);
      });
      cell.addEventListener('touchend', () => clearTimeout(touchTimer));
      cell.addEventListener('touchmove', () => clearTimeout(touchTimer));
      
      boardEl.appendChild(cell);
    }
  }
}

function handleCellClick(r, c, event) {
  if (!gameActive || gameWon) return;
  const g = grid[r][c];
  if (g.revealed || g.flagged) return;
  
  if (!firstMoveDone) {
    // Nước đi đầu tiên: đặt mìn và bắt đầu tính giờ
    placeMines(r, c);
    firstMoveDone = true;
    startTimer();
  }
  
  if (g.mine) {
    // Thua
    revealAllMines();
    gameActive = false;
    stopTimer();
    audioEngine.play('explosion');
    renderBoard();
    showOverlay('💀 Game Over! Bạn đã dẫm phải mìn.');
  } else {
    // Mở ô
    floodFill(r, c);
    renderBoard();
    checkWin();
  }
}

function floodFill(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  const g = grid[r][c];
  if (g.revealed || g.flagged || g.mine) return;
  g.revealed = true;
  if (g.adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        floodFill(r + dr, c + dc);
      }
    }
  }
}

function toggleFlag(r, c) {
  if (!gameActive || gameWon || !firstMoveDone) return;
  const g = grid[r][c];
  if (g.revealed) return;
  g.flagged = !g.flagged;
  flagsPlaced += g.flagged ? 1 : -1;
  minesLeftEl.textContent = totalMines - flagsPlaced;
  audioEngine.play('click');
  renderBoard();
}

function revealAllMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine) grid[r][c].revealed = true;
    }
  }
}

function checkWin() {
  let allSafeRevealed = true;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].mine && !grid[r][c].revealed) {
        allSafeRevealed = false;
        break;
      }
    }
  }
  if (allSafeRevealed) {
    gameActive = false;
    gameWon = true;
    stopTimer();
    audioEngine.play('win');
    // Cắm cờ tự động tất cả mìn
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) grid[r][c].flagged = true;
      }
    }
    renderBoard();
    showOverlay('🎉 Chúc mừng! Bạn đã dò hết mìn!');
  }
}

function showOverlay(message) {
  const container = document.getElementById('boardContainer');
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<p>${message}</p><button id="overlayRestart">Chơi lại</button>`;
  container.appendChild(overlay);
  document.getElementById('overlayRestart').addEventListener('click', () => {
    overlay.remove();
    initGame();
  });
}

// --- Cheat functions ---
function toggleShowMines() {
  showMines = !showMines;
  if (!gameActive) showMines = false; // tắt khi game over
  renderBoard();
}

function autoRevealSafe() {
  if (!gameActive || gameWon || !firstMoveDone) return;
  // Tìm một ô an toàn chưa mở và mở nó
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].mine && !grid[r][c].revealed && !grid[r][c].flagged) {
        floodFill(r, c);
        renderBoard();
        checkWin();
        return;
      }
    }
  }
}

function flagAllMines() {
  if (!gameActive || gameWon || !firstMoveDone) return;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine && !grid[r][c].flagged) {
        grid[r][c].flagged = true;
        flagsPlaced++;
      }
    }
  }
  minesLeftEl.textContent = totalMines - flagsPlaced;
  renderBoard();
  checkWin();
}

function instantWin() {
  if (!gameActive || gameWon || !firstMoveDone) {
    // Nếu chưa first move, giả lập
    if (!firstMoveDone) {
      placeMines(0, 0);
      firstMoveDone = true;
      startTimer();
    }
  }
  // Đánh dấu tất cả mìn và mở tất cả ô an toàn
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].mine) grid[r][c].revealed = true;
      else grid[r][c].flagged = true;
    }
  }
  gameActive = false;
  gameWon = true;
  stopTimer();
  audioEngine.play('win');
  minesLeftEl.textContent = '0';
  renderBoard();
  showOverlay('🎉 Thắng ngay!');
}

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
        font-size: 12px; max-width: 280px;
        border: 1px solid #0f0;
      }
      .on { color: #0f0; } .off { color: #f00; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[S] Hiện mìn: <span id="showMinesStat" class="off">OFF</span></div>
    <div>[A] Mở ô an toàn</div>
    <div>[F] Cắm cờ tất cả mìn</div>
    <div>[W] Thắng ngay</div>
    <div>[R] Chơi lại</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshAdvancedPanel();
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  const el = document.getElementById('showMinesStat');
  if (el) {
    el.textContent = showMines ? 'ON' : 'OFF';
    el.className = showMines ? 'on' : 'off';
  }
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

// Sự kiện bàn phím
document.addEventListener('keydown', (e) => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 's': case 'S': toggleShowMines(); refreshAdvancedPanel(); break;
    case 'a': case 'A': autoRevealSafe(); break;
    case 'f': case 'F': flagAllMines(); break;
    case 'w': case 'W': instantWin(); break;
    case 'r': case 'R': initGame(); break;
    default: break;
  }
});

difficultySelect.addEventListener('change', initGame);
restartBtn.addEventListener('click', initGame);
fullscreenBtn.addEventListener('click', () => {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
});

// Khởi động
createAdvancedPanel();
initGame();