// Command palette: Ctrl/⌘+K hoặc "/" để nhảy tới trang, game, repo.
import { SITE } from '../core/site-data.js';
import { toggleTheme } from '../core/theme.js';

const ROOT = new URL('../../../', import.meta.url).pathname;
const items = [
  ...SITE.pages.map(([h, t, k]) => ({ t: '→ ' + t, k, run: () => location.href = ROOT + h })),
  ...SITE.games.map(g => ({ t: '🎮 ' + g.title.replace(/^\S+\s/, ''), k: 'game ' + g.id, run: () => location.href = ROOT + 'games/' + g.id + '.html' })),
  ...SITE.repos.map(r => ({ t: '📦 ' + r.name, k: r.platform + ' ' + r.desc, run: () => window.open('https://github.com/Kidtomboy/' + r.name, '_blank', 'noopener') })),
  { t: '◐ Đổi giao diện sáng/tối', k: 'theme dark light', run: toggleTheme },
  { t: '↗ GitHub của Kidtomboy', k: 'github', run: () => window.open('https://github.com/Kidtomboy', '_blank', 'noopener') }
];
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

let dlg;
function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'palette';
  dlg.innerHTML = `<input type="text" placeholder="Gõ để tìm trang, game, repo…  (Esc để đóng)" aria-label="Tìm lệnh" autocomplete="off"><ul role="listbox"></ul>`;
  document.body.append(dlg);
  const input = dlg.querySelector('input'), ul = dlg.querySelector('ul');
  let sel = 0, shown = [];
  const render = () => {
    const q = norm(input.value.trim());
    shown = items.filter(i => !q || norm(i.t + ' ' + i.k).includes(q)).slice(0, 9);
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    ul.innerHTML = shown.length ? shown.map((i, n) => `<li role="option" aria-selected="${n === sel}" data-n="${n}">${i.t}</li>`).join('') : '<li class="none">Không có kết quả</li>';
  };
  const go = n => { const i = shown[n]; if (i) { dlg.close(); i.run(); } };
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
    else if (e.key === 'Enter') go(sel);
  });
  ul.addEventListener('click', e => { const li = e.target.closest('li[data-n]'); if (li) go(+li.dataset.n); });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { input.value = ''; });
  dlg._open = () => { render(); dlg.showModal(); input.focus(); };
}

export function openPalette() { if (!dlg) build(); dlg._open(); }

document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openPalette(); }
});
