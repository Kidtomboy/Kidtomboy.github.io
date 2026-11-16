// Terminal tương tác: gõ "help" để xem lệnh.
import { SITE } from '../core/site-data.js';
import { gh, esc } from '../core/github.js';
import { setTheme } from '../core/theme.js';

const out = document.getElementById('out'), input = document.getElementById('in'), term = document.getElementById('term');
const ROOT = new URL('../../', import.meta.url).pathname;
const hist = []; let hp = 0;
const files = {
  'about.md': 'Kidtomboy (Cherry) — Đỗ Đình Hiếu, Hải Phòng, Việt Nam.\nLập trình viên · Nghiên cứu An ninh mạng · Nghiên cứu Phần mềm.',
  'skills.txt': 'Python, JavaScript, TypeScript, C, C#, Java',
  'che779.md': 'Che779: giả lập game J2ME cho Windows, Linux, Android (v1.3.0). Gõ "che779" để xem 4 repo.',
  'contact.txt': 'GitHub: github.com/Kidtomboy\nTelegram: t.me/KidtomboyReal\nBlog: kidtomboy.blogspot.com'
};
const print = (html, cls = '') => { const d = document.createElement('div'); d.className = 'ln ' + cls; d.innerHTML = html; out.append(d); term.scrollTop = term.scrollHeight; };
const text = s => print(esc(s).replace(/\n/g, '<br>'));
const link = (href, label) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;
const pageMap = Object.fromEntries(SITE.pages.map(([h]) => [h.replace(/^pages\//, '').replace('.html', ''), h]));

const cmds = {
  help() { text('Lệnh: help, about, whoami, ls, cat <file>, che779, projects, games, open <trang>, theme dark|light, neofetch, date, echo, history, clear\nMẹo: Tab để gợi ý, ↑/↓ xem lại lệnh, Ctrl+K mở tìm nhanh.'); },
  about() { text(files['about.md']); },
  whoami() { text('kidtomboy'); },
  ls() { text(Object.keys(files).join('  ') + '  pages/  games/'); },
  cat(a) { const f = files[a[0]]; text(f || `cat: ${a[0] || ''}: không có file này`); },
  che779() { SITE.repos.forEach(r => print(`📦 ${link('https://github.com/Kidtomboy/' + r.name, r.name)} <span class="dim">[${r.platform}]</span> — ${esc(r.desc)}`)); print(`→ Tải bản phát hành: ${link(ROOT + 'pages/che779.html', 'pages/che779.html')}`); },
  async projects() {
    text('Đang tải từ GitHub…');
    try { (await gh('/users/Kidtomboy/repos?sort=updated&per_page=100')).filter(r => !r.fork).slice(0, 15).forEach(r => print(`• ${link(r.html_url, r.name)} <span class="dim">${esc(r.language || '')}</span> ${esc(r.description || '')}`)); }
    catch (e) { text('Không gọi được GitHub API (hết lượt hoặc mất mạng). Thử lại sau.'); }
  },
  games() { print(SITE.games.map(g => link(ROOT + 'games/' + g.id + '.html', g.id)).join('  ')); },
  open(a) { const h = pageMap[a[0]] || (SITE.games.some(g => g.id === a[0]) ? 'games/' + a[0] + '.html' : null); if (!h) return text(`open: không có "${a[0] || ''}". Thử: ${Object.keys(pageMap).join(', ')}`); text('Đang mở…'); location.href = ROOT + h; },
  theme(a) { if (!['dark', 'light'].includes(a[0])) return text('Dùng: theme dark|light'); setTheme(a[0]); text('Đã đổi sang ' + a[0]); },
  neofetch() { print(`<pre class="nf">   ▄▄▄▄▄     kidtomboy@github
  █ ▄ ▄ █    ─────────────────
  █  ▀  █    OS: GitHub Pages
  █▄▄▄▄▄█    Shell: kidsh 1.0
             Lang: Python · JS · TS · C
             Project: Che779 (v1.3.0)
             Theme: ${document.documentElement.dataset.theme}</pre>`); },
  date() { text(new Date().toString()); },
  echo(a) { text(a.join(' ')); },
  history() { text(hist.map((h, i) => `${i + 1}  ${h}`).join('\n')); },
  clear() { out.innerHTML = ''; },
  sudo() { text('kidtomboy is not in the sudoers file. This incident will be reported. 😼'); },
  rm() { text('Đùa thôi, không xóa gì đâu. 🙂'); }
};

async function run(line) {
  print(`<span class="pr">kid@tomboy:~$</span> ${esc(line)}`);
  const [c, ...a] = line.trim().split(/\s+/);
  if (!c) return;
  const fn = cmds[c];
  if (fn) await fn(a); else text(`${c}: không tìm thấy lệnh. Gõ "help".`);
}

input.addEventListener('keydown', async e => {
  if (e.key === 'Enter') { const v = input.value; input.value = ''; if (v.trim()) { hist.push(v); hp = hist.length; } await run(v); }
  else if (e.key === 'ArrowUp') { if (hp > 0) input.value = hist[--hp]; e.preventDefault(); }
  else if (e.key === 'ArrowDown') { input.value = hp < hist.length - 1 ? hist[++hp] : (hp = hist.length, ''); e.preventDefault(); }
  else if (e.key === 'Tab') {
    e.preventDefault();
    const v = input.value, parts = v.split(/\s+/);
    const pool = parts.length < 2 ? Object.keys(cmds) : parts[0] === 'cat' ? Object.keys(files) : parts[0] === 'open' ? [...Object.keys(pageMap), ...SITE.games.map(g => g.id)] : [];
    const m = pool.filter(p => p.startsWith(parts.at(-1)));
    if (m.length === 1) input.value = [...parts.slice(0, -1), m[0]].join(' ');
    else if (m.length > 1) text(m.join('  '));
  }
});
term.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });
print('<b>Kidtomboy shell</b> — gõ <code>help</code> để bắt đầu.', 'dim');
input.focus();
