// Trang Dự án: repo công khai từ GitHub (bỏ repo Che779 vì đã có mục riêng), có sắp xếp và lọc.
import { gh, esc } from '../core/github.js';
const USER = 'Kidtomboy';
const list = document.getElementById('project-list'), search = document.getElementById('project-search'), langSel = document.getElementById('language-filter'), sortSel = document.getElementById('sort-by');
let all = [];

async function load() {
  try {
    all = (await gh(`/users/${USER}/repos?sort=updated&per_page=100`)).filter(r => !r.fork && !/^che779-/i.test(r.name) && ![`${USER}.github.io`, USER].map(x => x.toLowerCase()).includes(r.name.toLowerCase()));
    [...new Set(all.map(r => r.language).filter(Boolean))].sort().forEach(l => langSel.append(new Option(l, l)));
    render();
  } catch (e) {
    list.innerHTML = `<p>Không tải được danh sách (GitHub giới hạn truy cập hoặc mất mạng). Xem trực tiếp tại <a href="https://github.com/${USER}?tab=repositories" style="color:var(--accent);font-weight:800">GitHub</a>.</p>`;
  }
}
function render() {
  const q = search.value.trim().toLowerCase(), lang = langSel.value, by = sortSel.value;
  const rows = all.filter(r => (!lang || r.language === lang) && (!q || r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.topics || []).some(t => t.includes(q))))
    .sort((a, b) => by === 'stars' ? b.stargazers_count - a.stargazers_count : by === 'name' ? a.name.localeCompare(b.name) : new Date(b.pushed_at) - new Date(a.pushed_at));
  list.innerHTML = rows.length ? rows.map(r => `
    <a class="card project-card lift" href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.description) || 'Chưa có mô tả'}</p>
      ${(r.topics || []).length ? `<p class="topics">${r.topics.slice(0, 4).map(t => `<span>#${esc(t)}</span>`).join('')}</p>` : ''}
      <div class="project-meta"><span class="badge">${esc(r.language) || 'N/A'}</span><span>★ ${r.stargazers_count} · ${new Date(r.pushed_at).toLocaleDateString('vi-VN')}</span></div>
    </a>`).join('') : '<p>Không tìm thấy dự án.</p>';
}
[search, langSel, sortSel].forEach(e => e.addEventListener(e === search ? 'input' : 'change', render));
load();
