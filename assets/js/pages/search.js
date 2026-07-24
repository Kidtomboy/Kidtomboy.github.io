// Search Page Logic - Quản lý search engine, bookmarks, settings

const engines = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  yahoo: 'https://search.yahoo.com/search?p=',
  brave: 'https://search.brave.com/search?q=',
  yandex: 'https://yandex.com/search/?text=',
  ecosia: 'https://www.ecosia.org/search?q='
};

let currentEngine = localStorage.getItem('searchEngine') || 'google';
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

// DOM elements
const engineButtons = document.querySelectorAll('.search-engine-selector button');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const bookmarksContainer = document.getElementById('bookmarks-container');

// Khởi tạo
function init() {
  setActiveEngine(currentEngine);
  renderBookmarks();
  bindEvents();
}

function setActiveEngine(engine) {
  engineButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.engine === engine);
  });
}

function bindEvents() {
  engineButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentEngine = btn.dataset.engine;
      localStorage.setItem('searchEngine', currentEngine);
      setActiveEngine(currentEngine);
    });
  });

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}

function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  const url = engines[currentEngine] + encodeURIComponent(query);
  window.open(url, '_blank');
}

// Bookmarks
function renderBookmarks() {
  if (bookmarks.length === 0) {
    bookmarksContainer.innerHTML = '<p>Chưa có bookmark nào. Nhấn Cài đặt để thêm.</p>';
    return;
  }
  bookmarksContainer.innerHTML = bookmarks.map((bm, index) => `
    <div class="bookmark-item" data-index="${index}">
      <span>${bm.title}</span>
      <small>${bm.url}</small>
    </div>
  `).join('');

  document.querySelectorAll('.bookmark-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const index = item.dataset.index;
      window.open(bookmarks[index].url, '_blank');
    });
  });
}

// Settings (đơn giản) có thể mở rộng
document.getElementById('settings-toggle-btn')?.addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

init();