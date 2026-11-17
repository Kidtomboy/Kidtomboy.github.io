// Blog nhỏ: bài viết nằm sẵn trong file này, hiển thị theo #slug.
import { md, esc } from '../core/md.js';
const POSTS = [
  { id: 'sha256', date: '2026-11-17', title: 'Vì sao mỗi bản phát hành có SHA256SUMS.txt', body: `Mỗi release của Che779 đều có một file tên **SHA256SUMS.txt**, và nó luôn là file cuối cùng được tải lên.

File này liệt kê mã SHA-256 của từng file trong release. Sau khi tải về, bạn tính SHA-256 của file mình có và so với mã trong danh sách. Hai mã giống nhau nghĩa là file không bị hỏng hay bị thay đổi trên đường tải.

## Cách kiểm tra

- Trên Windows (PowerShell): \`Get-FileHash .\\ten-file -Algorithm SHA256\`
- Trên Linux hoặc Termux: \`sha256sum -c SHA256SUMS.txt\`
- Không muốn gõ lệnh: dùng trang [Kiểm tra SHA-256](https://kidtomboy.github.io/pages/verify.html), chọn file và dán nội dung SHA256SUMS.txt vào.

Việc này chỉ cho biết file khớp với danh sách. Nó không thay thế việc tải từ đúng trang Releases của repo.` },
  { id: 'bon-repo', date: '2026-11-17', title: 'Che779 gồm 4 repo, mỗi repo làm gì', body: `Che779 là bộ giả lập J2ME, và được chia thành 4 repo cho dễ bảo trì.

- **Che779-Emulator** (Windows): Emulator V1 cùng Remoter, mỗi game một cửa sổ.
- **Che779-EmulatorV2** (Windows): Emulator V2, nhiều tab trong một cửa sổ.
- **Che779-Linux**: gói .deb và .tar.gz gồm V2, V1 và Remoter Linux.
- **Che779-Android**: APK, APK clone và script Termux chạy V2.

Hai repo Linux và Android không sao chép mã của repo Windows. Chúng ghim một phiên bản cụ thể (\`EMULATOR_V1_REF\`, \`EMULATOR_V2_REF\`), nên mỗi bản phát hành biết chính xác nó được dựng từ mã nào.

Xem sơ đồ đầy đủ ở trang [Hệ sinh thái](https://kidtomboy.github.io/pages/ecosystem.html).` },
  { id: 'viet-lai-web', date: '2026-11-17', title: 'Mình viết lại trang web này như thế nào', body: `Bản cũ của trang này đã lâu rồi, nên mình dựng lại từ đầu.

- Không dùng framework. Chỉ HTML, một file CSS dùng chung và JavaScript module.
- Giao diện tối kiểu terminal, có thể đổi màu nhấn và tắt hiệu ứng trong Cài đặt.
- Giữ lại 19 game mình tự viết trước đây, chỉ đổi giao diện cho hợp tổng thể.
- Các công cụ (Base64, hash, JSON, regex…) chạy hoàn toàn trong trình duyệt, không gửi dữ liệu đi đâu.
- Trang Che779 và trang Hành trình lấy dữ liệu trực tiếp từ GitHub, nên luôn khớp với bản phát hành mới nhất.

Những gì chưa kiểm tra kỹ được ghi thẳng ở trang [Trạng thái](https://kidtomboy.github.io/pages/status.html).` }
];
const list = document.getElementById('b-list'), post = document.getElementById('b-post'), back = document.getElementById('b-back');
const fmt = d => new Date(d).toLocaleDateString('vi-VN');
function route() {
  const p = POSTS.find(x => x.id === location.hash.slice(1));
  list.hidden = !!p; post.hidden = !p; back.hidden = !p;
  if (p) { post.innerHTML = `<h1>${esc(p.title)}</h1><p class="muted">${fmt(p.date)}</p>` + md(p.body); document.title = p.title + ' · Kidtomboy'; scrollTo(0, 0); }
  else document.title = 'Blog · Kidtomboy';
}
list.innerHTML = POSTS.map(p => `<a class="card lift" href="#${p.id}"><span class="muted">${fmt(p.date)}</span><h2>${esc(p.title)}</h2><p class="muted">${esc(p.body.split('\n')[0].replace(/\*\*/g, ''))}</p></a>`).join('');
addEventListener('hashchange', route); route();
