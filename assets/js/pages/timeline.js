// Dòng thời gian: gộp release của 4 repo Che779, mới nhất trước.
import { gh, esc } from '../core/github.js';
import { md } from '../core/md.js';
const REPOS = ['Che779-Emulator', 'Che779-EmulatorV2', 'Che779-Linux', 'Che779-Android'];
const ol = document.getElementById('tl'), filt = document.getElementById('tl-f');
let all = [], cur = 'all';
const render = () => {
  const rows = all.filter(r => cur === 'all' || r.repo === cur);
  ol.innerHTML = rows.map(r => `<li><time datetime="${r.at}">${new Date(r.at).toLocaleDateString('vi-VN')}</time>
    <h3><a href="${esc(r.url)}">${esc(r.tag)}</a> <span class="badge">${esc(r.repo.replace('Che779-', ''))}</span>${r.pre ? ' <span class="pill warn">bản thử</span>' : ''}</h3>
    <div class="muted md">${md((r.body || '').split('\n').slice(0, 8).join('\n'))}</div></li>`).join('') || '<li class="muted">Chưa có bản phát hành.</li>';
  filt.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.r === cur)));
};
filt.innerHTML = ['all', ...REPOS].map(r => `<button type="button" class="btn ghost" data-r="${r}" aria-pressed="false">${r === 'all' ? 'Tất cả' : r.replace('Che779-', '')}</button>`).join('');
filt.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = b.dataset.r; render(); } });
Promise.allSettled(REPOS.map(r => gh(`/repos/Kidtomboy/${r}/releases?per_page=15`).then(l => l.map(x => ({ repo: r, tag: x.tag_name, at: x.published_at || x.created_at, url: x.html_url, body: x.body, pre: x.prerelease })))))
  .then(res => { all = res.flatMap(r => r.status === 'fulfilled' ? r.value : []).sort((a, b) => new Date(b.at) - new Date(a.at));
    if (!all.length) ol.innerHTML = '<li class="muted">Chưa tải được dữ liệu từ GitHub (có thể do giới hạn lượt gọi). Thử lại sau ít phút hoặc xem trực tiếp trên GitHub.</li>'; else render(); });
