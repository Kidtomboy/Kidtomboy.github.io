// Khung chung: header, menu di động, nút đổi giao diện, footer.
import { getTheme, toggleTheme } from '../core/theme.js';

const ROOT = new URL('../../../', import.meta.url).pathname; // gốc site, đúng cả khi đặt trong thư mục con
const NAV = [
  ['index.html', 'Trang chủ'], ['pages/project.html', 'Dự án'], ['pages/game.html', 'Game'],
  ['pages/music.html', 'Nhạc'], ['pages/todo.html', 'Việc cần làm'], ['pages/search.html', 'Tìm kiếm'],
  ['pages/support.html', 'Hỗ trợ'], ['pages/about.html', 'Giới thiệu']
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
      <a class="logo" href="${ROOT}index.html"><span aria-hidden="true">🍒</span><b>Kid<span>tomboy</span></b></a>
      <nav class="site-nav" id="site-nav" aria-label="Điều hướng chính">
        ${NAV.map(([h, t]) => `<a href="${ROOT}${h}"${isCurrent(h) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      </nav>
      <button class="icon-btn" id="theme-btn" aria-label="Đổi giao diện sáng/tối" title="Đổi giao diện"></button>
      <button class="icon-btn menu-btn" id="menu-btn" aria-label="Mở menu" aria-expanded="false">☰</button>
    </div>`;
  document.body.prepend(header);

  const themeBtn = header.querySelector('#theme-btn');
  const paint = () => { themeBtn.textContent = getTheme() === 'dark' ? '☀️' : '🌙'; };
  paint();
  themeBtn.addEventListener('click', () => { toggleTheme(); paint(); });

  const nav = header.querySelector('#site-nav');
  const menuBtn = header.querySelector('#menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) nav.classList.remove('open'); });

  if (!document.body.hasAttribute('data-no-footer')) {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `Làm bởi <b>Kidtomboy</b> 🍒 <b>Cherry</b> · <a href="https://github.com/Kidtomboy">GitHub</a>`;
    document.body.append(footer);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).catch(() => {});
}
