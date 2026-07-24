// 🧠 Memory Match - Puzzle, hỗ trợ nâng cao (DevMode)
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const boardEl = document.getElementById('board');
const pairsFoundEl = document.getElementById('pairsFound');
const totalPairsEl = document.getElementById('totalPairs');
const attemptsEl = document.getElementById('attempts');
const difficultySelect = document.getElementById('difficultySelect');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const DIFFICULTIES = {
  easy:   { rows: 4, cols: 4 },
  medium: { rows: 6, cols: 6 },
  hard:   { rows: 8, cols: 8 }
};

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍒', '🥝', '🍑', '🥥',
                '🍕', '🍔', '🌮', '🍩', '🎂', '🍪', '🍿', '🍦',
                '⚽', '🏀', '🎾', '🏈', '🎱', '🏓', '🏸', '🥊',
                '🌍', '⭐', '🌈', '🔥', '💎', '🎯', '🎸', '🚀'];

let rows, cols, totalPairs;
let cards = [];          // Mảng phẳng các thẻ: { emoji, matched }
let revealed = new Set();// Chỉ số các thẻ đang lật
let attempts = 0;
let pairsFound = 0;
let gameActive = true;
let lockBoard = false;   // Khóa khi đang kiểm tra cặp

// DevMode
let showHint = false;
let hintPair = null;     // Cặp gợi ý (2 index)
let advancedPanel = null, panelVisible = false;

audioEngine.init();

function initGame() {
  const diff = difficultySelect.value;
  const config = DIFFICULTIES[diff];
  rows = config.rows;
  cols = config.cols;
  totalPairs = (rows * cols) / 2;
  
  // Chọn emoji ngẫu nhiên
  const selectedEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, totalPairs);
  // Nhân đôi và trộn
  const cardEmojis = [...selectedEmojis, ...selectedEmojis].sort(() => Math.random() - 0.5);
  
  cards = cardEmojis.map(emoji => ({ emoji, matched: false }));
  revealed.clear();
  attempts = 0;
  pairsFound = 0;
  gameActive = true;
  lockBoard = false;
  hintPair = null;
  
  pairsFoundEl.textContent = '0';
  totalPairsEl.textContent = totalPairs;
  attemptsEl.textContent = '0';
  
  renderBoard();
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  
  cards.forEach((card, index) => {
    const cell = document.createElement('div');
    cell.className = 'card';
    cell.dataset.index = index;
    
    if (card.matched) {
      cell.classList.add('matched');
      cell.textContent = card.emoji;
    } else if (revealed.has(index)) {
      cell.textContent = card.emoji;
      cell.classList.add('selected');
    } else {
      cell.textContent = '❓';
    }
    
    // Hint
    if (showHint && hintPair && (hintPair[0] === index || hintPair[1] === index)) {
      cell.classList.add('hint');
    }
    
    cell.addEventListener('click', () => handleCardClick(index));
    boardEl.appendChild(cell);
  });
}

function handleCardClick(index) {
  if (!gameActive || lockBoard) return;
  const card = cards[index];
  if (card.matched || revealed.has(index)) return;
  
  // Lật thẻ
  revealed.add(index);
  audioEngine.play('flip');
  renderBoard();
  
  if (revealed.size === 2) {
    // Kiểm tra cặp
    lockBoard = true;
    attempts++;
    attemptsEl.textContent = attempts;
    
    const [idx1, idx2] = [...revealed];
    if (cards[idx1].emoji === cards[idx2].emoji) {
      // Đúng
      cards[idx1].matched = true;
      cards[idx2].matched = true;
      pairsFound++;
      pairsFoundEl.textContent = pairsFound;
      revealed.clear();
      lockBoard = false;
      audioEngine.play('match');
      renderBoard();
      
      if (pairsFound === totalPairs) {
        gameActive = false;
        audioEngine.play('win');
        showOverlay('🎉 Chúc mừng! Bạn đã tìm hết cặp!');
      }
    } else {
      // Sai - lật lại sau 800ms
      setTimeout(() => {
        revealed.clear();
        lockBoard = false;
        renderBoard();
      }, 800);
    }
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
function toggleHint() {
  showHint = !showHint;
  if (!showHint) {
    hintPair = null;
    renderBoard();
    return;
  }
  // Tìm một cặp chưa matched để gợi ý
  findHintPair();
  refreshAdvancedPanel();
}

function findHintPair() {
  const unmatched = [];
  cards.forEach((card, i) => {
    if (!card.matched && !revealed.has(i)) unmatched.push({ index: i, emoji: card.emoji });
  });
  // Tìm cặp đầu tiên
  for (let i = 0; i < unmatched.length; i++) {
    for (let j = i + 1; j < unmatched.length; j++) {
      if (unmatched[i].emoji === unmatched[j].emoji) {
        hintPair = [unmatched[i].index, unmatched[j].index];
        renderBoard();
        return;
      }
    }
  }
  hintPair = null;
}

function autoMatch() {
  if (!gameActive || lockBoard) return;
  // Tìm một cặp chưa matched và tự động lật khớp
  const unmatched = {};
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].matched && !revealed.has(i)) {
      if (unmatched[cards[i].emoji] !== undefined) {
        // Tìm thấy cặp
        const idx1 = unmatched[cards[i].emoji];
        const idx2 = i;
        cards[idx1].matched = true;
        cards[idx2].matched = true;
        pairsFound++;
        pairsFoundEl.textContent = pairsFound;
        revealed.clear();
        lockBoard = false;
        audioEngine.play('match');
        renderBoard();
        if (pairsFound === totalPairs) {
          gameActive = false;
          audioEngine.play('win');
          showOverlay('🎉 Chúc mừng! Bạn đã tìm hết cặp!');
        }
        return;
      } else {
        unmatched[cards[i].emoji] = i;
      }
    }
  }
}

function revealAll() {
  // Tạm thời hiển thị tất cả thẻ trong 2 giây
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].matched) revealed.add(i);
  }
  renderBoard();
  setTimeout(() => {
    revealed.clear();
    renderBoard();
  }, 2000);
}

function instantWin() {
  for (let i = 0; i < cards.length; i++) {
    cards[i].matched = true;
  }
  pairsFound = totalPairs;
  pairsFoundEl.textContent = pairsFound;
  attempts++;
  attemptsEl.textContent = attempts;
  gameActive = false;
  revealed.clear();
  audioEngine.play('win');
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
    <div>[H] Gợi ý cặp: <span id="hintStat" class="off">OFF</span></div>
    <div>[A] Tự động ghép 1 cặp</div>
    <div>[V] Lật tất cả (2 giây)</div>
    <div>[W] Thắng ngay</div>
    <div>[R] Chơi lại</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshAdvancedPanel();
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  const el = document.getElementById('hintStat');
  if (el) {
    el.textContent = showHint ? 'ON' : 'OFF';
    el.className = showHint ? 'on' : 'off';
  }
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
    case 'h': case 'H': toggleHint(); break;
    case 'a': case 'A': autoMatch(); break;
    case 'v': case 'V': revealAll(); break;
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

createAdvancedPanel();
initGame();