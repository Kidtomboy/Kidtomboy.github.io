# Kidtomboy.github.io

Trang cá nhân của **Kidtomboy (Cherry)** — giới thiệu, dự án **Che779**, game, nhạc, việc cần làm và công cụ tìm kiếm. Web tĩnh (HTML/CSS/JS thuần, không cần build), chạy trên GitHub Pages.

## Cấu trúc

```
index.html              Trang chủ (home.html chuyển về đây)
404.html  sitemap.xml  robots.txt
pages/                  Che779 (bản phát hành lấy từ GitHub), Dự án, Game, Terminal, Nhạc, Việc, Tìm kiếm, Hỗ trợ, Giới thiệu
games/                  19 game, mỗi game một trang
assets/css/site.css     Toàn bộ giao diện "Cherry" (sáng/tối), một file duy nhất
assets/js/core/         theme.js (sáng/tối), storage, audio, devMode…
assets/js/components/   shell.js (header, footer, service worker), palette.js (Ctrl+K), matrix.js (nền trang chủ)
assets/js/pages/        Logic từng trang
assets/js/games/        Logic game (lớp cơ sở + từng game)
sw.js  manifest.json    PWA (mạng trước, lỗi mạng dùng bản lưu)
```

## Chạy thử trên máy

```bash
python3 -m http.server 8000   # rồi mở http://localhost:8000
```

Cần chạy qua máy chủ (không mở thẳng file) vì dùng ES module và service worker.

## Tính năng nổi bật

- **Che779**: trang tải bản phát hành mới nhất của 4 repo, lấy trực tiếp từ GitHub API (có nhớ tạm 10 phút, timeout 8 giây), tự gợi ý theo thiết bị.
- **Terminal** tương tác (`help`, `che779`, `projects`, `neofetch`, `open`, `theme`…), Tab gợi ý, ↑/↓ lịch sử.
- **Command palette**: `Ctrl/⌘ + K` hoặc `/` để nhảy tới trang, game, repo.
- Nền mưa ký tự ở trang chủ (tự tắt khi bật "giảm chuyển động" hoặc ẩn tab).
- SEO/PWA: sitemap, robots, Open Graph, JSON-LD, trang 404, hoạt động offline cơ bản.
- `assets/js/core/site-data.js` là danh sách trang/game/repo dùng chung; thêm game mới thì cập nhật file này.

## Ghi chú

- Giao diện sáng/tối theo hệ thống, đổi tay bằng nút trên header; lựa chọn được nhớ lại.
- Dữ liệu (việc cần làm, điểm cao, playlist) lưu trong trình duyệt của người dùng, không gửi đi đâu.
- Trang **Dự án** lấy repo công khai từ GitHub API (có thể bị giới hạn lượt gọi; khi đó hiện liên kết sang GitHub).
- `config/secrets.js` chứa mật khẩu chế độ nhà phát triển **nằm ngay trong mã phía trình duyệt**, ai cũng đọc được: chỉ dùng cho tính năng thử nghiệm của game, không bảo vệ dữ liệu nào.
