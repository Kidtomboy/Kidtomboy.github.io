# Kidtomboy.github.io

Trang cá nhân của **Kidtomboy (Cherry)** — giới thiệu, dự án **Che779**, game, nhạc, việc cần làm và công cụ tìm kiếm. Web tĩnh (HTML/CSS/JS thuần, không cần build), chạy trên GitHub Pages.

## Cấu trúc

```
index.html              Trang chủ (home.html chuyển về đây)
pages/                  Dự án, Game, Nhạc, Việc cần làm, Tìm kiếm, Hỗ trợ, Giới thiệu
games/                  19 game, mỗi game một trang
assets/css/site.css     Toàn bộ giao diện "Cherry" (sáng/tối), một file duy nhất
assets/js/core/         theme.js (sáng/tối), storage, audio, devMode…
assets/js/components/   shell.js (header, menu di động, footer, đăng ký service worker)
assets/js/pages/        Logic từng trang
assets/js/games/        Logic game (lớp cơ sở + từng game)
sw.js  manifest.json    PWA (mạng trước, lỗi mạng dùng bản lưu)
```

## Chạy thử trên máy

```bash
python3 -m http.server 8000   # rồi mở http://localhost:8000
```

Cần chạy qua máy chủ (không mở thẳng file) vì dùng ES module và service worker.

## Ghi chú

- Giao diện sáng/tối theo hệ thống, đổi tay bằng nút trên header; lựa chọn được nhớ lại.
- Dữ liệu (việc cần làm, điểm cao, playlist) lưu trong trình duyệt của người dùng, không gửi đi đâu.
- Trang **Dự án** lấy repo công khai từ GitHub API (có thể bị giới hạn lượt gọi; khi đó hiện liên kết sang GitHub).
- `config/secrets.js` chứa mật khẩu chế độ nhà phát triển **nằm ngay trong mã phía trình duyệt**, ai cũng đọc được: chỉ dùng cho tính năng thử nghiệm của game, không bảo vệ dữ liệu nào.
