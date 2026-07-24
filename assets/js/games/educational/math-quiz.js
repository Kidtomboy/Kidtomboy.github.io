// 📐 Math Quiz - Game toán học, hỗ trợ nâng cao (DevMode)
import { isDevMode } from '../../core/devMode.js';
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';

const questionEl = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const timerEl = document.getElementById('timer');
const scoreSpan = document.getElementById('score');
const bestSpan = document.getElementById('best');
const correctSpan = document.getElementById('correct');
const operationSelect = document.getElementById('operationSelect');
const difficultySelect = document.getElementById('difficultySelect');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

let score = 0, bestScore = 0, correctCount = 0;
let currentAnswer = 0;
let timeLeft = 15;
let timerInterval = null;
let gameActive = true;

// Cheat
let autoAnswer = false;
let advancedPanel = null, panelVisible = false;

audioEngine.init();

function generateQuestion() {
  const op = operationSelect.value;
  const diff = difficultySelect.value;
  let maxNum = diff === 'easy' ? 20 : (diff === 'medium' ? 100 : 1000);
  let a, b, answer;
  
  let type = op;
  if (op === 'all') {
    const ops = ['add', 'sub', 'mul', 'div'];
    type = ops[Math.floor(Math.random() * ops.length)];
  }
  
  switch (type) {
    case 'add':
      a = rand(1, maxNum);
      b = rand(1, maxNum);
      answer = a + b;
      questionEl.textContent = `${a} + ${b} = ?`;
      break;
    case 'sub':
      a = rand(1, maxNum);
      b = rand(1, a);
      answer = a - b;
      questionEl.textContent = `${a} - ${b} = ?`;
      break;
    case 'mul':
      a = rand(1, Math.min(maxNum, 20));
      b = rand(1, Math.min(maxNum, 20));
      answer = a * b;
      questionEl.textContent = `${a} × ${b} = ?`;
      break;
    case 'div':
      b = rand(1, Math.min(maxNum, 20));
      answer = rand(1, Math.min(maxNum, 20));
      a = b * answer;
      questionEl.textContent = `${a} ÷ ${b} = ?`;
      break;
  }
  currentAnswer = answer;
  timeLeft = 15;
  timerEl.textContent = `⏱️ ${timeLeft}s`;
  answerInput.value = '';
  answerInput.focus();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏱️ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameActive = false;
      questionEl.textContent = '⏰ Hết giờ!';
      audioEngine.play('gameover');
      saveBest();
    }
  }, 1000);
}

function checkAnswer() {
  if (!gameActive) return;
  const userAnswer = parseInt(answerInput.value);
  if (isNaN(userAnswer)) return;
  
  if (userAnswer === currentAnswer) {
    // Đúng
    score += 10;
    correctCount++;
    scoreSpan.textContent = score;
    correctSpan.textContent = correctCount;
    audioEngine.play('correct');
    generateQuestion();
    if (!autoAnswer) startTimer();
  } else {
    // Sai
    audioEngine.play('error');
    answerInput.value = '';
    answerInput.style.borderColor = '#e74c3c';
    setTimeout(() => answerInput.style.borderColor = '', 500);
  }
}

function autoSolve() {
  if (autoAnswer && gameActive) {
    answerInput.value = currentAnswer;
    checkAnswer();
  }
}

answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    checkAnswer();
  }
});

function restart() {
  clearInterval(timerInterval);
  score = 0; correctCount = 0;
  scoreSpan.textContent = '0';
  correctSpan.textContent = '0';
  gameActive = true;
  generateQuestion();
  startTimer();
  answerInput.focus();
}

// DevMode Panel
function createAdvancedPanel() {
  if (!isDevMode()) return;
  advancedPanel = document.createElement('div');
  advancedPanel.id = 'advanced-panel';
  advancedPanel.style.display = 'none';
  advancedPanel.innerHTML = `
    <style>#advanced-panel{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;padding:12px;border-radius:8px;z-index:9999;font-size:12px;max-width:240px;border:1px solid #0f0;}.on{color:#0f0;}.off{color:#f00;}</style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[A] Tự động trả lời: <span id="auto-stat" class="off">OFF</span></div>
    <div>[S] +100 điểm</div>
    <div>[T] Thêm thời gian (+10s)</div>
    <div>[R] Chơi lại</div>
  `;
  document.body.appendChild(advancedPanel);
  refreshAdvancedPanel();
}

function refreshAdvancedPanel() {
  if (!advancedPanel) return;
  const el = document.getElementById('auto-stat');
  if (el) { el.textContent = autoAnswer ? 'ON' : 'OFF'; el.className = autoAnswer ? 'on' : 'off'; }
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
    case 'a': case 'A':
      autoAnswer = !autoAnswer;
      refreshAdvancedPanel();
      if (autoAnswer) autoSolve();
      break;
    case 's': case 'S': score += 100; scoreSpan.textContent = score; break;
    case 't': case 'T': timeLeft += 10; timerEl.textContent = `⏱️ ${timeLeft}s`; break;
    case 'r': case 'R': restart(); break;
  }
});

// Lưu điểm
async function loadBest() {
  try {
    await storage.openDB();
    const data = await storage.getAll('gameScores');
    const entry = data.find(s => s.gameName === 'mathquiz');
    bestScore = entry ? entry.score : 0;
  } catch (_) {}
  bestSpan.textContent = bestScore;
}
async function saveBest() {
  if (score > bestScore) {
    bestScore = score;
    bestSpan.textContent = bestScore;
    try {
      await storage.openDB();
      const tx = storage.db.transaction('gameScores', 'readwrite');
      tx.objectStore('gameScores').put({ gameName: 'mathquiz', score: bestScore });
    } catch (_) {}
  }
}

restartBtn.addEventListener('click', restart);
fullscreenBtn.addEventListener('click', () => document.documentElement.requestFullscreen());

loadBest().then(() => {
  createAdvancedPanel();
  restart();
});