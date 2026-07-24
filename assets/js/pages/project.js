// Project Page - Gọi GitHub API lấy repo của Kidtomboy

const GITHUB_USERNAME = 'Kidtomboy';
let allProjects = [];

async function fetchProjects() {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
    if (!response.ok) throw new Error('Lỗi API');
    allProjects = await response.json();
    renderProjects(allProjects);
    populateLanguageFilter();
  } catch (err) {
    document.getElementById('project-list').innerHTML = '<p>Không thể tải dự án. Vui lòng thử lại sau.</p>';
  }
}

function renderProjects(projects) {
  const container = document.getElementById('project-list');
  if (projects.length === 0) {
    container.innerHTML = '<p>Không tìm thấy dự án.</p>';
    return;
  }
  container.innerHTML = projects.map(project => `
    <div class="project-card">
      <h3><a href="${project.html_url}" target="_blank" rel="noopener">${project.name}</a></h3>
      <p>${project.description || 'Không có mô tả'}</p>
      <div class="project-meta">
        <span class="language-badge">${project.language || 'N/A'}</span>
        <span>${new Date(project.updated_at).toLocaleDateString('vi-VN')}</span>
      </div>
    </div>
  `).join('');
}

function populateLanguageFilter() {
  const languages = [...new Set(allProjects.map(p => p.language).filter(Boolean))];
  const select = document.getElementById('language-filter');
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = lang;
    select.appendChild(option);
  });
}

// Tìm kiếm & lọc
document.getElementById('project-search').addEventListener('input', filterProjects);
document.getElementById('language-filter').addEventListener('change', filterProjects);

function filterProjects() {
  const searchTerm = document.getElementById('project-search').value.toLowerCase();
  const language = document.getElementById('language-filter').value;
  const filtered = allProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm) || (project.description && project.description.toLowerCase().includes(searchTerm));
    const matchesLanguage = !language || project.language === language;
    return matchesSearch && matchesLanguage;
  });
  renderProjects(filtered);
}

// Khởi chạy
fetchProjects();