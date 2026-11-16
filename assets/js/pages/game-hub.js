// Trung tâm game: lọc, yêu thích (★) và chơi gần đây, lưu trên máy.
import { SITE } from '../core/site-data.js';
const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
const norm = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const byId = Object.fromEntries(SITE.games.map(g => [g.id, g]));
const f = document.getElementById('game-filter'), c = document.getElementById('game-count'), personal = document.getElementById('personal');
let fav = get('game.fav', []), recent = get('game.recent', []);

function card(g) { return `<a href="../games/${g.id}.html" class="game-card" data-id="${g.id}">${g.title}<button type="button" class="fav" data-id="${g.id}" aria-label="Yêu thích" aria-pressed="${fav.includes(g.id)}">${fav.includes(g.id) ? '★' : '☆'}</button></a>`; }
function section(t, ids) { const gs = ids.map(i => byId[i]).filter(Boolean); return gs.length ? `<div class="category"><h2>${t}</h2><div class="game-grid">${gs.map(card).join('')}</div></div>` : ''; }
function paint() {
  personal.innerHTML = section('★ Yêu thích', fav) + section('🕘 Chơi gần đây', recent.filter(i => !fav.includes(i)).slice(0, 4));
  document.querySelectorAll('.category .game-card:not(#personal .game-card)').forEach(a => {
    if (a.querySelector('.fav')) a.querySelector('.fav').remove();
    a.insertAdjacentHTML('beforeend', `<button type="button" class="fav" data-id="${a.dataset.id || a.getAttribute('href').match(/([^/]+)\.html/)[1]}" aria-label="Yêu thích" aria-pressed="${fav.includes(a.getAttribute('href').match(/([^/]+)\.html/)[1])}">${fav.includes(a.getAttribute('href').match(/([^/]+)\.html/)[1]) ? '★' : '☆'}</button>`);
  });
  filter();
}
function filter() {
  const q = norm(f.value.trim()); let n = 0;
  document.querySelectorAll('.category:not(#personal .category) .game-card').forEach(a => { const ok = !q || norm(a.textContent).includes(q); a.hidden = !ok; if (ok) n++; });
  document.querySelectorAll('.category').forEach(e => { if (!e.closest('#personal')) e.hidden = !e.querySelector('.game-card:not([hidden])'); });
  c.textContent = n + ' game';
}
document.addEventListener('click', e => {
  const b = e.target.closest('.fav');
  if (b) { e.preventDefault(); e.stopPropagation(); const id = b.dataset.id; fav = fav.includes(id) ? fav.filter(x => x !== id) : [id, ...fav]; put('game.fav', fav); paint(); return; }
  const a = e.target.closest('.game-card'); if (a) { const id = a.getAttribute('href').match(/([^/]+)\.html/)[1]; recent = [id, ...recent.filter(x => x !== id)].slice(0, 8); put('game.recent', recent); }
});
f.addEventListener('input', filter);
paint();
