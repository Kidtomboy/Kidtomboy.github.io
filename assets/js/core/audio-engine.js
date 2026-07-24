// Web Audio API engine - quản lý âm thanh game và UI
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sounds = new Map();
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  async loadSound(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.sounds.set(name, audioBuffer);
  }

  play(name, type = 'sfx') {
    if (!this.initialized) return;
    const buffer = this.sounds.get(name);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = type === 'music' ? this.musicGain : this.sfxGain;
    source.connect(gainNode);
    source.start(0);
  }

  setVolume(type, value) {
    if (type === 'music') this.musicGain.gain.value = value;
    else this.sfxGain.gain.value = value;
  }
}

export const audioEngine = new AudioEngine();