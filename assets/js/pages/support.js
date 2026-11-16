// Trang Hỗ trợ: câu hỏi thường gặp
const faqData = [
  { q: 'Che779 là gì?', a: 'Bộ giả lập game Java (J2ME) cho Windows, Linux và Android. Bốn repo: Che779-Emulator, Che779-EmulatorV2, Che779-Linux, Che779-Android.' },
  { q: 'Nên chọn V1 hay V2?', a: 'V1 (kèm Remoter) cho mỗi game một cửa sổ riêng, cách ly tốt nhưng tốn RAM. V2 gom nhiều tab vào một cửa sổ, nhẹ hơn; đổi lại lỗi nặng có thể ảnh hưởng cả cửa sổ.' },
  { q: 'Tải bản chính thức ở đâu, kiểm tra thế nào?', a: 'Ở mục Releases của từng repo. Mỗi bản có SHA256SUMS.txt; kiểm tra bằng "sha256sum -c SHA256SUMS.txt" (Linux) hoặc Get-FileHash (Windows PowerShell).' },
  { q: 'Báo lỗi thế nào?', a: 'Mở Issue ở repo tương ứng, ghi phiên bản, hệ điều hành, phiên bản Java và đính kèm file log (xóa mật khẩu proxy trước khi gửi).' },
  { q: 'Trang này có mã nguồn mở không?', a: 'Có, mã nguồn nằm trong repo Kidtomboy.github.io trên GitHub.' }
];
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
document.getElementById('faq').innerHTML = faqData.map(i => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('');
