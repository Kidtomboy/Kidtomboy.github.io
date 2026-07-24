// Lớp cơ sở cho tất cả game - Quản lý trạng thái, pause, resume, fullscreen, best score
import { storage } from '../core/storage.js';
import { audioEngine } from '../core/audio-engine.js';

export class GameBase {
  constructor(canvasId, gameName, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      // Nếu không có canvas, có thể là game thuần DOM
      this.canvas = null;
      this.ctx = null;
    } else {
      this.ctx = this.canvas.getContext('2d');
    }
    this.gameName = gameName;
    this.options = Object.assign({
      width: 400,
      height: 400,
      fps: 60,
      soundEnabled: true,
      autoStart: true,
      gridSize: 20
    }, options);
    if (this.canvas) {
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;
    }
    this.score = 0;
    this.bestScore = 0;
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameLoopId = null;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.options.fps;
    this.soundEnabled = this.options.soundEnabled;
    this.initSound();
    this.bindEvents();
    this.loadBestScore();
    if (this.options.autoStart) {
      this.startGame();
    }
  }

  initSound() {
    try {
      audioEngine.init();
    } catch (e) {
      this.soundEnabled = false;
    }
  }

  playSound(name) {
    if (this.soundEnabled && audioEngine) {
      audioEngine.play(name, 'sfx');
    }
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('resize', () => this.handleResize());
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('restartBtn')?.addEventListener('click', () => this.startGame());
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());
  }

  handleKeyDown(e) {}
  handleKeyUp(e) {}
  handleClick(e) {}
  handleMouseMove(e) {}
  handleResize() {}

  async loadBestScore() {
    try {
      const data = await storage.getAll('gameScores');
      const entry = data.find(d => d.gameName === this.gameName);
      this.bestScore = entry ? entry.score : 0;
      this.updateBestScoreDisplay();
    } catch (e) {
      this.bestScore = 0;
    }
  }

  async saveBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.updateBestScoreDisplay();
      // Upsert vào IndexedDB (tạm thời dùng add, sẽ ghi đè nếu dùng put)
      // Cần một hàm update trong storage, sẽ dùng tạm bằng cách xóa cũ và thêm mới
      try {
        // Xóa cũ
        const tx = (await storage.openDB()).transaction('gameScores', 'readwrite');
        const store = tx.objectStore('gameScores');
        store.delete(this.gameName);
        await new Promise(r => { tx.oncomplete = r; });
        // Thêm mới
        await storage.add('gameScores', { gameName: this.gameName, score: this.bestScore });
      } catch (e) {}
    }
  }

  updateBestScoreDisplay() {
    const bestEl = document.getElementById('best');
    if (bestEl) bestEl.textContent = this.bestScore;
  }

  updateScoreDisplay() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = this.score;
  }

  startGame() {
    this.score = 0;
    this.updateScoreDisplay();
    this.gameRunning = true;
    this.gamePaused = false;
    this.lastFrameTime = performance.now();
    this.cancelGameLoop();
    this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
    this.onStart();
    this.playSound('menu');
  }

  onStart() {}

  togglePause() {
    if (!this.gameRunning) return;
    this.gamePaused = !this.gamePaused;
    const pauseBtn = document.getElementById('pauseBtn');
    if (this.gamePaused) {
      this.playSound('pause');
      if (pauseBtn) pauseBtn.textContent = '▶️ Tiếp tục';
    } else {
      this.lastFrameTime = performance.now();
      this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
      this.playSound('resume');
      if (pauseBtn) pauseBtn.textContent = '⏸️ Tạm dừng';
    }
  }

  gameLoop(timestamp) {
    if (!this.gameRunning || this.gamePaused) return;
    const delta = timestamp - this.lastFrameTime;
    if (delta >= this.frameInterval) {
      this.lastFrameTime = timestamp - (delta % this.frameInterval);
      this.update();
      this.draw();
    }
    this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  update() {
    // Ghi đè trong lớp con
  }

  draw() {
    if (!this.ctx) return;
    // Xóa canvas, vẽ nền
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Có thể gọi this.drawUI() mặc định
  }

  gameOver() {
    this.gameRunning = false;
    this.cancelGameLoop();
    this.playSound('gameover');
    this.saveBestScore();
    this.onGameOver();
  }

  onGameOver() {}

  cancelGameLoop() {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Phương thức tiện ích
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  drawText(text, x, y, color = '#fff', font = '20px sans-serif', align = 'center') {
    if (!this.ctx) return;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }
}