// Quản lý Dark/Light Mode tự động và thủ công
const lightCSS = document.getElementById('theme-light');
const darkCSS = document.getElementById('theme-dark');

function setTheme(mode) {
  if (mode === 'dark') {
    lightCSS.disabled = true;
    darkCSS.disabled = false;
    localStorage.setItem('theme', 'dark');
  } else {
    lightCSS.disabled = false;
    darkCSS.disabled = true;
    localStorage.setItem('theme', 'light');
  }
}

// Tự động phát hiện hệ thống
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const savedTheme = localStorage.getItem('theme');

if (savedTheme) {
  setTheme(savedTheme);
} else {
  setTheme(prefersDark.matches ? 'dark' : 'light');
}

prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

// Export để component khác dùng
export { setTheme };