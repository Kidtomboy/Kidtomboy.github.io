// Markdown nhỏ gọn và an toàn: escape trước, chỉ cho phép link http/https/mailto.
export const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
export function md(src) {
  const out = []; let inList = false, inCode = false;
  for (const line of String(src).replace(/\r/g, '').split('\n')) {
    if (line.startsWith('```')) { out.push(inCode ? '</pre>' : '<pre class="code">'); inCode = !inCode; continue; }
    if (inCode) { out.push(esc(line)); continue; }
    const li = line.match(/^\s*[-*]\s+(.*)/);
    if (li) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + inline(li[1]) + '</li>'); continue; }
    if (inList) { out.push('</ul>'); inList = false; }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    out.push(h ? `<h${Math.min(h[1].length + 1, 5)}>${inline(h[2])}</h${Math.min(h[1].length + 1, 5)}>` : line.trim() ? `<p>${inline(line)}</p>` : '');
  }
  if (inList) out.push('</ul>'); if (inCode) out.push('</pre>');
  return out.join('\n');
}
