// 📝 Hangman - Từ điển mã hóa, bàn phím QWERTY, cheat panel ẩn
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const canvas = document.getElementById('hangmanCanvas');
const ctx = canvas.getContext('2d');
const wordDisplay = document.getElementById('wordDisplay');
const hintBox = document.getElementById('hintBox');
const livesSpan = document.getElementById('lives');
const scoreSpan = document.getElementById('score');
const keyboardEl = document.getElementById('keyboard');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Từ điển (mã hóa Base64 để tránh lộ)
const WORDS_ENCODED = [
  "cHJvZ3JhbW1pbmc=","amF2YXNjcmlwdA==","aGFuZ21hbg==","c3Vkb2t1","YWxnb3JpdGht",
  "ZGF0YWJhc2U=","ZnVuY3Rpb24=","dmFyaWFibGU=","Y29uc3RhbnQ=","bGlicmFyeQ==",
  "ZnJhbWV3b3Jr","cmVzcG9uc2l2ZQ==","YW5pbWF0aW9u","Y2FudmFz","ZWxlbWVudA==",
  "c2VsZWN0b3I=","ZXZlbnQ=","Y2FsbGJhY2s=","cHJvbWlzZQ==","YXN5bmM=",
  "YXdhaXQ=","bW9kdWxl","aW1wb3J0","ZXhwb3J0","ZGVmYXVsdA==",
  "Y29tcG9uZW50","aW50ZXJmYWNl","cHJvcHM=","c3RhdGU=","cmVkdXg=",
  "bm9kZQ==","c2VydmVy","Y2xpZW50","cmVxdWVzdA==","cmVzcG9uc2U=",
  "cm91dGVy","bWlkZGxld2FyZQ==","YXV0aA==","dG9rZW4=","cGFzc3dvcmQ=",
  "ZW5jcnlwdA==","ZGVjcnlwdA==","aGFzaA==","Y29va2ll","c2Vzc2lvbg=="
];
const WORDS = WORDS_ENCODED.map(w => atob(w)); // Giải mã khi chạy (vẫn có thể thấy trong console, nhưng không lộ trong source tĩnh)

let secretWord = '';
let guessedLetters = new Set();
let lives = 6;
let score = 0;
let gameActive = true;

// DevMode
let showAnswer = false;
let advancedPanel = null, panelVisible = false;

audioEngine.init();

// --- Chọn từ ngẫu nhiên ---
function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)].toLowerCase();
}

// --- Reset game ---
function initGame() {
  secretWord = pickWord();
  guessedLetters = new Set();
  lives = 6;
  gameActive = true;
  showAnswer = false;
  updateUI();
  drawHangman();
  renderKeyboard();
}

// --- Cập nhật hiển thị từ ---
function getMaskedWord() {
  return secretWord.split('').map(ch => guessedLetters.has(ch) || !/[a-z]/.test(ch) ? ch : '_').join(' ');
}

function updateUI() {
  wordDisplay.textContent = getMaskedWord();
  livesSpan.textContent = lives;
  scoreSpan.textContent = score;

  // Gợi ý số từ khớp
  if (gameActive) {
    const pattern = getMaskedWord().replace(/\s/g, '');
    const matching = WORDS.filter(w => {
      if (w.length !== secretWord.length) return false;
      for (let i = 0; i < w.length; i++) {
        if (pattern[i] !== '_' && pattern[i] !== w[i]) return false;
      }
      return true;
    });
    hintBox.textContent = `💡 Còn ${matching.length} từ khớp với mẫu`;
    if (showAnswer) hintBox.textContent += ` | Đáp án: ${secretWord}`;
  }
}

// --- Vẽ hình người treo ---
function drawHangman() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-primary').trim() || '#333';
  ctx.lineWidth = 3;
  
  const wrongs = 6 - lives;
  
  // Giá treo
  if (wrongs >= 0) {
    ctx.beginPath(); ctx.moveTo(20, 180); ctx.lineTo(180, 180); ctx.stroke(); // đế
    if (wrongs >= 1) { ctx.beginPath(); ctx.moveTo(60, 180); ctx.lineTo(60, 20); ctx.stroke(); }
    if (wrongs >= 2) { ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(140, 20); ctx.stroke(); }
    if (wrongs >= 3) { ctx.beginPath(); ctx.moveTo(140, 20); ctx.lineTo(140, 50); ctx.stroke(); }
  }
  
  // Người
  if (wrongs >= 4) { // Đầu
    ctx.beginPath(); ctx.arc(140, 65, 15, 0, Math.PI * 2); ctx.stroke();
  }
  if (wrongs >= 5) { // Thân
    ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(140, 130); ctx.stroke();
  }
  if (wrongs >= 6) { // Tay + chân
    ctx.beginPath(); ctx.moveTo(140, 100); ctx.lineTo(120, 120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 100); ctx.lineTo(160, 120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 130); ctx.lineTo(120, 160); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 130); ctx.lineTo(160, 160); ctx.stroke();
  }
}

// --- Bàn phím QWERTY ---
function renderKeyboard() {
  const rows = [
    'qwertyuiop'.split(''),
    'asdfghjkl'.split(''),
    'zxcvbnm'.split('')
  ];
  keyboardEl.innerHTML = '';
  for (const row of rows) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    for (const letter of row) {
      const key = document.createElement('div');
      key.className = 'key';
      key.textContent = letter.toUpperCase();
      if (guessedLetters.has(letter)) {
        key.classList.add('used');
        if (secretWord.includes(letter)) key.classList.add('correct');
        else key.classList.add('wrong');
      }
      key.addEventListener('click', () => guessLetter(letter));
      rowDiv.appendChild(key);
    }
    keyboardEl.appendChild(rowDiv);
  }
}

// --- Đoán chữ ---
function guessLetter(letter) {
  if (!gameActive || guessedLetters.has(letter)) return;
  guessedLetters.add(letter);
  
  if (secretWord.includes(letter)) {
    audioEngine.play('correct');
    // Kiểm tra thắng
    const masked = getMaskedWord().replace(/\s/g, '');
    if (!masked.includes('_')) {
      gameActive = false;
      score += 100;
      updateUI();
      drawHangman();
      renderKeyboard();
      wordDisplay.textContent = secretWord.toUpperCase();
      statusEl.textContent = '🎉 Chúc mừng! Bạn đã đoán đúng!';
      audioEngine.play('win');
      saveBestScore();
      return;
    }
  } else {
    lives--;
    audioEngine.play('wrong');
    if (lives <= 0) {
      gameActive = false;
      updateUI();
      drawHangman();
      renderKeyboard();
      wordDisplay.textContent = secretWord.toUpperCase();
      statusEl.textContent = '💀 Game Over! Đáp án là: ' + secretWord;
      audioEngine.play('gameover');
      return;
    }
  }
  updateUI();
  drawHangman();
  renderKeyboard();
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
        font-size: 12px; max-width: 260px;
        border: 1px solid #0f0;
      }
      .on { color: #0f0; } .off { color: #f00; }
    </style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[A] Hiện đáp án: <span id="ans-stat" class="off">OFF</span></div>
    <div>[G] Đoán một chữ đúng</div>
    <div>[L] Thêm lượt (+1)</div>
    <div>[W] Thắng ngay</div>
    <div>[R] Từ mới</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshAdvancedPanel();
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  document.getElementById('ans-stat').textContent = showAnswer ? 'ON' : 'OFF';
  document.getElementById('ans-stat').className = showAnswer ? 'on' : 'off';
}

function toggleAdvancedPanel() {
  if (!isDevMode() || !advancedPanel) return;
  panelVisible = !panelVisible;
  advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

// Phím cheat
document.addEventListener('keydown', (e) => {
  if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }
  if (!isDevMode()) return;
  e.preventDefault();
  switch (e.key) {
    case 'a': case 'A':
      showAnswer = !showAnswer;
      refreshAdvancedPanel();
      updateUI();
      break;
    case 'g': case 'G': {
      const unguessed = secretWord.split('').filter(ch => !guessedLetters.has(ch) && /[a-z]/.test(ch));
      if (unguessed.length > 0) guessLetter(unguessed[0]);
      break;
    }
    case 'l': case 'L': lives = Math.min(10, lives + 1); updateUI(); drawHangman(); break;
    case 'w': case 'W':
      for (const ch of secretWord) guessedLetters.add(ch);
      gameActive = false;
      score += 100;
      updateUI();
      drawHangman();
      renderKeyboard();
      wordDisplay.textContent = secretWord.toUpperCase();
      statusEl.textContent = '🎉 Thắng ngay!';
      break;
    case 'r': case 'R': initGame(); break;
    default: break;
  }
});

// Nút
restartBtn.addEventListener('click', initGame);
fullscreenBtn.addEventListener('click', () => {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
});

// Điểm cao
async function loadBestScore() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'hangman');
    if (entry) score = entry.score || 0;
  } catch (_) {}
  scoreSpan.textContent = score;
}
async function saveBestScore() {
  try {
    await storage.openDB();
    const tx = storage.db.transaction('gameScores', 'readwrite');
    tx.objectStore('gameScores').put({ gameName: 'hangman', score });
  } catch (_) {}
}

// Khởi động
createAdvancedPanel();
loadBestScore().then(initGame);