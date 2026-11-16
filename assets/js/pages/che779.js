// Trang Che779: lấy bản phát hành mới nhất của 4 repo trực tiếp từ GitHub.
import { SITE } from '../core/site-data.js';
import { gh, fmtSize, esc } from '../core/github.js';
import { md } from '../core/md.js';

const box = document.getElementById('releases');
const tabs = document.getElementById('plat-tabs');
let active = 'all';

function card(r, rel) {
  const url = `https://github.com/Kidtomboy/${r.name}`;
  let body;
  if (!rel) {
    body = `<p class="muted">Chưa tải được thông tin bản phát hành. <a href="${url}/releases">Xem ở GitHub →</a></p>`;
  } else {
    const sums = rel.assets.find(a => a.name === 'SHA256SUMS.txt');
    const files = rel.assets.filter(a => a !== sums);
    body = `<p class="rel-line"><span class="badge">${esc(rel.tag_name)}</span> <span class="muted">${new Date(rel.published_at).toLocaleDateString('vi-VN')}</span></p>
      <ul class="files">${files.map(a => `<li><a href="${esc(a.browser_download_url)}"><span>⬇ ${esc(a.name)}</span><small>${fmtSize(a.size)} · ${a.download_count} lượt tải</small></a></li>`).join('')}</ul>
      ${rel.body ? `<details class="notes"><summary>Ghi chú phát hành</summary><div class="md">${md(rel.body)}</div></details>` : ''}
      ${sums ? `<p class="muted"><a href="${esc(sums.browser_download_url)}">SHA256SUMS.txt</a> — kiểm tra: <code>sha256sum -c SHA256SUMS.txt</code></p>` : ''}`;
  }
  return `<article class="card rel" data-plat="${r.platform}">
    <h3>${esc(r.name)} <span class="badge">${r.platform}</span></h3>
    <p class="muted">${esc(r.desc)}</p>${body}
    <p><a class="btn ghost" href="${url}" target="_blank" rel="noopener">Mã nguồn & README</a></p></article>`;
}

async function load() {
  const results = await Promise.all(SITE.repos.map(r => gh(`/repos/Kidtomboy/${r.name}/releases/latest`).catch(() => null)));
  box.innerHTML = SITE.repos.map((r, i) => card(r, results[i])).join('');
  filter();
}

function filter() {
  box.querySelectorAll('.rel').forEach(el => { el.hidden = active !== 'all' && el.dataset.plat !== active; });
}

tabs.addEventListener('click', e => {
  const b = e.target.closest('button[data-plat]'); if (!b) return;
  active = b.dataset.plat;
  tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  filter();
});

// Gợi ý nền tảng theo thiết bị người dùng
const ua = navigator.userAgent;
const guess = /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Linux|X11/i.test(ua) ? 'Linux' : 'all';
if (guess !== 'all') { active = guess; tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.plat === guess))); }
load();
