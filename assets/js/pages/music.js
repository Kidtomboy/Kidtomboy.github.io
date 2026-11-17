// 🎵 Music Player - Local & URL, Playlist, Visualizer, Media Session
import { toast } from '../core/ui.js';

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
const addYtBtn = document.getElementById('addYtBtn');
const addRow = document.getElementById('addRow');
const addInput = document.getElementById('addInput');
const ytWrap = document.getElementById('ytWrap');
const albumArt = document.getElementById('albumArt');

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

// --- YouTube (IFrame API) ---
let yt = null, ytReady = null, ytTick = 0, mode = 'audio', addMode = '';
function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise((res, rej) => {
    if (window.YT && window.YT.Player) return res();
    window.onYouTubeIframeAPIReady = res;
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => { ytReady = null; rej(new Error('Không tải được YouTube')); };
    document.head.appendChild(s);
  });
  return ytReady;
}
function parseYT(u) {
  u = u.trim(); let url; try { url = new URL(/^https?:/i.test(u) ? u : 'https://' + u); } catch (e) { return null; }
  const h = url.hostname.replace(/^www\.|^m\.|^music\./, '');
  let v = null; const list = url.searchParams.get('list');
  if (h === 'youtu.be') v = url.pathname.slice(1).split('/')[0];
  else if (h === 'youtube.com') { v = url.searchParams.get('v'); const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/); if (!v && m) v = m[1]; }
  else return null;
  if (v && /^[\w-]{11}$/.test(v)) return { kind: 'video', id: v };
  if (list && /^[\w-]+$/.test(list)) return { kind: 'list', id: list };
  return null;
}
async function ensureYT() {
  await loadYT();
  if (yt) return yt;
  yt = await new Promise(res => { const p = new YT.Player('ytPlayer', { width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0 }, events: {
    onReady: () => { p.setVolume(+volumeBar.value); res(p); }, onStateChange: onYtState, onError: onYtError } }); });
  return yt;
}
function onYtState(e) {
  if (mode !== 'yt') return;
  const S = YT.PlayerState;
  if (e.data === S.PLAYING) { playBtn.textContent = '⏸️'; const d = yt.getVideoData(); if (d && d.title) { trackTitleEl.textContent = d.title; trackArtistEl.textContent = d.author || 'YouTube'; const t = playlist[currentIndex]; if (t && t.kind === 'video' && t.title.startsWith('YouTube ·')) { t.title = d.title; t.artist = d.author || 'YouTube'; renderPlaylist(); savePlaylist(); } } startTick(); }
  else if (e.data === S.PAUSED) { playBtn.textContent = '▶️'; }
  else if (e.data === S.ENDED) { playBtn.textContent = '▶️'; if (isRepeat) playTrack(currentIndex); else nextTrack(); }
}
function onYtError(e) { toast(e.data === 101 || e.data === 150 ? 'Video này không cho phép nhúng, chuyển bài khác.' : 'YouTube không phát được video này.'); setTimeout(nextTrack, 800); }
function startTick() { clearInterval(ytTick); ytTick = setInterval(() => {
  if (mode !== 'yt' || !yt || !yt.getDuration) return; const d = yt.getDuration() || 0, c = yt.getCurrentTime() || 0;
  seekBar.value = d ? (c / d) * 100 : 0; currentTimeEl.textContent = formatTime(c); durationEl.textContent = formatTime(d); }, 500); }
function setMode(m) {
  mode = m; const isYt = m === 'yt';
  ytWrap.hidden = !isYt; albumArt.hidden = isYt; visualizerCanvas.hidden = isYt;
  if (isYt) { audio.pause(); stopVisualizer(); } else { clearInterval(ytTick); if (yt && yt.pauseVideo) yt.pauseVideo(); }
}
const isPlaying = () => mode === 'yt' ? (yt && yt.getPlayerState && yt.getPlayerState() === 1) : !audio.paused;

// --- Playlist Management ---
function addTrack(track) { playlist.push(track); renderPlaylist(); savePlaylist(); }
function removeTrack(i) {
  const was = i === currentIndex; playlist.splice(i, 1);
  if (i < currentIndex) currentIndex--; else if (was) { currentIndex = -1; audio.pause(); if (yt && yt.pauseVideo) yt.pauseVideo(); playBtn.textContent = '▶️'; trackTitleEl.textContent = 'Chưa chọn bài'; trackArtistEl.textContent = 'Nghệ sĩ'; }
  renderPlaylist(); savePlaylist();
}
function renderPlaylist() {
  playlistEl.innerHTML = '';
  if (!playlist.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = 'Chưa có bài nào. Thêm file, URL hoặc link YouTube.'; playlistEl.appendChild(li); return; }
  playlist.forEach((track, index) => {
    const li = document.createElement('li'); li.tabIndex = 0;
    const tag = track.kind === 'file' ? ' (phiên này)' : track.kind === 'list' ? ' (playlist YT)' : track.kind === 'video' ? ' (YT)' : '';
    li.append(document.createTextNode(`${track.title} - ${track.artist}${tag}`));
    const x = document.createElement('button'); x.type = 'button'; x.className = 'pl-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Xóa khỏi danh sách');
    x.addEventListener('click', ev => { ev.stopPropagation(); removeTrack(index); });
    li.appendChild(x);
    if (index === currentIndex) li.classList.add('active');
    li.addEventListener('click', () => playTrack(index));
    li.addEventListener('keydown', ev => { if (ev.key === 'Enter') playTrack(index); });
    playlistEl.appendChild(li);
  });
}
async function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index; const track = playlist[index];
  trackTitleEl.textContent = track.title; trackArtistEl.textContent = track.artist; renderPlaylist(); updateMediaSession(track);
  if (track.kind === 'video' || track.kind === 'list') {
    setMode('yt');
    try { const p = await ensureYT(); if (track.kind === 'video') p.loadVideoById(track.id); else p.loadPlaylist({ listType: 'playlist', list: track.id }); p.setVolume(+volumeBar.value); playBtn.textContent = '⏸️'; }
    catch (e) { toast('Không tải được YouTube. Kiểm tra mạng hoặc trình chặn quảng cáo.'); setMode('audio'); }
    return;
  }
  setMode('audio'); audio.src = track.src; audio.volume = volumeBar.value / 100;
  try { await audio.play(); playBtn.textContent = '⏸️'; initAudioContext(); startVisualizer(); }
  catch (e) { playBtn.textContent = '▶️'; toast('Không phát được file này (sai link hoặc bị chặn CORS).'); }
}
const savable = () => playlist.filter(t => t.kind !== 'file');
function savePlaylist() { try { localStorage.setItem('musicPlaylist.v2', JSON.stringify(savable())); } catch (e) { /* bỏ qua */ } }
function loadPlaylist() {
  try { playlist = JSON.parse(localStorage.getItem('musicPlaylist.v2') || '[]').filter(t => t && t.title && (t.kind === 'url' ? /^https?:/.test(t.src) : /^[\w-]+$/.test(t.id || ''))); } catch (e) { playlist = []; }
  renderPlaylist();
}

// --- Media Session API ---
function updateMediaSession(track) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: 'Kidtomboy Music' });
  navigator.mediaSession.setActionHandler('play', togglePlay); navigator.mediaSession.setActionHandler('pause', togglePlay);
  navigator.mediaSession.setActionHandler('previoustrack', prevTrack); navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
}

// --- Điều khiển ---
function togglePlay() {
  if (currentIndex < 0) { if (playlist.length) playTrack(0); return; }
  if (mode === 'yt') { if (!yt) return; isPlaying() ? yt.pauseVideo() : yt.playVideo(); return; }
  if (audio.paused) { audio.play(); playBtn.textContent = '⏸️'; startVisualizer(); } else { audio.pause(); playBtn.textContent = '▶️'; stopVisualizer(); }
}
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);
function prevTrack() {
  if (!playlist.length) return;
  const t = playlist[currentIndex];
  if (mode === 'yt' && t && t.kind === 'list' && yt && yt.getPlaylistIndex() > 0) { yt.previousVideo(); return; }
  playTrack(currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1);
}
function nextTrack() {
  if (!playlist.length) return;
  const t = playlist[currentIndex];
  if (mode === 'yt' && t && t.kind === 'list' && yt && !isShuffle) { const n = (yt.getPlaylist() || []).length; if (yt.getPlaylistIndex() < n - 1) { yt.nextVideo(); return; } }
  let n;
  if (isShuffle) n = Math.floor(Math.random() * playlist.length);
  else { n = currentIndex + 1; if (n >= playlist.length) { if (isRepeat) n = 0; else { stopVisualizer(); playBtn.textContent = '▶️'; return; } } }
  playTrack(n);
}
audio.addEventListener('ended', () => { if (mode === 'audio') { if (isRepeat) playTrack(currentIndex); else nextTrack(); } });
audio.addEventListener('timeupdate', () => { if (mode !== 'audio') return; seekBar.value = (audio.currentTime / audio.duration) * 100 || 0; currentTimeEl.textContent = formatTime(audio.currentTime); });
audio.addEventListener('loadedmetadata', () => { durationEl.textContent = formatTime(audio.duration); });
seekBar.addEventListener('input', () => {
  if (mode === 'yt') { if (yt && yt.getDuration) yt.seekTo((seekBar.value / 100) * yt.getDuration(), true); }
  else if (isFinite(audio.duration)) audio.currentTime = (seekBar.value / 100) * audio.duration;
});
volumeBar.addEventListener('input', () => { audio.volume = volumeBar.value / 100; if (yt && yt.setVolume) yt.setVolume(+volumeBar.value); });
shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.style.color = isShuffle ? 'var(--accent)' : 'inherit'; });
repeatBtn.addEventListener('click', () => { isRepeat = !isRepeat; repeatBtn.style.color = isRepeat ? 'var(--accent)' : 'inherit'; });
function formatTime(seconds) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// --- Thêm nhạc ---
addLocalBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  for (const file of e.target.files) addTrack({ kind: 'file', title: file.name.replace(/\.[^/.]+$/, ''), artist: 'File trên máy', src: URL.createObjectURL(file) });
  fileInput.value = '';
});
function openAdd(m) {
  addMode = addMode === m && !addRow.hidden ? '' : m; addRow.hidden = !addMode;
  addInput.placeholder = m === 'yt' ? 'Dán link YouTube (video hoặc playlist)' : 'Dán link audio trực tiếp (.mp3, .ogg, .wav…)';
  if (addMode) addInput.focus();
}
addUrlBtn.addEventListener('click', () => openAdd('url'));
addYtBtn.addEventListener('click', () => openAdd('yt'));
addRow.addEventListener('submit', e => {
  e.preventDefault(); const v = addInput.value.trim(); if (!v) return;
  if (addMode === 'yt') {
    const y = parseYT(v); if (!y) { toast('Link YouTube không hợp lệ.'); return; }
    addTrack({ kind: y.kind, id: y.id, title: y.kind === 'list' ? 'YouTube · Playlist' : 'YouTube · ' + y.id, artist: 'YouTube' });
  } else {
    if (!/^https?:\/\//i.test(v)) { toast('Link phải bắt đầu bằng http:// hoặc https://'); return; }
    addTrack({ kind: 'url', src: v, title: decodeURIComponent(v.split('/').pop().split('?')[0] || 'Bài hát mới').replace(/\.[^/.]+$/, ''), artist: 'URL' });
  }
  addInput.value = ''; addRow.hidden = true; addMode = '';
  if (currentIndex < 0) playTrack(playlist.length - 1);
});

loadPlaylist();
