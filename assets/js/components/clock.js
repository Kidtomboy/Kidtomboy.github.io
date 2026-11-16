// Đồng hồ + ngày (tiếng Việt), cập nhật mỗi giây, dừng khi tab bị ẩn.
const els = [...document.querySelectorAll('#clock-line, .clock')];
const fmt = () => { const d = new Date(); return d.toLocaleTimeString('vi-VN') + ' · ' + d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }); };
let t;
const tick = () => els.forEach(e => { e.textContent = fmt(); });
const start = () => { tick(); clearInterval(t); t = setInterval(tick, 1000); };
document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(t) : start());
start();
