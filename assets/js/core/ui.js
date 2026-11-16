// Tiện ích giao diện dùng chung: toast, sao chép, đếm số.
let box;
export function toast(msg, ms = 2200) {
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; box.append(t);
  setTimeout(() => t.remove(), ms);
}
export async function copy(text, ok = 'Đã sao chép') {
  try { await navigator.clipboard.writeText(text); toast(ok); }
  catch (e) { const a = document.createElement('textarea'); a.value = text; document.body.append(a); a.select(); try { document.execCommand('copy'); toast(ok); } catch (_) { toast('Không sao chép được'); } a.remove(); }
}
export function countUp(el, to, ms = 900) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.fx === 'off') { el.textContent = to.toLocaleString('vi-VN'); return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min((t - t0) / ms, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('vi-VN'); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
