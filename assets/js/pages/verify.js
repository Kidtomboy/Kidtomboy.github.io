// Đối chiếu SHA-256 của file với nội dung SHA256SUMS.txt, tính ngay trên máy.
import { esc } from '../core/md.js';
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const out = document.getElementById('v-out'), sums = document.getElementById('v-sums'), files = document.getElementById('v-files');
const parse = t => { const m = new Map(); t.split(/\r?\n/).forEach(l => { const x = l.trim().match(/^([0-9a-fA-F]{64})\s+\*?(.+)$/); if (x) m.set(x[2].trim().split(/[\\/]/).pop(), x[1].toLowerCase()); }); return m; };
let cache = [];
async function run() {
  const map = parse(sums.value);
  if (!cache.length) { out.innerHTML = ''; return; }
  out.innerHTML = cache.map(c => {
    const want = map.get(c.name);
    const [cls, ic, msg] = !map.size ? ['na', '?', 'Chưa có SHA256SUMS.txt để đối chiếu.'] : !want ? ['na', '?', 'Không thấy tên file này trong SHA256SUMS.txt.'] : want === c.hash ? ['ok', '✓', 'Khớp. File nguyên vẹn.'] : ['bad', '✗', 'KHÔNG khớp. Hãy tải lại file, đừng chạy nó.'];
    return `<div class="vrow ${cls}"><b>${ic}</b><div><strong>${esc(c.name)}</strong><br><span class="muted">${msg}</span><br>Tính được: <code>${c.hash}</code>${want && want !== c.hash ? `<br>Mong đợi: <code>${want}</code>` : ''}</div></div>`;
  }).join('');
}
files.addEventListener('change', async () => {
  cache = []; out.innerHTML = '<p class="muted">Đang tính…</p>';
  for (const f of files.files) { cache.push({ name: f.name, hash: hex(await crypto.subtle.digest('SHA-256', await f.arrayBuffer())) }); }
  run();
});
sums.addEventListener('input', run);
