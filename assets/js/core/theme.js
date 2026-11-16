// Chủ đề sáng/tối: theo hệ thống, người dùng đổi tay thì nhớ lại.
const root = document.documentElement;
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function saved() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
function apply(mode) { root.setAttribute('data-theme', mode); }

export function getTheme() { return root.getAttribute('data-theme') || 'light'; }
export function setTheme(mode) {
  apply(mode);
  try { localStorage.setItem('theme', mode); } catch (e) { /* bỏ qua */ }
}
export function toggleTheme() { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

apply(saved() || (mq.matches ? 'dark' : 'light'));
mq.addEventListener('change', e => { if (!saved()) apply(e.matches ? 'dark' : 'light'); });
