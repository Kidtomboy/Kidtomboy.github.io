// Cài đặt + phím tắt: màu nhấn, giao diện, hiệu ứng, cỡ chữ. Lưu trong localStorage.
import { getTheme, setTheme } from '../core/theme.js';
import { toast } from '../core/ui.js';

const root = document.documentElement;
const ACCENTS = { green: '#00ff9c', cyan: '#22d3ee', purple: '#c084fc', amber: '#fbbf24', pink: '#ff7eb6', red: '#ff5c5c' };
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const put = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } };

let dlg;
function build() {
  dlg = document.createElement('dialog'); dlg.className = 'modal';
  dlg.innerHTML = `<h2>⚙ Cài đặt</h2>
    <div class="row"><span>Màu nhấn</span><div class="swatches" id="sw">${Object.entries(ACCENTS).map(([k, c]) => `<button type="button" data-a="${k}" style="background:${c}" aria-label="${k}" aria-pressed="false"></button>`).join('')}</div></div>
    <div class="row"><span>Giao diện</span><div class="seg"><button type="button" data-t="dark">Tối</button><button type="button" data-t="light">Sáng</button></div></div>
    <div class="row"><span>Hiệu ứng (nền, cuộn)</span><div class="seg"><button type="button" data-fx="on">Bật</button><button type="button" data-fx="off">Tắt</button></div></div>
    <div class="row"><span>Cỡ chữ</span><div class="seg"><button type="button" data-f="90">A-</button><button type="button" data-f="100">A</button><button type="button" data-f="112">A+</button></div></div>
    <div class="row"><span>Đặt lại mọi thiết lập</span><button type="button" class="btn ghost" id="rs">Đặt lại</button></div>
    <button type="button" class="btn close">Đóng</button>`;
  document.body.append(dlg);
  const paint = () => {
    const a = root.dataset.accent || 'green', t = getTheme(), fx = root.dataset.fx === 'off' ? 'off' : 'on', f = (root.style.fontSize || '100%').replace('%', '');
    dlg.querySelectorAll('[data-a]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === a)));
    dlg.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    dlg.querySelectorAll('[data-fx]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fx === fx)));
    dlg.querySelectorAll('[data-f]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
  };
  dlg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (e.target === dlg) dlg.close(); if (!b) return;
    if (b.dataset.a) { root.dataset.accent = b.dataset.a; put('accent', b.dataset.a); }
    else if (b.dataset.t) setTheme(b.dataset.t);
    else if (b.dataset.fx) { b.dataset.fx === 'off' ? root.dataset.fx = 'off' : delete root.dataset.fx; put('fx', b.dataset.fx === 'off' ? 'off' : null); }
    else if (b.dataset.f) { root.style.fontSize = b.dataset.f + '%'; put('fsize', b.dataset.f === '100' ? null : b.dataset.f); }
    else if (b.id === 'rs') { ['accent', 'theme', 'fx', 'fsize'].forEach(k => put(k, null)); root.dataset.accent = 'green'; root.dataset.theme = 'dark'; delete root.dataset.fx; root.style.fontSize = ''; toast('Đã đặt lại'); }
    else if (b.classList.contains('close')) dlg.close();
    paint();
  });
  dlg._paint = paint;
}
export function openSettings() { if (!dlg) build(); dlg._paint(); dlg.showModal(); }

let help;
export function openHelp() {
  if (!help) {
    help = document.createElement('dialog'); help.className = 'modal';
    help.innerHTML = `<h2>⌨ Phím tắt</h2><div class="keys"><span class="kbd">Ctrl K</span><span>Tìm nhanh trang, game, repo</span><span class="kbd">/</span><span>Mở tìm nhanh</span><span class="kbd">?</span><span>Bảng phím tắt này</span><span class="kbd">g h</span><span>Về trang chủ</span><span class="kbd">g c</span><span>Che779</span><span class="kbd">g t</span><span>Terminal</span><span class="kbd">g p</span><span>Dự án</span></div><button type="button" class="btn close">Đóng</button>`;
    help.addEventListener('click', e => { if (e.target === help || e.target.closest('.close')) help.close(); });
    document.body.append(help);
  }
  help.showModal();
}

// Chuỗi phím "g" + chữ cái để chuyển trang
const ROOT = new URL('../../../', import.meta.url).pathname;
const GO = { h: 'index.html', c: 'pages/che779.html', t: 'pages/terminal.html', p: 'pages/project.html', g: 'pages/game.html', k: 'pages/tools.html' };
let gAt = 0;
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const el = document.activeElement; if (/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName) || el?.isContentEditable || document.querySelector('dialog[open]')) return;
  if (e.key === '?') { e.preventDefault(); openHelp(); return; }
  if (e.key === 'g') { gAt = Date.now(); return; }
  if (Date.now() - gAt < 900 && GO[e.key]) { gAt = 0; location.href = ROOT + GO[e.key]; }
});
