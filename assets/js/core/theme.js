// Chủ đề: mặc định tối; người dùng đổi tay thì nhớ lại.
const root = document.documentElement;

function saved() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
function apply(mode) { root.setAttribute('data-theme', mode); }

export function getTheme() { return root.getAttribute('data-theme') || 'light'; }
export function setTheme(mode) {
  apply(mode);
  try { localStorage.setItem('theme', mode); } catch (e) { /* bỏ qua */ }
}
export function toggleTheme() { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

apply(saved() || 'dark'); // mặc định tối (phong cách hacker)
