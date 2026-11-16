// Khung chung: header, menu di động, nút đổi giao diện, footer.
import { getTheme, toggleTheme } from '../core/theme.js';
import { openPalette } from './palette.js';

const ROOT = new URL('../../../', import.meta.url).pathname; // gốc site, đúng cả khi đặt trong thư mục con
const NAV = [
  ['index.html', 'Trang chủ'], ['pages/che779.html', 'Che779'], ['pages/project.html', 'Dự án'], ['pages/game.html', 'Game'], ['pages/about.html', 'Giới thiệu']
];
const MORE = [
  ['pages/links.html', 'Liên kết'], ['pages/notes.html', 'Ghi chú'], ['pages/terminal.html', 'Terminal'], ['pages/music.html', 'Nhạc'], ['pages/todo.html', 'Việc cần làm'], ['pages/search.html', 'Tìm kiếm'], ['pages/support.html', 'Hỗ trợ']
];

function isCurrent(href) {
  const path = location.pathname.replace(/\/$/, '/index.html');
  if (href === 'pages/game.html') return path.endsWith('/pages/game.html') || path.includes('/games/');
  return path === ROOT + href || (href === 'index.html' && path === ROOT);
}

function build() {
  document.body.classList.add('has-header');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="bar">
      <a class="logo" href="${ROOT}index.html"><span class="p">~/</span>kidtomboy<i>_</i></a>
      <nav class="site-nav" id="site-nav" aria-label="Điều hướng chính">
        ${NAV.map(([h, t]) => `<a href="${ROOT}${h}"${isCurrent(h) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
        <div class="more" id="more"><button type="button" aria-haspopup="true" aria-expanded="false">Thêm ▾</button>
          <div class="more-list">${MORE.map(([h, t]) => `<a href="${ROOT}${h}"${isCurrent(h) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</div></div>
      </nav>
      <button class="icon-btn" id="search-btn" aria-label="Tìm nhanh (Ctrl+K)" title="Tìm nhanh (Ctrl+K)">⌕</button>
      <button class="icon-btn" id="theme-btn" aria-label="Đổi giao diện sáng/tối" title="Đổi giao diện"></button>
      <button class="icon-btn menu-btn" id="menu-btn" aria-label="Mở menu" aria-expanded="false">☰</button>
    </div>`;
  document.body.prepend(header);

  header.querySelector('#search-btn').addEventListener('click', openPalette);
  const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Bỏ qua menu'; document.body.prepend(skip);
  const mainEl = document.querySelector('main'); if (mainEl && !mainEl.id) mainEl.id = 'main';
  const themeBtn = header.querySelector('#theme-btn');
  const paint = () => { themeBtn.textContent = getTheme() === 'dark' ? '☀' : '☾'; };
  paint();
  themeBtn.addEventListener('click', () => { toggleTheme(); paint(); });

  const nav = header.querySelector('#site-nav');
  const menuBtn = header.querySelector('#menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  const more = header.querySelector('#more');
  const moreBtn = more.querySelector('button');
  moreBtn.addEventListener('click', e => { e.stopPropagation(); const o = more.classList.toggle('open'); moreBtn.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', () => { more.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) nav.classList.remove('open'); });

  if (!document.body.hasAttribute('data-no-footer')) {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `&copy; Kidtomboy (Cherry) · <a href="https://github.com/Kidtomboy">GitHub</a>`;
    document.body.append(footer);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).catch(() => {});
}
