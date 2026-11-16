// Ghi chú Markdown: lưu localStorage, xem trước an toàn (escape trước, chỉ cho phép link http/https/mailto).
import { md, esc } from '../core/md.js';
const KEY = 'notes.v1';
const $ = id => document.getElementById(id);
const title = $('n-title'), text = $('n-text'), prev = $('n-prev'), list = $('n-list');
let notes, cur;

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) { /* đầy bộ nhớ hoặc bị chặn */ } };
function renderList() {
  list.innerHTML = notes.map(n => `<li data-id="${n.id}" ${n.id === cur ? 'aria-current="true"' : ''}>${esc(n.title || 'Không tên')}<small>${new Date(n.at).toLocaleDateString('vi-VN')}</small></li>`).join('') || '<li class="muted">Chưa có ghi chú</li>';
}
function show() {
  const n = notes.find(x => x.id === cur);
  title.value = n ? n.title : ''; text.value = n ? n.body : ''; prev.innerHTML = md(text.value); renderList();
}
function newNote() { const n = { id: Date.now().toString(36), title: '', body: '', at: Date.now() }; notes.unshift(n); cur = n.id; save(); show(); title.focus(); }
function edit() {
  const n = notes.find(x => x.id === cur); if (!n) return;
  n.title = title.value; n.body = text.value; n.at = Date.now(); prev.innerHTML = md(n.body); save(); renderList();
}

notes = load(); cur = notes[0]?.id;
if (!notes.length) newNote(); else show();
title.addEventListener('input', edit); text.addEventListener('input', edit);
$('n-new').addEventListener('click', newNote);
$('n-del').addEventListener('click', () => { if (!confirm('Xóa ghi chú này?')) return; notes = notes.filter(n => n.id !== cur); save(); cur = notes[0]?.id; if (!notes.length) newNote(); else show(); });
list.addEventListener('click', e => { const li = e.target.closest('li[data-id]'); if (li) { cur = li.dataset.id; show(); } });
$('n-export').addEventListener('click', () => {
  const n = notes.find(x => x.id === cur); if (!n) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`# ${n.title}\n\n${n.body}\n`], { type: 'text/markdown' }));
  a.download = (n.title || 'ghi-chu').replace(/[^\w\-]+/g, '-').toLowerCase() + '.md'; a.click(); URL.revokeObjectURL(a.href);
});
