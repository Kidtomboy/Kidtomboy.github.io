// 🃏 Solitaire - Klondike, Unicode, drag & drop, animation chiến thắng, cheat panel đầy đủ
import { isDevMode } from '../../core/devMode.js';
import { audioEngine } from '../../core/audio-engine.js';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const COLORS = { hearts: 'red', diamonds: 'red', clubs: 'black', spades: 'black' };
const FOUNDATION_SUIT_ORDER = ['hearts', 'diamonds', 'clubs', 'spades'];

let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let selectedCard = null;
let dragData = null;
let gameActive = true;
let history = [];
let allRevealed = false;
let preRevealSnapshot = null;
let advancedPanel = null, panelVisible = false;

audioEngine.init();

// --- DECK ---
function createDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      cards.push({
        suit, rank: RANKS[i], rankIndex: i,
        faceUp: false,
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
    stock: stock.map(c => ({...c})),
    waste: waste.map(c => ({...c})),
    foundations: foundations.map(p => p.map(c => ({...c}))),
    tableau: tableau.map(p => p.map(c => ({...c})))
  };
}

function restoreSnapshot(snap) {
  stock = snap.stock.map(c => ({...c}));
  waste = snap.waste.map(c => ({...c}));
  foundations = snap.foundations.map(p => p.map(c => ({...c})));
  tableau = snap.tableau.map(p => p.map(c => ({...c})));
}

function newGame() {
  const deck = createDeck();
  shuffle(deck);
  stock = [...deck];
  waste = [];
  foundations = [[], [], [], []];
  tableau = [[], [], [], [], [], [], []];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = stock.pop();
      if (j === i) card.faceUp = true;
      tableau[i].push(card);
    }
  }
  selectedCard = null;
  dragData = null;
  gameActive = true;
  history = [];
  allRevealed = false;
  preRevealSnapshot = null;
  renderAll();
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
  topRow.appendChild(createStockCell());
  topRow.appendChild(createWasteCell());
  const emptyCell = document.createElement('div');
  emptyCell.className = 'cell empty';
  topRow.appendChild(emptyCell);
  for (let i = 0; i < 4; i++) {
    topRow.appendChild(createFoundationCell(i));
  }
}

function createStockCell() {
  const cell = document.createElement('div');
  cell.className = 'cell stock';
  if (stock.length > 0) {
    const cardEl = createCardElement({ faceUp: false, isStock: true });
    cardEl.style.position = 'absolute'; cardEl.style.top = '5px'; cardEl.style.left = '2px';
    cardEl.addEventListener('click', drawFromStock);
    cell.appendChild(cardEl);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'card face-up';
    placeholder.style.background = '#27ae60';
    placeholder.innerHTML = '<div class="center-suit">↺</div>';
    placeholder.addEventListener('click', resetStock);
    cell.appendChild(placeholder);
  }
  return cell;
}

function createWasteCell() {
  const cell = document.createElement('div');
  cell.className = 'cell waste';
  if (waste.length > 0) {
    const topCard = waste[waste.length - 1];
    const cardEl = createCardElement(topCard);
    cardEl.style.position = 'absolute'; cardEl.style.top = '5px'; cardEl.style.left = '2px';
    cardEl.draggable = true;
    cardEl.addEventListener('dragstart', (e) => onDragStart(e, 'waste', 0));
    cardEl.addEventListener('click', () => selectCard('waste', 0));
    cell.appendChild(cardEl);
  }
  return cell;
}

function createFoundationCell(fIdx) {
  const cell = document.createElement('div');
  cell.className = 'cell foundation';
  const suitSymbol = ['♥','♦','♣','♠'][fIdx];
  cell.textContent = suitSymbol;
  if (foundations[fIdx].length > 0) {
    cell.classList.add('has-card');
    const topCard = foundations[fIdx][foundations[fIdx].length - 1];
    const cardEl = createCardElement(topCard);
    cardEl.style.position = 'absolute'; cardEl.style.top = '5px'; cardEl.style.left = '2px';
    cardEl.draggable = true;
    cardEl.addEventListener('dragstart', (e) => onDragStart(e, 'foundation', fIdx));
    cardEl.addEventListener('click', () => selectCard('foundation', fIdx));
    cell.appendChild(cardEl);
  } else {
    cell.addEventListener('dragover', (e) => e.preventDefault());
    cell.addEventListener('drop', (e) => onDrop(e, 'foundation', fIdx));
    cell.addEventListener('click', () => selectCard('foundation', fIdx));
  }
  return cell;
}

function renderBottomRow() {
  const bottomRow = document.getElementById('bottomRow');
  bottomRow.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell tableau';
    const pileHeight = Math.max(110, tableau[i].length * 25 + 30);
    cell.style.height = pileHeight + 'px';
    cell.style.minHeight = pileHeight + 'px';
    for (let j = 0; j < tableau[i].length; j++) {
      const card = tableau[i][j];
      const cardEl = createCardElement(card);
      cardEl.style.position = 'absolute';
      cardEl.style.top = (j * 25 + 5) + 'px';
      cardEl.style.left = '2px';
      if (card.faceUp) {
        cardEl.draggable = true;
        cardEl.addEventListener('dragstart', (e) => onDragStart(e, 'tableau', i, j));
      }
      cardEl.addEventListener('click', (e) => { e.stopPropagation(); selectCard('tableau', i, j); });
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
  el.className = 'card';
  if (!card.faceUp) {
    el.classList.add('face-down');
    return el;
  }
  el.classList.add('face-up', card.color);
  el.innerHTML = `
    <div class="corner-top">${card.rank}<br></div>
    <div class="center-suit">${card.symbol}</div>
    <div class="corner-bottom">${card.rank}<br></div>
  `;
  return el;
}

function updateContainerHeight() {
  const maxPile = Math.max(...tableau.map(p => p.length), 1);
  const height = Math.max(400, maxPile * 25 + 250);
  document.getElementById('gameContainer').style.minHeight = height + 'px';
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

// --- SELECTION (click) ---
function selectCard(location, pileIndex, cardIndex = 0) {
  if (!gameActive) return;
  if (location === 'stock') { drawFromStock(); return; }
  if (selectedCard) {
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
  if (location === 'waste' && waste.length > 0) selectedCard = { location, pileIndex: 0, cardIndex: waste.length - 1 };
  else if (location === 'foundation' && foundations[pileIndex].length > 0) selectedCard = { location, pileIndex, cardIndex: foundations[pileIndex].length - 1 };
  else if (location === 'tableau') {
    if (cardIndex === -1) return;
    if (tableau[pileIndex][cardIndex] && tableau[pileIndex][cardIndex].faceUp) selectedCard = { location, pileIndex, cardIndex };
  }
  renderAll();
}

function drawFromStock() {
  if (stock.length === 0) { resetStock(); return; }
  history.push(takeSnapshot());
  const card = stock.pop();
  card.faceUp = true;
  waste.push(card);
  selectedCard = null;
  renderAll();
}

function resetStock() {
  if (waste.length === 0) return;
  history.push(takeSnapshot());
  while (waste.length > 0) {
    const card = waste.pop();
    card.faceUp = false;
    stock.push(card);
  }
  selectedCard = null;
  renderAll();
}

function canMove(src, destLocation, destPileIndex) {
  let cardsToMove = [];
  if (src.location === 'waste') cardsToMove = [waste[waste.length - 1]];
  else if (src.location === 'tableau') cardsToMove = tableau[src.pileIndex].slice(src.cardIndex);
  else if (src.location === 'foundation') cardsToMove = [foundations[src.pileIndex][foundations[src.pileIndex].length - 1]];
  if (!cardsToMove.length) return false;
  const firstCard = cardsToMove[0];
  if (destLocation === 'foundation') {
    const destPile = foundations[destPileIndex];
    if (firstCard.suit !== FOUNDATION_SUIT_ORDER[destPileIndex]) return false;
    if (destPile.length === 0) return firstCard.rankIndex === 0;
    return firstCard.rankIndex === destPile[destPile.length - 1].rankIndex + 1;
  } else if (destLocation === 'tableau') {
    const destPile = tableau[destPileIndex];
    if (destPile.length === 0) return firstCard.rankIndex === 12;
    const topCard = destPile[destPile.length - 1];
    return firstCard.color !== topCard.color && firstCard.rankIndex === topCard.rankIndex - 1;
  }
  return false;
}

function moveCard(src, destLocation, destPileIndex) {
  let cardsToMove = [];
  if (src.location === 'waste') cardsToMove = [waste.pop()];
  else if (src.location === 'tableau') cardsToMove = tableau[src.pileIndex].splice(src.cardIndex);
  else if (src.location === 'foundation') cardsToMove = [foundations[src.pileIndex].pop()];
  if (destLocation === 'foundation') foundations[destPileIndex].push(...cardsToMove);
  else if (destLocation === 'tableau') tableau[destPileIndex].push(...cardsToMove);
  if (src.location === 'tableau' && tableau[src.pileIndex].length > 0) {
    tableau[src.pileIndex][tableau[src.pileIndex].length - 1].faceUp = true;
  }
}

// --- CHIẾN THẮNG ---
function checkWin() {
  if (foundations.every(p => p.length === 13)) {
    gameActive = false;
    setTimeout(showWinOverlay, 300);
  }
}

function showWinOverlay() {
  const container = document.getElementById('gameContainer');
  const old = container.querySelector('.win-overlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.className = 'win-overlay';
  overlay.innerHTML = `<p>🎉 Chúc mừng! Bạn đã thắng!</p><button id="winRestart">Chơi lại</button>`;
  container.appendChild(overlay);
  document.getElementById('winRestart').addEventListener('click', () => {
    overlay.remove();
    newGame();
  });
  // Confetti
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
    confetti.style.animationDelay = Math.random() + 's';
    confetti.style.background = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6'][Math.floor(Math.random()*5)];
    confetti.style.width = '8px'; confetti.style.height = '12px'; confetti.style.borderRadius = '2px';
    container.appendChild(confetti);
  }
}

// --- UNDO ---
function undo() {
  if (history.length === 0 || !gameActive) return;
  const snap = history.pop();
  restoreSnapshot(snap);
  selectedCard = null; dragData = null;
  renderAll();
}

// --- CHEAT: AUTO COMPLETE ---
function autoComplete() {
  if (!gameActive) return;
  let moved = true;
  let iterations = 0;
  while (moved && iterations < 100) {
    moved = false; iterations++;
    // Waste -> Foundation
    if (waste.length > 0) {
      for (let i = 0; i < 4; i++) {
        if (canMove({location:'waste'}, 'foundation', i)) {
          history.push(takeSnapshot());
          moveCard({location:'waste'}, 'foundation', i);
          moved = true; break;
        }
      }
      if (moved) continue;
    }
    // Tableau top -> Foundation
    for (let t = 0; t < 7; t++) {
      if (tableau[t].length === 0) continue;
      const topIdx = tableau[t].length - 1;
      for (let i = 0; i < 4; i++) {
        if (canMove({location:'tableau', pileIndex: t, cardIndex: topIdx}, 'foundation', i)) {
          history.push(takeSnapshot());
          moveCard({location:'tableau', pileIndex: t, cardIndex: topIdx}, 'foundation', i);
          moved = true; break;
        }
      }
      if (moved) break;
    }
    // Tableau inter-move để mở khóa
    if (!moved) {
      for (let t = 0; t < 7; t++) {
        if (tableau[t].length === 0) continue;
        for (let j = tableau[t].length - 1; j >= 0; j--) {
          if (!tableau[t][j].faceUp) continue;
          for (let d = 0; d < 7; d++) {
            if (d === t) continue;
            if (canMove({location:'tableau', pileIndex: t, cardIndex: j}, 'tableau', d)) {
              history.push(takeSnapshot());
              moveCard({location:'tableau', pileIndex: t, cardIndex: j}, 'tableau', d);
              moved = true; break;
            }
          }
          if (moved) break;
        }
        if (moved) break;
      }
    }
  }
  renderAll();
  checkWin();
}

// --- CHEAT: TOGGLE REVEAL ---
function toggleReveal() {
  if (!gameActive) return;
  if (allRevealed) {
    // Khôi phục trạng thái trước khi lật
    if (preRevealSnapshot) {
      restoreSnapshot(preRevealSnapshot);
      history.push(preRevealSnapshot);
      preRevealSnapshot = null;
    }
    allRevealed = false;
  } else {
    // Lưu snapshot trước khi lật tất cả bài úp
    preRevealSnapshot = takeSnapshot();
    for (const p of tableau) for (const c of p) c.faceUp = true;
    for (const c of stock) c.faceUp = true;
    allRevealed = true;
  }
  renderAll();
}

// --- CHEAT: HINT MOVE ---
function hintMove() {
  if (!gameActive) return;
  const candidates = [];
  // Waste -> Foundation
  if (waste.length > 0) {
    for (let i = 0; i < 4; i++) {
      if (canMove({location:'waste'}, 'foundation', i)) {
        candidates.push({ location: 'waste', dest: 'foundation', destIdx: i });
      }
    }
  }
  // Tableau top -> Foundation
  for (let t = 0; t < 7; t++) {
    if (tableau[t].length === 0) continue;
    const topIdx = tableau[t].length - 1;
    if (!tableau[t][topIdx].faceUp) continue;
    for (let i = 0; i < 4; i++) {
      if (canMove({location:'tableau', pileIndex: t, cardIndex: topIdx}, 'foundation', i)) {
        candidates.push({ location: 'tableau', pileIndex: t, cardIndex: topIdx, dest: 'foundation', destIdx: i });
      }
    }
    // Tableau -> Tableau
    for (let d = 0; d < 7; d++) {
      if (d === t) continue;
      if (canMove({location:'tableau', pileIndex: t, cardIndex: topIdx}, 'tableau', d)) {
        candidates.push({ location: 'tableau', pileIndex: t, cardIndex: topIdx, dest: 'tableau', destIdx: d });
      }
    }
  }
  if (candidates.length > 0) {
    const hint = candidates[0];
    selectedCard = { location: hint.location, pileIndex: hint.pileIndex, cardIndex: hint.cardIndex };
    renderAll();
    // Highlight đích
    const destCell = document.querySelector(`[data-dest="${hint.dest}-${hint.destIdx}"]`);
    if (destCell) {
      destCell.style.boxShadow = '0 0 12px #f1c40f';
      setTimeout(() => destCell.style.boxShadow = '', 1000);
    }
  }
}

// --- CHEAT: DELETE SELECTED ---
function deleteSelected() {
  if (!selectedCard || !gameActive) return;
  history.push(takeSnapshot());
  const { location, pileIndex, cardIndex } = selectedCard;
  if (location === 'waste') waste.pop();
  else if (location === 'tableau') tableau[pileIndex].splice(cardIndex, 1);
  else if (location === 'foundation') foundations[pileIndex].pop();
  selectedCard = null;
  renderAll();
}

// --- CHEAT: SPAWN RANDOM CARD ---
function spawnRandomCard() {
  if (!gameActive) return;
  // Ưu tiên ô trống trong tableau
  for (let t = 0; t < 7; t++) {
    if (tableau[t].length === 0) {
      const suit = SUITS[Math.floor(Math.random()*4)];
      const rankIdx = Math.floor(Math.random()*13);
      const card = {
        suit, rank: RANKS[rankIdx], rankIndex: rankIdx,
        faceUp: true, symbol: SYMBOLS[suit], color: COLORS[suit]
      };
      tableau[t].push(card);
      history.push(takeSnapshot());
      renderAll();
      return;
    }
  }
  // Nếu không có ô trống, đặt vào waste
  const suit = SUITS[Math.floor(Math.random()*4)];
  const rankIdx = Math.floor(Math.random()*13);
  const card = {
    suit, rank: RANKS[rankIdx], rankIndex: rankIdx,
    faceUp: true, symbol: SYMBOLS[suit], color: COLORS[suit]
  };
  waste.push(card);
  history.push(takeSnapshot());
  renderAll();
}

// --- DEV PANEL ---
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
        font-size: 12px; max-width: 260px;
        border: 1px solid #0f0;
      }
      .on { color: #0f0; } .off { color: #f00; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[U] Hoàn tác (Undo) | Ctrl+Z</div>
    <div>[A] Tự động hoàn thành</div>
    <div>[V] Lật/Úp tất cả bài <span id="revealStat" class="off">OFF</span></div>
    <div>[H] Gợi ý nước đi</div>
    <div>[X] Xóa lá đang chọn</div>
    <div>[S] Thêm lá bài ngẫu nhiên</div>
    <div>[N] Ván mới</div>
  `;
  document.body.appendChild(advancedPanel);
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  const stat = document.getElementById('revealStat');
  if (stat) {
    stat.textContent = allRevealed ? 'ON' : 'OFF';
    stat.className = allRevealed ? 'on' : 'off';
  }
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

// --- KEYBOARD ---
document.addEventListener('keydown', e => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 'u': case 'U': undo(); break;
    case 'a': case 'A': autoComplete(); break;
    case 'v': case 'V': toggleReveal(); refreshAdvancedPanel(); break;
    case 'h': case 'H': hintMove(); break;
    case 'x': case 'X': deleteSelected(); break;
    case 's': case 'S': spawnRandomCard(); break;
    case 'n': case 'N': newGame(); break;
  }
});

// --- NÚT UI ---
document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen());

// --- KHỞI ĐỘNG ---
createAdvancedPanel();
newGame();