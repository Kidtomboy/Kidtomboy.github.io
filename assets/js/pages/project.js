// Trang Dự án: lấy repo công khai từ GitHub API (bỏ repo Che779 vì đã có mục riêng ở trên)
const USER = 'Kidtomboy';
const list = document.getElementById('project-list');
const search = document.getElementById('project-search');
const langSel = document.getElementById('language-filter');
let all = [];

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function load() {
  try {
    const res = await fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error(res.status);
    all = (await res.json()).filter(r => !r.fork && !/^che779-/i.test(r.name) && r.name.toLowerCase() !== `${USER}.github.io`.toLowerCase() && r.name.toLowerCase() !== USER.toLowerCase());
    [...new Set(all.map(r => r.language).filter(Boolean))].sort().forEach(l => langSel.append(new Option(l, l)));
    render();
  } catch (e) {
    list.innerHTML = `<p>Không tải được danh sách (GitHub giới hạn truy cập hoặc mất mạng). Xem trực tiếp tại <a href="https://github.com/${USER}?tab=repositories" style="color:var(--accent);font-weight:800">GitHub</a>.</p>`;
  }
}

function render() {
  const q = search.value.trim().toLowerCase(), lang = langSel.value;
  const rows = all.filter(r => (!lang || r.language === lang) && (!q || r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)));
  list.innerHTML = rows.length ? rows.map(r => `
    <a class="card project-card lift" href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.description) || 'Chưa có mô tả'}</p>
      <div class="project-meta"><span class="badge">${esc(r.language) || 'N/A'}</span><span>${new Date(r.updated_at).toLocaleDateString('vi-VN')}</span></div>
    </a>`).join('') : '<p>Không tìm thấy dự án.</p>';
}

search.addEventListener('input', render);
langSel.addEventListener('change', render);
load();
