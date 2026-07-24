// 🎵 Music Player - Local & URL, Playlist, Visualizer, Media Session
import { audioEngine } from '../core/audio-engine.js';
import { storage } from '../core/storage.js';

const playlistEl = document.getElementById('playlist');
const trackTitleEl = document.getElementById('trackTitle');
const trackArtistEl = document.getElementById('trackArtist');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeBar = document.getElementById('volumeBar');
const visualizerCanvas = document.getElementById('visualizer');
const fileInput = document.getElementById('fileInput');
const addLocalBtn = document.getElementById('addLocalBtn');
const addUrlBtn = document.getElementById('addUrlBtn');

let audio = new Audio();
let playlist = [];
let currentIndex = -1;
let isShuffle = false;
let isRepeat = false;
let audioContext = null;
let analyser = null;
let visualizerId = null;

// --- Khởi tạo Audio Context cho Visualizer ---
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }
}

// --- Visualizer ---
function startVisualizer() {
  if (!analyser) return;
  const ctx = visualizerCanvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    visualizerId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;
      const gradient = ctx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#a78bfa');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  draw();
}

function stopVisualizer() {
  if (visualizerId) cancelAnimationFrame(visualizerId);
}

// --- Playlist Management ---
function addTrack(title, artist, src) {
  playlist.push({ title, artist, src });
  renderPlaylist();
  savePlaylist();
}

function renderPlaylist() {
  playlistEl.innerHTML = '';
  playlist.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = `${track.title} - ${track.artist}`;
    if (index === currentIndex) li.classList.add('active');
    li.addEventListener('click', () => playTrack(index));
    playlistEl.appendChild(li);
  });
}

function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const track = playlist[index];
  audio.src = track.src;
  trackTitleEl.textContent = track.title;
  trackArtistEl.textContent = track.artist;
  audio.play();
  playBtn.textContent = '⏸️';
  renderPlaylist();
  updateMediaSession(track);
  initAudioContext();
  startVisualizer();
}

function savePlaylist() {
  localStorage.setItem('musicPlaylist', JSON.stringify(playlist));
}

function loadPlaylist() {
  const saved = localStorage.getItem('musicPlaylist');
  if (saved) {
    playlist = JSON.parse(saved);
    renderPlaylist();
  }
}

// --- Media Session API ---
function updateMediaSession(track) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'Kidtomboy Music',
    });
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  }
}

// --- Controls ---
playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = '⏸️';
    startVisualizer();
  } else {
    audio.pause();
    playBtn.textContent = '▶️';
    stopVisualizer();
  }
});

prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

function prevTrack() {
  if (playlist.length === 0) return;
  let newIndex = currentIndex - 1;
  if (newIndex < 0) newIndex = playlist.length - 1;
  playTrack(newIndex);
}

function nextTrack() {
  if (playlist.length === 0) return;
  let newIndex;
  if (isShuffle) {
    newIndex = Math.floor(Math.random() * playlist.length);
  } else {
    newIndex = currentIndex + 1;
    if (newIndex >= playlist.length) {
      if (isRepeat) newIndex = 0;
      else { stopVisualizer(); playBtn.textContent = '▶️'; return; }
    }
  }
  playTrack(newIndex);
}

audio.addEventListener('ended', () => {
  if (isRepeat) {
    playTrack(currentIndex);
  } else {
    nextTrack();
  }
});

// Progress
audio.addEventListener('timeupdate', () => {
  seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});
seekBar.addEventListener('input', () => {
  audio.currentTime = (seekBar.value / 100) * audio.duration;
});

volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value / 100;
});

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.style.color = isShuffle ? 'var(--accent)' : 'inherit';
});
repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.style.color = isRepeat ? 'var(--accent)' : 'inherit';
});

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// --- Thêm nhạc ---
addLocalBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  for (const file of e.target.files) {
    const url = URL.createObjectURL(file);
    addTrack(file.name.replace(/\.[^/.]+$/, ''), 'Không rõ', url);
  }
});
addUrlBtn.addEventListener('click', () => {
  const url = prompt('Nhập URL audio (mp3, ogg, wav):');
  if (url) {
    const title = prompt('Tên bài:') || 'Bài hát mới';
    const artist = prompt('Nghệ sĩ:') || 'Không rõ';
    addTrack(title, artist, url);
  }
});

// Khởi động
loadPlaylist();