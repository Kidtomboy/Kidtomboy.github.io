// Vẽ sơ đồ cây các trang của web.
const G = [
  ['Che779', [['pages/che779.html', 'Tải bản phát hành'], ['pages/ecosystem.html', 'Hệ sinh thái'], ['pages/timeline.html', 'Hành trình'], ['pages/verify.html', 'Kiểm tra SHA-256'], ['pages/status.html', 'Trạng thái']]],
  ['Dự án & viết', [['pages/project.html', 'Dự án GitHub'], ['pages/blog.html', 'Blog'], ['pages/notes.html', 'Ghi chú']]],
  ['Giải trí', [['pages/game.html', 'Game (19 trò)'], ['pages/music.html', 'Nhạc']]],
  ['Tiện ích', [['pages/tools.html', 'Công cụ (14)'], ['pages/todo.html', 'Việc cần làm'], ['pages/terminal.html', 'Terminal'], ['pages/search.html', 'Tìm kiếm']]],
  ['Về mình', [['pages/about.html', 'Giới thiệu'], ['pages/links.html', 'Liên kết'], ['pages/support.html', 'Hỗ trợ'], ['pages/sitemap.html', 'Sơ đồ trang']]]
];
const root = location.pathname.includes('/pages/') ? '../' : '';
const a = (h, t) => `<a href="${root}${h}">${t}</a>`;
let s = `${a('index.html', 'Kidtomboy.github.io')}\n`;
G.forEach(([n, l], gi) => { const last = gi === G.length - 1; s += `${last ? '└─' : '├─'} ${n}\n`;
  l.forEach(([h, t], i) => { s += `${last ? '   ' : '│  '}${i === l.length - 1 ? '└─' : '├─'} ${a(h, t)}\n`; }); });
document.getElementById('tree').innerHTML = s;
