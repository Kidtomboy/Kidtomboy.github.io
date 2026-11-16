// Nền "mưa ký tự" nhẹ cho trang chủ. Tự tắt khi người dùng giảm chuyển động hoặc tab bị ẩn.
export function matrix(canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const chars = '01アイウエオカキクケコ{}[]<>/$#%=+*';
  let w, h, cols, drops, timer;
  const size = 16;
  function resize() {
    w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight;
    cols = Math.ceil(w / size); drops = Array.from({ length: cols }, () => Math.random() * h / size);
  }
  function frame() {
    const cs = getComputedStyle(document.documentElement);
    const bg = cs.getPropertyValue('--bg-primary').trim() || '#05080a', fg = cs.getPropertyValue('--accent').trim() || '#00ff9c';
    ctx.fillStyle = bg + 'e6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg; ctx.font = size + 'px monospace';
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
      drops[i] = y * size > h && Math.random() > .975 ? 0 : y + 1;
    });
  }
  const start = () => { if (!timer) timer = setInterval(frame, 70); };
  const stop = () => { clearInterval(timer); timer = 0; };
  resize(); addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
}
