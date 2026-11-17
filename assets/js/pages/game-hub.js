// Trung tâm game: nhóm, lọc, 5 kiểu sắp xếp, yêu thích (★), đếm lượt chơi, game ngẫu nhiên. Lưu trên máy.
import { SITE } from '../core/site-data.js';
const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
const norm = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const CATS = [
  ['Arcade', ['snake', 'tetris', 'flappy-bird', 'breakout', 'dino-runner']],
  ['Puzzle', ['2048', 'minesweeper', 'memory-match', 'sudoku']],
  ['Bàn cờ', ['chess', 'checkers', 'connect-four', 'tic-tac-toe']],
  ['Bài', ['solitaire', 'freecell']],
  ['Chữ & học', ['hangman', 'math-quiz']],
  ['Thể thao', ['pool', 'archery']]
];
const catOf = id => (CATS.find(c => c[1].includes(id)) || ['Khác'])[0];
const games = SITE.games.map(g => ({ ...g, name: g.title.replace(/^\S+\s/, ''), cat: catOf(g.id) }));
const $ = id => document.getElementById(id);
const f = $('game-filter'), c = $('game-count'), personal = $('personal'), list = $('game-list'), sortEl = $('game-sort');
let order = get('game.order', []);
let fav = get('game.fav', []), recent = get('game.recent', []), plays = get('game.plays', {});
sortEl.value = get('game.sort', 'cat'); if (!sortEl.value) sortEl.value = 'cat';

const card = g => `<a href="../games/${g.id}.html" class="game-card" data-id="${g.id}"${sortEl.value === 'custom' ? ' draggable="true"' : ''}>${g.title}${plays[g.id] ? `<small class="muted"> · ${plays[g.id]}</small>` : ''}<button type="button" class="fav" data-id="${g.id}" aria-label="Yêu thích ${g.name}" aria-pressed="${fav.includes(g.id)}">${fav.includes(g.id) ? '★' : '☆'}</button>${sortEl.value === 'custom' ? `<span class="mv"><button type="button" data-mv="-1" data-id="${g.id}" aria-label="Dời ${g.name} lên trước">◀</button><button type="button" data-mv="1" data-id="${g.id}" aria-label="Dời ${g.name} ra sau">▶</button></span>` : ''}</a>`;
const block = (t, gs) => gs.length ? `<div class="category"><h2>${t}</h2><div class="game-grid">${gs.map(card).join('')}</div></div>` : '';
function paint() {
  const q = norm(f.value.trim()), mode = sortEl.value;
  const vis = games.filter(g => !q || norm(g.title).includes(q));
  const idx = id => { const i = recent.indexOf(id); return i < 0 ? 99 : i; };
  const byName = (a, b) => a.name.localeCompare(b.name, 'vi');
  personal.innerHTML = q ? '' : block('★ Yêu thích', fav.map(i => games.find(g => g.id === i)).filter(Boolean)) + block('🕘 Chơi gần đây', recent.filter(i => !fav.includes(i)).slice(0, 4).map(i => games.find(g => g.id === i)).filter(Boolean));
  if (mode === 'cat') list.innerHTML = CATS.map(([n]) => block(n, vis.filter(g => g.cat === n))).join('');
  else {
    const pos = id => { const i = order.indexOf(id); return i < 0 ? 999 + games.findIndex(g => g.id === id) : i; };
    const s = [...vis].sort(mode === 'custom' ? (a, b) => pos(a.id) - pos(b.id) : mode === 'az' ? byName : mode === 'plays' ? (a, b) => (plays[b.id] || 0) - (plays[a.id] || 0) || byName(a, b) : mode === 'recent' ? (a, b) => idx(a.id) - idx(b.id) || byName(a, b) : (a, b) => fav.includes(b.id) - fav.includes(a.id) || byName(a, b));
    list.innerHTML = block({ custom: 'Thứ tự của bạn (bấm ◀ ▶ hoặc kéo thả)', az: 'A → Z', plays: 'Chơi nhiều nhất', recent: 'Chơi gần nhất', fav: 'Yêu thích trước' }[mode], s);
  }
  c.textContent = vis.length + ' game';
  if (!vis.length) list.innerHTML = '<p class="muted">Không có game nào khớp.</p>';
}
document.addEventListener('click', e => {
  const mv = e.target.closest('[data-mv]');
  if (mv) { e.preventDefault(); e.stopPropagation(); move(mv.dataset.id, +mv.dataset.mv); return; }
  const b = e.target.closest('.fav');
  if (b) { e.preventDefault(); e.stopPropagation(); const id = b.dataset.id; fav = fav.includes(id) ? fav.filter(x => x !== id) : [id, ...fav]; put('game.fav', fav); paint(); return; }
  const a = e.target.closest('.game-card'); if (a) { const id = a.dataset.id; recent = [id, ...recent.filter(x => x !== id)].slice(0, 8); plays[id] = (plays[id] || 0) + 1; put('game.recent', recent); put('game.plays', plays); }
});
function fullOrder() { const all = games.map(g => g.id); return [...order.filter(i => all.includes(i)), ...all.filter(i => !order.includes(i))]; }
function move(id, d, to) {
  const o = fullOrder(), i = o.indexOf(id), j = to ?? i + d; if (i < 0 || j < 0 || j >= o.length) return;
  o.splice(i, 1); o.splice(j, 0, id); order = o; put('game.order', order); paint();
  const el = list.querySelector(`[data-id="${id}"]`); el && el.querySelector('[data-mv]') && el.querySelector(`[data-mv="${d || 1}"]`)?.focus();
}
let dragId = null;
list.addEventListener('dragstart', e => { const a = e.target.closest('.game-card'); if (a && sortEl.value === 'custom') { dragId = a.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); } });
list.addEventListener('dragover', e => { if (dragId) e.preventDefault(); });
list.addEventListener('drop', e => { const a = e.target.closest('.game-card'); if (dragId && a && a.dataset.id !== dragId) { e.preventDefault(); move(dragId, 0, fullOrder().indexOf(a.dataset.id)); } dragId = null; });
list.addEventListener('dragend', () => { dragId = null; });
$('game-reset').addEventListener('click', () => { order = []; put('game.order', order); paint(); });
f.addEventListener('input', paint);
sortEl.addEventListener('change', () => { put('game.sort', sortEl.value); $('game-reset').hidden = sortEl.value !== 'custom'; paint(); });
$('game-rand').addEventListener('click', () => { const g = games[Math.floor(Math.random() * games.length)]; plays[g.id] = (plays[g.id] || 0) + 1; recent = [g.id, ...recent.filter(x => x !== g.id)].slice(0, 8); put('game.recent', recent); put('game.plays', plays); location.href = `../games/${g.id}.html`; });
$('game-reset').hidden = sortEl.value !== 'custom';
paint();
