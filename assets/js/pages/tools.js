// Công cụ chạy hoàn toàn trong trình duyệt, không gửi dữ liệu đi đâu.
import { toast, copy } from '../core/ui.js';
import { esc } from '../core/md.js';

const $ = (s, r = document) => r.querySelector(s);
const enc = new TextEncoder(), dec = new TextDecoder();
const ta = (id, ph, rows = 6) => `<textarea id="${id}" rows="${rows}" placeholder="${ph}" spellcheck="false"></textarea>`;
const out = id => `<div class="out-wrap"><pre class="code out" id="${id}"></pre><button type="button" class="btn ghost cp" data-c="${id}">Sao chép</button></div>`;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const b64 = bytes => btoa(String.fromCharCode(...bytes));

const TOOLS = [
  { id: 'b64', name: 'Base64', html: () => `${ta('b-in', 'Nhập văn bản hoặc chuỗi Base64')}<div class="controls-row"><button class="btn" id="b-e">Mã hóa</button><button class="btn ghost" id="b-d">Giải mã</button></div>${out('b-out')}`,
    init() { const i = $('#b-in'), o = $('#b-out');
      $('#b-e').onclick = () => { o.textContent = b64(enc.encode(i.value)); };
      $('#b-d').onclick = () => { try { o.textContent = dec.decode(Uint8Array.from(atob(i.value.trim()), c => c.charCodeAt(0))); } catch (e) { o.textContent = 'Chuỗi Base64 không hợp lệ'; } }; } },
  { id: 'url', name: 'URL', html: () => `${ta('u-in', 'Nhập văn bản hoặc URL', 4)}<div class="controls-row"><button class="btn" id="u-e">Encode</button><button class="btn ghost" id="u-d">Decode</button></div>${out('u-out')}`,
    init() { const i = $('#u-in'), o = $('#u-out');
      $('#u-e').onclick = () => { o.textContent = encodeURIComponent(i.value); };
      $('#u-d').onclick = () => { try { o.textContent = decodeURIComponent(i.value); } catch (e) { o.textContent = 'Chuỗi không hợp lệ'; } }; } },
  { id: 'hash', name: 'Hash', html: () => `${ta('h-in', 'Nhập văn bản (hoặc chọn file bên dưới)', 4)}<div class="controls-row"><select id="h-alg"><option>SHA-256</option><option>SHA-1</option><option>SHA-384</option><option>SHA-512</option></select><input type="file" id="h-file"></div><p class="muted">Tính trực tiếp trên máy bạn bằng Web Crypto. Dùng để đối chiếu với <code>SHA256SUMS.txt</code> của Che779.</p>${out('h-out')}`,
    init() { const o = $('#h-out'), alg = () => $('#h-alg').value;
      const run = async buf => { o.textContent = hex(await crypto.subtle.digest(alg(), buf)); };
      $('#h-in').oninput = () => run(enc.encode($('#h-in').value));
      $('#h-alg').onchange = () => { const f = $('#h-file').files[0]; f ? f.arrayBuffer().then(run) : run(enc.encode($('#h-in').value)); };
      $('#h-file').onchange = async e => { const f = e.target.files[0]; if (f) { o.textContent = 'Đang tính…'; await run(await f.arrayBuffer()); toast('Xong: ' + f.name); } };
      run(enc.encode('')); } },
  { id: 'json', name: 'JSON', html: () => `${ta('j-in', '{"ví dụ": [1, 2, 3]}', 8)}<div class="controls-row"><button class="btn" id="j-f">Làm đẹp</button><button class="btn ghost" id="j-m">Rút gọn</button></div>${out('j-out')}`,
    init() { const i = $('#j-in'), o = $('#j-out');
      const go = sp => { try { o.textContent = JSON.stringify(JSON.parse(i.value), null, sp); } catch (e) { o.textContent = 'Lỗi JSON: ' + e.message; } };
      $('#j-f').onclick = () => go(2); $('#j-m').onclick = () => go(0); } },
  { id: 'pw', name: 'Mật khẩu & UUID', html: () => `<div class="controls-row"><label>Độ dài <input type="number" id="p-len" value="20" min="6" max="128" style="width:80px"></label><label><input type="checkbox" id="p-sym" checked> Ký hiệu</label><button class="btn" id="p-go">Tạo mật khẩu</button><button class="btn ghost" id="p-uuid">Tạo UUID</button></div>${out('p-out')}<p class="muted">Dùng bộ sinh số ngẫu nhiên mật mã của trình duyệt (crypto.getRandomValues).</p>`,
    init() { const o = $('#p-out');
      $('#p-go').onclick = () => { const set = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' + ($('#p-sym').checked ? '!@#$%^&*-_=+?' : ''); const n = Math.min(128, Math.max(6, +$('#p-len').value || 20)); const r = new Uint32Array(n); crypto.getRandomValues(r); o.textContent = [...r].map(x => set[x % set.length]).join(''); };
      $('#p-uuid').onclick = () => { o.textContent = crypto.randomUUID(); }; $('#p-go').click(); } },
  { id: 'ts', name: 'Thời gian', html: () => `<div class="controls-row"><input type="text" id="t-in" placeholder="Unix timestamp (giây/ms) hoặc ngày, ví dụ 2026-11-16 12:00" style="flex:1"><button class="btn" id="t-go">Chuyển</button><button class="btn ghost" id="t-now">Bây giờ</button></div>${out('t-out')}`,
    init() { const o = $('#t-out'); const show = d => { o.textContent = isNaN(d) ? 'Không hiểu giá trị này' : `Unix (giây): ${Math.floor(d / 1000)}\nUnix (ms):   ${d.getTime()}\nISO (UTC):   ${d.toISOString()}\nCục bộ:      ${d.toLocaleString('vi-VN')}`; };
      const parse = v => { v = v.trim(); if (/^\d{9,10}$/.test(v)) return new Date(+v * 1000); if (/^\d{12,13}$/.test(v)) return new Date(+v); return new Date(v); };
      $('#t-go').onclick = () => show(parse($('#t-in').value)); $('#t-now').onclick = () => { $('#t-in').value = ''; show(new Date()); }; show(new Date()); } },
  { id: 'color', name: 'Màu', html: () => `<div class="controls-row"><input type="color" id="c-pick" value="#00ff9c" style="width:64px;height:44px;padding:2px"><input type="text" id="c-in" value="#00ff9c" style="flex:1" aria-label="Mã màu hex"></div><div id="c-sw" class="swatch-big"></div>${out('c-out')}`,
    init() { const o = $('#c-out'), sw = $('#c-sw');
      const apply = h => { if (!/^#?[0-9a-f]{6}$/i.test(h.trim())) { o.textContent = 'Nhập mã hex 6 ký tự, ví dụ #00ff9c'; return; } h = '#' + h.trim().replace('#', '');
        const [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2, d = mx - mn;
        const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); let hh = 0; if (d) { hh = mx === r / 255 ? ((g - b) / 255 / d) % 6 : mx === g / 255 ? (b - r) / 255 / d + 2 : (r - g) / 255 / d + 4; hh = Math.round(((hh * 60) + 360) % 360); }
        sw.style.background = h; $('#c-pick').value = h; o.textContent = `HEX  ${h.toUpperCase()}\nRGB  rgb(${r}, ${g}, ${b})\nHSL  hsl(${hh}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`; };
      $('#c-in').oninput = e => apply(e.target.value); $('#c-pick').oninput = e => { $('#c-in').value = e.target.value; apply(e.target.value); }; apply('#00ff9c'); } },
  { id: 're', name: 'Regex', html: () => `<div class="controls-row"><input type="text" id="r-p" placeholder="Biểu thức, ví dụ (\\d+)-(\\w+)" style="flex:1"><input type="text" id="r-f" value="g" style="width:70px" aria-label="Cờ"></div>${ta('r-t', 'Văn bản kiểm tra', 5)}<div id="r-out" class="card md" style="min-height:90px"></div>`,
    init() { const run = () => { const o = $('#r-out'); const p = $('#r-p').value; if (!p) { o.textContent = 'Nhập biểu thức để thử.'; return; }
      try { const re = new RegExp(p, $('#r-f').value), t = $('#r-t').value; const ms = [...(re.global ? t.matchAll(re) : [t.match(re)].filter(Boolean))];
        o.innerHTML = `<p><b>${ms.length}</b> kết quả</p>` + ms.slice(0, 50).map(m => `<p><code>${esc(m[0])}</code> tại ${m.index}${m.length > 1 ? ' · nhóm: ' + m.slice(1).map(x => `<code>${esc(String(x))}</code>`).join(' ') : ''}</p>`).join(''); }
      catch (e) { o.textContent = 'Biểu thức lỗi: ' + e.message; } };
      ['#r-p', '#r-f', '#r-t'].forEach(s => { $(s).oninput = run; }); run(); } },
  { id: 'txt', name: 'Đếm chữ', html: () => `${ta('x-in', 'Dán văn bản vào đây', 8)}<div class="stats" id="x-out"></div>`,
    init() { const run = () => { const t = $('#x-in').value; const w = (t.trim().match(/\S+/g) || []).length;
      $('#x-out').innerHTML = [[t.length, 'ký tự'], [t.replace(/\s/g, '').length, 'không tính khoảng trắng'], [w, 'từ'], [t ? t.split(/\n/).length : 0, 'dòng'], [Math.max(0, Math.ceil(w / 200)), 'phút đọc']].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join(''); };
      $('#x-in').oninput = run; run(); } },
  { id: 'pomo', name: 'Pomodoro', html: () => `<div class="pomo"><div class="pomo-time" id="pm-t">25:00</div><p class="muted" id="pm-s">Tập trung 25 phút, nghỉ 5 phút.</p><div class="controls-row" style="justify-content:center"><button class="btn" id="pm-go">Bắt đầu</button><button class="btn ghost" id="pm-rs">Đặt lại</button><button class="btn ghost" id="pm-mode">Chế độ: Làm việc</button></div></div>`,
    init() { let work = true, left = 1500, timer = 0;
      const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      const paint = () => { $('#pm-t').textContent = fmt(left); document.title = timer ? fmt(left) + ' · Pomodoro' : 'Công cụ · Kidtomboy'; };
      const stop = () => { clearInterval(timer); timer = 0; $('#pm-go').textContent = 'Bắt đầu'; };
      const reset = () => { stop(); left = work ? 1500 : 300; paint(); };
      $('#pm-go').onclick = () => { if (timer) { stop(); paint(); return; } $('#pm-go').textContent = 'Tạm dừng'; timer = setInterval(() => { left--; paint(); if (left <= 0) { stop(); toast(work ? 'Hết giờ làm việc, nghỉ thôi!' : 'Hết giờ nghỉ, quay lại nào!', 4000); try { navigator.vibrate?.(300); } catch (e) { /* bỏ qua */ } work = !work; $('#pm-mode').textContent = 'Chế độ: ' + (work ? 'Làm việc' : 'Nghỉ'); reset(); } }, 1000); };
      $('#pm-rs').onclick = reset; $('#pm-mode').onclick = () => { work = !work; $('#pm-mode').textContent = 'Chế độ: ' + (work ? 'Làm việc' : 'Nghỉ'); reset(); }; paint(); } }
];

const tabs = $('#tabs'), panel = $('#panel');
function open(id) {
  const t = TOOLS.find(x => x.id === id) || TOOLS[0];
  tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === t.id)));
  panel.innerHTML = t.html(); t.init();
  panel.querySelectorAll('.cp').forEach(b => { b.onclick = () => copy($('#' + b.dataset.c).textContent); });
  history.replaceState(null, '', '#' + t.id);
}
tabs.innerHTML = TOOLS.map(t => `<button type="button" data-id="${t.id}" aria-pressed="false">${t.name}</button>`).join('');
tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) open(b.dataset.id); });
open(location.hash.slice(1));
