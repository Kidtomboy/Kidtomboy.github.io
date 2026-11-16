// Gọi GitHub API có nhớ tạm (sessionStorage 10 phút) để đỡ chạm giới hạn lượt gọi.
const TTL = 10 * 60 * 1000;
export async function gh(path) {
  const key = 'gh:' + path;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (hit && Date.now() - hit.t < TTL) return hit.d;
  } catch (e) { /* bỏ qua */ }
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000); // không treo vô hạn khi mạng chậm
  let res; try { res = await fetch('https://api.github.com' + path, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl.signal }); } finally { clearTimeout(to); }
  if (!res.ok) throw new Error('GitHub ' + res.status);
  const d = await res.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* bỏ qua */ }
  return d;
}
export const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
