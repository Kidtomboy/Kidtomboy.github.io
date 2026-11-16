// Trang chủ: chữ gõ, số liệu GitHub trực tiếp, bản phát hành mới, repo vừa cập nhật.
import { SITE } from '../core/site-data.js';
import { gh, esc, fmtSize } from '../core/github.js';
import { countUp } from '../core/ui.js';

// 1) Vai trò gõ chữ
const roles = ['Lập trình viên', 'Nghiên cứu bảo mật', 'Nghiên cứu phần mềm', 'Người duy trì Che779', 'Hay mày mò thứ mới'];
const el = document.getElementById('roles');
if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.fx === 'off') el.textContent = roles[0];
else {
  let r = 0, i = 0, del = false;
  (function tick() {
    const w = roles[r];
    el.textContent = w.slice(0, i) + '▌';
    if (!del && i === w.length) { del = true; return setTimeout(tick, 1400); }
    if (del && i === 0) { del = false; r = (r + 1) % roles.length; }
    i += del ? -1 : 1;
    setTimeout(tick, del ? 35 : 70);
  })();
}

// 2) Số liệu
const stat = (id, n) => { const e = document.getElementById(id); if (e) countUp(e.querySelector('b'), n); };
(async () => {
  try {
    const [user, repos] = await Promise.all([gh('/users/Kidtomboy'), gh('/users/Kidtomboy/repos?per_page=100&sort=pushed')]);
    stat('st-repos', user.public_repos); stat('st-fol', user.followers);
    stat('st-stars', repos.reduce((n, r) => n + r.stargazers_count, 0));
    const recent = repos.filter(r => !r.fork).slice(0, 4);
    document.getElementById('recent').innerHTML = recent.map(r => `<a class="card lift" href="${esc(r.html_url)}" target="_blank" rel="noopener"><h3>${esc(r.name)}</h3><p class="muted">${esc(r.description) || 'Chưa có mô tả'}</p><p class="muted" style="margin-top:.5rem">${r.language ? '<span class="badge">' + esc(r.language) + '</span> ' : ''}cập nhật ${new Date(r.pushed_at).toLocaleDateString('vi-VN')}</p></a>`).join('');
  } catch (e) {
    document.querySelectorAll('.stat b').forEach(b => { b.textContent = '—'; });
    document.getElementById('recent').innerHTML = '<p class="muted">Chưa tải được từ GitHub. <a href="https://github.com/Kidtomboy?tab=repositories" style="color:var(--accent)">Xem trực tiếp →</a></p>';
  }
})();

// 3) Bản phát hành Che779 + tổng lượt tải
(async () => {
  const rels = await Promise.all(SITE.repos.map(r => gh(`/repos/Kidtomboy/${r.name}/releases?per_page=30`).catch(() => null)));
  let dl = 0, any = false;
  document.getElementById('latest').innerHTML = SITE.repos.map((r, i) => {
    const list = rels[i]; if (!list) return `<a class="card lift" href="https://github.com/Kidtomboy/${r.name}/releases" target="_blank" rel="noopener"><h3>${esc(r.name)}</h3><p class="muted">Xem ở GitHub →</p></a>`;
    any = true; list.forEach(x => x.assets.forEach(a => { dl += a.download_count; }));
    const rel = list.find(x => !x.prerelease && !x.draft); if (!rel) return `<div class="card"><h3>${esc(r.name)}</h3><p class="muted">Chưa có bản phát hành</p></div>`;
    const main = rel.assets.find(a => !/SHA256|\.txt$/.test(a.name));
    return `<div class="card lift"><h3>${esc(r.name)} <span class="badge">${esc(rel.tag_name)}</span></h3><p class="muted">${r.platform} · ${new Date(rel.published_at).toLocaleDateString('vi-VN')}</p>${main ? `<p style="margin-top:.6rem"><a class="btn ghost" href="${esc(main.browser_download_url)}">⬇ ${fmtSize(main.size)}</a></p>` : ''}</div>`;
  }).join('');
  if (any) stat('st-dl', dl); else document.querySelector('#st-dl b').textContent = '—';
})();
