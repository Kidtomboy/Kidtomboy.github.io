// 🃏 FreeCell - Unicode, drag & drop, animation chiến thắng, cheat panel đầy đủ
import { isDevMode } from '../../core/devMode.js';
import { audioEngine } from '../../core/audio-engine.js';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const COLORS = { hearts: 'red', diamonds: 'red', clubs: 'black', spades: 'black' };
const FOUNDATION_SUIT_ORDER = ['hearts', 'diamonds', 'clubs', 'spades'];

let freecells = [null, null, null, null];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], [], []];
let selectedCard = null;
let dragData = null;
let gameActive = true;
let history = [];
let advancedPanel = null, panelVisible = false;

// Cheat flags
let freeMoveMode = false;
let swapMode = false;
let swapCard = null;
let originalCanMove = null;

audioEngine.init();

// --- DECK ---
function createDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      cards.push({
        suit, rank: RANKS[i], rankIndex: i,
        symbol: SYMBOLS[suit],
        color: COLORS[suit]
      });
    }
  }
  return cards;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function takeSnapshot() {
  return {
    freecells: freecells.map(c => c ? {...c} : null),
    foundations: foundations.map(p => p.map(c => ({...c}))),
    tableau: tableau.map(p => p.map(c => ({...c})))
  };
}

function restoreSnapshot(snap) {
  freecells = snap.freecells.map(c => c ? {...c} : null);
  foundations = snap.foundations.map(p => p.map(c => ({...c})));
  tableau = snap.tableau.map(p => p.map(c => ({...c})));
}

function newGame() {
  const deck = createDeck();
  shuffle(deck);
  freecells = [null, null, null, null];
  foundations = [[], [], [], []];
  tableau = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < 52; i++) {
    tableau[i % 8].push(deck[i]);
  }
  selectedCard = null;
  dragData = null;
  gameActive = true;
  history = [];
  freeMoveMode = false;
  swapMode = false;
  swapCard = null;
  if (originalCanMove) canMove = originalCanMove;
  renderAll();
  refreshAdvancedPanel();
}

// --- RENDER ---
function renderAll() {
  renderTopRow();
  renderBottomRow();
  updateContainerHeight();
}

function renderTopRow() {
  const topRow = document.getElementById('topRow');
  topRow.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell freecell';
    cell.dataset.index = i;
    if (freecells[i]) {
      const cardEl = createCardElement(freecells[i]);
      cardEl.style.position = 'absolute'; cardEl.style.top = '5px'; cardEl.style.left = '2px';
      cardEl.draggable = true;
      cardEl.addEventListener('dragstart', (e) => onDragStart(e, 'freecell', i));
      cardEl.addEventListener('click', () => selectCard('freecell', i));
      if (selectedCard && selectedCard.location === 'freecell' && selectedCard.pileIndex === i) cardEl.classList.add('selected');
      cell.appendChild(cardEl);
    } else {
      cell.addEventListener('dragover', (e) => e.preventDefault());
      cell.addEventListener('drop', (e) => onDrop(e, 'freecell', i));
      cell.addEventListener('click', () => selectCard('freecell', i));
    }
    topRow.appendChild(cell);
  }
  for (let i = 0; i < 4; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell foundation';
    cell.dataset.index = i;
    cell.textContent = ['♥','♦','♣','♠'][i];
    if (foundations[i].length > 0) {
      cell.classList.add('has-card');
      const topCard = foundations[i][foundations[i].length - 1];
      const cardEl = createCardElement(topCard);
      cardEl.style.position = 'absolute'; cardEl.style.top = '5px'; cardEl.style.left = '2px';
      cardEl.draggable = true;
      cardEl.addEventListener('dragstart', (e) => onDragStart(e, 'foundation', i));
      cardEl.addEventListener('click', () => selectCard('foundation', i));
      if (selectedCard && selectedCard.location === 'foundation' && selectedCard.pileIndex === i) cardEl.classList.add('selected');
      cell.appendChild(cardEl);
    } else {
      cell.addEventListener('dragover', (e) => e.preventDefault());
      cell.addEventListener('drop', (e) => onDrop(e, 'foundation', i));
      cell.addEventListener('click', () => selectCard('foundation', i));
    }
    topRow.appendChild(cell);
  }
}

function renderBottomRow() {
  const bottomRow = document.getElementById('bottomRow');
  bottomRow.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell tableau';
    cell.dataset.index = i;
    const pileHeight = Math.max(110, tableau[i].length * 25 + 30);
    cell.style.height = pileHeight + 'px';
    cell.style.minHeight = pileHeight + 'px';
    for (let j = 0; j < tableau[i].length; j++) {
      const card = tableau[i][j];
      const cardEl = createCardElement(card);
      cardEl.style.position = 'absolute';
      cardEl.style.top = (j * 25 + 5) + 'px';
      cardEl.style.left = '2px';
      cardEl.draggable = true;
      cardEl.addEventListener('dragstart', (e) => onDragStart(e, 'tableau', i, j));
      cardEl.addEventListener('click', (e) => { e.stopPropagation(); selectCard('tableau', i, j); });
      if (selectedCard && selectedCard.location === 'tableau' && selectedCard.pileIndex === i && selectedCard.cardIndex === j) {
        cardEl.classList.add('selected');
      }
      cell.appendChild(cardEl);
    }
    cell.addEventListener('dragover', (e) => e.preventDefault());
    cell.addEventListener('drop', (e) => onDrop(e, 'tableau', i));
    cell.addEventListener('click', () => selectCard('tableau', i, -1));
    bottomRow.appendChild(cell);
  }
}

function createCardElement(card) {
  const el = document.createElement('div');
  el.className = 'card face-up ' + card.color;
  el.innerHTML = `
    <div class="corner-top">${card.rank}<br></div>
    <div class="center-suit">${card.symbol}</div>
    <div class="corner-bottom">${card.rank}<br></div>
  `;
  return el;
}

function updateContainerHeight() {
  const maxPile = Math.max(...tableau.map(p => p.length), 1);
  document.getElementById('gameContainer').style.minHeight = (maxPile * 25 + 280) + 'px';
}

// --- DRAG & DROP ---
function onDragStart(e, location, pileIndex, cardIndex = 0) {
  if (!gameActive) return;
  dragData = { location, pileIndex, cardIndex };
  e.dataTransfer.setData('text/plain', '');
  setTimeout(() => {
    const el = e.target.closest('.card');
    if (el) el.classList.add('dragging');
  }, 0);
}

function onDrop(e, destLocation, destPileIndex) {
  e.preventDefault();
  if (!dragData || !gameActive) return;
  const src = dragData;
  if (canMove(src, destLocation, destPileIndex)) {
    history.push(takeSnapshot());
    moveCard(src, destLocation, destPileIndex);
    renderAll();
    checkWin();
  }
  dragData = null;
  document.querySelectorAll('.card.dragging').forEach(c => c.classList.remove('dragging'));
}

// --- SELECTION ---
function selectCard(location, pileIndex, cardIndex = 0) {
  if (!gameActive) return;

  // Xử lý swap mode
  if (swapMode) {
    if (!swapCard) {
      swapCard = { location, pileIndex, cardIndex };
      renderAll();
      return;
    } else {
      if (swapCard.location === location && swapCard.pileIndex === pileIndex && swapCard.cardIndex === cardIndex) {
        swapCard = null;
        renderAll();
        return;
      }
      performSwap(swapCard, { location, pileIndex, cardIndex });
      swapCard = null;
      renderAll();
      return;
    }
  }

  // Click thường
  if (selectedCard) {
    if (selectedCard.location === location && selectedCard.pileIndex === pileIndex && 
        (selectedCard.cardIndex === cardIndex || location === 'freecell' || location === 'foundation')) {
      selectedCard = null;
      renderAll();
      return;
    }
    if (canMove(selectedCard, location, pileIndex)) {
      history.push(takeSnapshot());
      moveCard(selectedCard, location, pileIndex);
      selectedCard = null;
      renderAll();
      checkWin();
    } else {
      selectedCard = null;
      renderAll();
    }
    return;
  }

  // Chọn lá
  if (location === 'freecell' && freecells[pileIndex]) selectedCard = { location, pileIndex, cardIndex: 0 };
  else if (location === 'foundation' && foundations[pileIndex].length > 0) selectedCard = { location, pileIndex, cardIndex: foundations[pileIndex].length - 1 };
  else if (location === 'tableau') {
    if (cardIndex === -1) return;
    if (tableau[pileIndex][cardIndex]) selectedCard = { location, pileIndex, cardIndex };
  }
  renderAll();
}

// --- MOVEMENT ---
let canMove = function(src, destLocation, destPileIndex) {
  if (freeMoveMode) return true;
  let cardsToMove = [];
  if (src.location === 'freecell') cardsToMove = [freecells[src.pileIndex]];
  else if (src.location === 'tableau') cardsToMove = [tableau[src.pileIndex][src.cardIndex]];
  else if (src.location === 'foundation') cardsToMove = [foundations[src.pileIndex][src.cardIndex]];
  if (!cardsToMove[0]) return false;
  const card = cardsToMove[0];
  if (destLocation === 'freecell') return freecells[destPileIndex] === null;
  if (destLocation === 'foundation') {
    const destPile = foundations[destPileIndex];
    if (card.suit !== FOUNDATION_SUIT_ORDER[destPileIndex]) return false;
    if (destPile.length === 0) return card.rankIndex === 0;
    return card.rankIndex === destPile[destPile.length - 1].rankIndex + 1;
  }
  if (destLocation === 'tableau') {
    const destPile = tableau[destPileIndex];
    if (destPile.length === 0) return true;
    const topCard = destPile[destPile.length - 1];
    return card.color !== topCard.color && card.rankIndex === topCard.rankIndex - 1;
  }
  return false;
};

function moveCard(src, destLocation, destPileIndex) {
  let cardsToMove = [];
  if (src.location === 'freecell') { cardsToMove = [freecells[src.pileIndex]]; freecells[src.pileIndex] = null; }
  else if (src.location === 'tableau') cardsToMove = [tableau[src.pileIndex].pop()];
  else if (src.location === 'foundation') cardsToMove = [foundations[src.pileIndex].pop()];
  if (destLocation === 'freecell') freecells[destPileIndex] = cardsToMove[0];
  else if (destLocation === 'foundation') foundations[destPileIndex].push(cardsToMove[0]);
  else if (destLocation === 'tableau') tableau[destPileIndex].push(cardsToMove[0]);
}

// --- WIN ---
function checkWin() {
  if (foundations.every(p => p.length === 13)) {
    gameActive = false;
    setTimeout(showWinOverlay, 300);
  }
}

function showWinOverlay() {
  const container = document.getElementById('gameContainer');
  container.querySelector('.win-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'win-overlay';
  overlay.innerHTML = `<p>🎉 Chúc mừng! Bạn đã thắng!</p><button id="winRestart">Chơi lại</button>`;
  container.appendChild(overlay);
  document.getElementById('winRestart').addEventListener('click', () => { overlay.remove(); newGame(); });
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
    confetti.style.animationDelay = Math.random() + 's';
    confetti.style.background = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6'][Math.floor(Math.random()*5)];
    container.appendChild(confetti);
  }
}

// --- UNDO ---
function undo() {
  if (history.length === 0 || !gameActive) return;
  restoreSnapshot(history.pop());
  selectedCard = null;
  renderAll();
}

// --- CHEATS ---
function autoComplete() {
  if (!gameActive) return;
  let moved = true;
  for (let iter = 0; iter < 300 && moved; iter++) {
    moved = false;
    for (let i = 0; i < 4; i++) {
      if (!freecells[i]) continue;
      for (let f = 0; f < 4; f++) {
        if (canMove({location:'freecell', pileIndex:i}, 'foundation', f)) {
          history.push(takeSnapshot());
          moveCard({location:'freecell', pileIndex:i}, 'foundation', f);
          moved = true; break;
        }
      }
      if (moved) break;
    }
    if (moved) continue;
    for (let t = 0; t < 8; t++) {
      if (!tableau[t].length) continue;
      const idx = tableau[t].length - 1;
      for (let f = 0; f < 4; f++) {
        if (canMove({location:'tableau', pileIndex:t, cardIndex:idx}, 'foundation', f)) {
          history.push(takeSnapshot());
          moveCard({location:'tableau', pileIndex:t, cardIndex:idx}, 'foundation', f);
          moved = true; break;
        }
      }
      if (moved) break;
    }
    if (moved) continue;
    for (let i = 0; i < 4; i++) {
      if (!freecells[i]) continue;
      for (let t = 0; t < 8; t++) {
        if (canMove({location:'freecell', pileIndex:i}, 'tableau', t)) {
          history.push(takeSnapshot());
          moveCard({location:'freecell', pileIndex:i}, 'tableau', t);
          moved = true; break;
        }
      }
      if (moved) break;
    }
  }
  renderAll();
  checkWin();
}

function hintMove() {
  if (!gameActive) return;
  const moves = [];
  for (let i = 0; i < 4; i++) {
    if (!freecells[i]) continue;
    for (let f = 0; f < 4; f++) if (canMove({location:'freecell', pileIndex:i}, 'foundation', f)) moves.push({src:{location:'freecell',pileIndex:i}, dest:'foundation',destIdx:f});
  }
  for (let t = 0; t < 8; t++) {
    if (!tableau[t].length) continue;
    const idx = tableau[t].length - 1;
    for (let f = 0; f < 4; f++) if (canMove({location:'tableau', pileIndex:t, cardIndex:idx}, 'foundation', f)) moves.push({src:{location:'tableau',pileIndex:t,cardIndex:idx}, dest:'foundation',destIdx:f});
  }
  if (moves.length > 0) {
    const best = moves[0];
    selectedCard = best.src;
    renderAll();
    // Highlight đích
    const container = document.getElementById('gameContainer');
    container.querySelectorAll('.hint-glow').forEach(el => el.classList.remove('hint-glow'));
    let destEl;
    if (best.dest === 'foundation') destEl = container.querySelector(`.foundation[data-index="${best.destIdx}"]`);
    else if (best.dest === 'freecell') destEl = container.querySelector(`.freecell[data-index="${best.destIdx}"]`);
    else if (best.dest === 'tableau') destEl = container.querySelector(`.tableau[data-index="${best.destIdx}"]`);
    if (destEl) {
      destEl.classList.add('hint-glow');
      setTimeout(() => destEl.classList.remove('hint-glow'), 2000);
    }
  }
}

function toggleFreeMove() {
  freeMoveMode = !freeMoveMode;
  refreshAdvancedPanel();
}

function toggleSwapMode() {
  swapMode = !swapMode;
  swapCard = null;
  refreshAdvancedPanel();
}

function deleteSelected() {
  if (!selectedCard || !gameActive) return;
  history.push(takeSnapshot());
  const {location, pileIndex, cardIndex} = selectedCard;
  if (location === 'freecell') freecells[pileIndex] = null;
  else if (location === 'tableau') tableau[pileIndex].splice(cardIndex, 1);
  else if (location === 'foundation') foundations[pileIndex].pop();
  selectedCard = null;
  renderAll();
}

function spawnRandomCard() {
  if (!gameActive) return;
  history.push(takeSnapshot());
  const card = {
    suit: SUITS[Math.floor(Math.random()*4)],
    rank: RANKS[Math.floor(Math.random()*13)],
    rankIndex: Math.floor(Math.random()*13),
    symbol: '', color: ''
  };
  card.symbol = SYMBOLS[card.suit];
  card.color = COLORS[card.suit];
  // Đặt vào freecell trống hoặc cột tableau trống
  for (let i = 0; i < 4; i++) {
    if (!freecells[i]) { freecells[i] = card; renderAll(); return; }
  }
  for (let t = 0; t < 8; t++) {
    if (tableau[t].length === 0) { tableau[t].push(card); renderAll(); return; }
  }
  // Nếu không có chỗ, đặt vào cột đầu tiên
  tableau[0].push(card);
  renderAll();
}

function performSwap(card1, card2) {
  history.push(takeSnapshot());
  // Lấy hai lá
  let c1, c2;
  if (card1.location === 'freecell') c1 = freecells[card1.pileIndex];
  else if (card1.location === 'tableau') c1 = tableau[card1.pileIndex][card1.cardIndex];
  else if (card1.location === 'foundation') c1 = foundations[card1.pileIndex][card1.cardIndex];
  if (card2.location === 'freecell') c2 = freecells[card2.pileIndex];
  else if (card2.location === 'tableau') c2 = tableau[card2.pileIndex][card2.cardIndex];
  else if (card2.location === 'foundation') c2 = foundations[card2.pileIndex][card2.cardIndex];
  // Xóa
  if (card1.location === 'freecell') freecells[card1.pileIndex] = null;
  else if (card1.location === 'tableau') tableau[card1.pileIndex].splice(card1.cardIndex, 1);
  else if (card1.location === 'foundation') foundations[card1.pileIndex].pop();
  if (card2.location === 'freecell') freecells[card2.pileIndex] = null;
  else if (card2.location === 'tableau') tableau[card2.pileIndex].splice(card2.cardIndex, 1);
  else if (card2.location === 'foundation') foundations[card2.pileIndex].pop();
  // Đặt lại
  if (card1.location === 'freecell') freecells[card1.pileIndex] = c2;
  else if (card1.location === 'tableau') tableau[card1.pileIndex].splice(card1.cardIndex, 0, c2);
  else if (card1.location === 'foundation') foundations[card1.pileIndex].push(c2);
  if (card2.location === 'freecell') freecells[card2.pileIndex] = c1;
  else if (card2.location === 'tableau') tableau[card2.pileIndex].splice(card2.cardIndex, 0, c1);
  else if (card2.location === 'foundation') foundations[card2.pileIndex].push(c1);
}

// --- DEV PANEL ---
function createAdvancedPanel() {
  if (!isDevMode()) return;
  advancedPanel = document.createElement('div');
  advancedPanel.id = 'advanced-panel';
  advancedPanel.style.display = 'none';
  advancedPanel.innerHTML = `
    <style>
      #advanced-panel{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;padding:12px;border-radius:8px;z-index:9999;font-size:12px;max-width:260px;border:1px solid #0f0;}
      .on { color: #0f0; } .off { color: #f00; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[U] Hoàn tác (Ctrl+Z)</div>
    <div>[A] Tự động hoàn thành</div>
    <div>[H] Gợi ý nước đi (highlight)</div>
    <div>[F] Tự do di chuyển: <span id="freeStat" class="off">OFF</span></div>
    <div>[S] Hoán đổi (Swap): <span id="swapStat" class="off">OFF</span></div>
    <div>[X] Xóa lá đang chọn</div>
    <div>[R] Thêm lá ngẫu nhiên</div>
    <div>[N] Ván mới</div>
  `;
  document.body.appendChild(advancedPanel);
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  document.getElementById('freeStat').textContent = freeMoveMode ? 'ON' : 'OFF';
  document.getElementById('freeStat').className = freeMoveMode ? 'on' : 'off';
  document.getElementById('swapStat').textContent = swapMode ? 'ON' : 'OFF';
  document.getElementById('swapStat').className = swapMode ? 'on' : 'off';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

// --- EVENTS ---
document.addEventListener('keydown', e => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 'u': case 'U': undo(); break;
    case 'a': case 'A': autoComplete(); break;
    case 'h': case 'H': hintMove(); break;
    case 'f': case 'F': toggleFreeMove(); break;
    case 's': case 'S': toggleSwapMode(); break;
    case 'x': case 'X': deleteSelected(); break;
    case 'r': case 'R': spawnRandomCard(); break;
    case 'n': case 'N': newGame(); break;
  }
});

document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen());

// Khởi động
createAdvancedPanel();
newGame();