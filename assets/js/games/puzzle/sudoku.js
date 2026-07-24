// 🧩 Sudoku - Mạng, cấm số sai, mã hóa đáp án, cheat panel ẩn
import { audioEngine } from '../../core/audio-engine.js';
import { isDevMode } from '../../core/devMode.js';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const livesEl = document.getElementById('lives');
const timerEl = document.getElementById('timer');
const difficultySelect = document.getElementById('difficultySelect');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const numberPad = document.getElementById('numberPad');

const ENC_KEY = 0x5A;
function encode(arr) { return arr.map(row => row.map(v => v ^ ENC_KEY)); }
function decode(arr) { return arr.map(row => row.map(v => v ^ ENC_KEY)); }

let solutionEnc = [];
let puzzle = [];
let originalGiven = [];
let selectedRow = -1, selectedCol = -1;
let forbidden = []; // forbidden[r][c] = Set of numbers đã thử sai
let lives = 5;
let timerSec = 0;
let timerInterval = null;
let gameActive = true;
let gameWon = false;

// DevMode
let invincible = false;
let advancedPanel = null, panelVisible = false;

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => { timerSec++; timerEl.textContent = timerSec; }, 1000);
}
function stopTimer() { if (timerInterval) clearInterval(timerInterval); timerInterval = null; }

// Generator
function generateSolution() {
  const board = Array(9).fill().map(() => Array(9).fill(0));
  fillBoard(board);
  return board;
}
function fillBoard(board) {
  const empty = findEmpty(board);
  if (!empty) return true;
  const [r, c] = empty;
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const num of nums) {
    if (isValidPlace(board, r, c, num)) {
      board[r][c] = num;
      if (fillBoard(board)) return true;
      board[r][c] = 0;
    }
  }
  return false;
}
function findEmpty(board) {
  for (let r=0; r<9; r++) for (let c=0; c<9; c++) if (board[r][c]===0) return [r,c];
  return null;
}
function isValidPlace(board, r, c, num) {
  for (let i=0; i<9; i++) if (board[r][i]===num || board[i][c]===num) return false;
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  for (let i=0; i<3; i++) for (let j=0; j<3; j++) if (board[br+i][bc+j]===num) return false;
  return true;
}
function shuffle(arr) {
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function createPuzzle(sol, diff) {
  const p = sol.map(row => [...row]);
  const cells = [];
  for (let r=0; r<9; r++) for (let c=0; c<9; c++) cells.push([r,c]);
  shuffle(cells);
  let remove = { easy: 40, medium: 50, hard: 60 }[diff] || 50;
  for (const [r,c] of cells) {
    if (remove <= 0) break;
    p[r][c] = 0;
    remove--;
  }
  return p;
}

function initGame() {
  stopTimer();
  const sol = generateSolution();
  solutionEnc = encode(sol);
  const diff = difficultySelect.value;
  puzzle = createPuzzle(sol, diff);
  originalGiven = puzzle.map(row => [...row]);
  forbidden = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
  lives = 5;
  timerSec = 0;
  timerEl.textContent = '0';
  livesEl.textContent = lives;
  gameActive = true;
  gameWon = false;
  selectedRow = -1; selectedCol = -1;
  renderBoard();
  renderNumberPad();
  statusEl.textContent = 'Chọn ô và nhập số';
  startTimer();
}

function renderBoard() {
  boardEl.innerHTML = '';
  const sol = decode(solutionEnc);
  for (let r=0; r<9; r++) {
    for (let c=0; c<9; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const val = puzzle[r][c];
      if (originalGiven[r][c] !== 0) {
        cell.classList.add('given');
        cell.textContent = val;
      } else if (val !== 0) {
        cell.classList.add('user');
        cell.textContent = val;
        if (sol[r][c] !== val) cell.classList.add('error');
      }
      if (selectedRow === r && selectedCol === c) cell.classList.add('selected');
      // Hiển thị các số bị cấm trong ô
      if (forbidden[r][c].size > 0 && originalGiven[r][c] === 0 && puzzle[r][c] === 0) {
        const div = document.createElement('span');
        div.className = 'forbidden-nums';
        div.textContent = [...forbidden[r][c]].join(',');
        cell.appendChild(div);
      }
      cell.addEventListener('click', () => selectCell(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function selectCell(r, c) {
  if (!gameActive || gameWon || originalGiven[r][c] !== 0) return;
  selectedRow = r; selectedCol = c;
  renderBoard();
}

function renderNumberPad() {
  numberPad.innerHTML = '';
  for (let i=1; i<=9; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.addEventListener('click', () => placeNumber(i));
    numberPad.appendChild(btn);
  }
}

function placeNumber(num) {
  if (!gameActive || gameWon || selectedRow < 0 || selectedCol < 0) return;
  const r = selectedRow, c = selectedCol;
  if (originalGiven[r][c] !== 0) return;

  const sol = decode(solutionEnc);
  const correct = sol[r][c];

  if (num === 0) {
    // Xóa
    puzzle[r][c] = 0;
    // Xóa khỏi danh sách cấm? Không, giữ nguyên các số đã sai.
    renderBoard();
    return;
  }

  if (forbidden[r][c].has(num)) {
    statusEl.textContent = `⚠️ Số ${num} đã được xác nhận là sai cho ô này. Vui lòng chọn số khác.`;
    return;
  }

  if (num === correct) {
    puzzle[r][c] = num;
    forbidden[r][c].clear(); // Xóa lịch sử sai nếu đúng
    audioEngine.play('click');
    renderBoard();
    checkWin();
  } else {
    // Sai
    if (!invincible) {
      forbidden[r][c].add(num);
      lives--;
      livesEl.textContent = lives;
      audioEngine.play('error');
      if (lives <= 0) {
        gameActive = false;
        stopTimer();
        statusEl.textContent = '💀 Hết mạng! Game Over.';
        showOverlay('💀 Game Over!', true);
        renderBoard();
        return;
      }
    }
    statusEl.textContent = `❌ Số ${num} sai. ${invincible ? '(Bất tử)' : 'Mất 1 mạng.'}`;
    puzzle[r][c] = 0; // Không điền số sai
    renderBoard();
  }
}

function checkWin() {
  const sol = decode(solutionEnc);
  for (let r=0; r<9; r++) {
    for (let c=0; c<9; c++) {
      if (puzzle[r][c] !== sol[r][c]) return;
    }
  }
  gameWon = true;
  gameActive = false;
  stopTimer();
  statusEl.textContent = '🎉 Chúc mừng! Bạn đã giải đúng!';
  showOverlay('🎉 Chiến thắng!', false);
}

function showOverlay(msg, isGameOver) {
  const container = document.getElementById('boardContainer');
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<p>${msg}</p><button id="overlayBtn">Chơi lại</button>`;
  container.appendChild(overlay);
  document.getElementById('overlayBtn').addEventListener('click', () => {
    overlay.remove();
    initGame();
  });
}

// DevMode
function createAdvancedPanel() {
  if (!isDevMode()) return;
  advancedPanel = document.createElement('div');
  advancedPanel.id = 'advanced-panel';
  advancedPanel.style.display = 'none';
  advancedPanel.innerHTML = `
    <style>#advanced-panel{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;padding:12px;border-radius:8px;z-index:9999;font-size:12px;max-width:280px;border:1px solid #0f0;}.on{color:#0f0;}.off{color:#f00;}</style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[I] Bất tử: <span id="invStat" class="off">OFF</span></div>
    <div>[S] Hiện đáp án</div>
    <div>[R] Chơi lại</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshPanel();
}
function refreshPanel() {
  if (!advancedPanel) return;
  document.getElementById('invStat').textContent = invincible ? 'ON' : 'OFF';
  document.getElementById('invStat').className = invincible ? 'on' : 'off';
}
function togglePanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === '`') { e.preventDefault(); togglePanel(); return; }
  if (!isDevMode()) {
    // Điều khiển số bằng bàn phím
    if (e.key >= '1' && e.key <= '9') { placeNumber(parseInt(e.key)); e.preventDefault(); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { placeNumber(0); e.preventDefault(); }
    return;
  }
  e.preventDefault();
  switch (e.key) {
    case 'i': case 'I': invincible = !invincible; refreshPanel(); break;
    case 's': case 'S': // Hiện đáp án
      if (gameActive) {
        const sol = decode(solutionEnc);
        for (let r=0; r<9; r++) for (let c=0; c<9; c++) if (originalGiven[r][c]===0) puzzle[r][c] = sol[r][c];
        gameWon = true; gameActive = false;
        stopTimer();
        renderBoard();
        showOverlay('🎉 Đáp án đã hiện!', false);
      }
      break;
    case 'r': case 'R': initGame(); break;
    default: break;
  }
});

difficultySelect.addEventListener('change', initGame);
restartBtn.addEventListener('click', initGame);
fullscreenBtn.addEventListener('click', () => document.documentElement.requestFullscreen());

createAdvancedPanel();
initGame();