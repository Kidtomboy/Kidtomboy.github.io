// Header global hiển thị navigation và trạng thái nhạc
class HeaderBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.updateMusicStatus();
    window.addEventListener('music-status', (e) => {
      this.updateMusicStatus(e.detail);
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          backdrop-filter: blur(12px);
          z-index: 1000;
          border-bottom: 1px solid var(--card-border);
        }
        .header-content {
          max-width: var(--max-width);
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
        }
        nav a {
          margin: 0 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          transition: background var(--transition-speed);
        }
        nav a:hover, nav a.active {
          background: var(--accent);
          color: white;
        }
        .music-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        .playing .bar {
          animation: pulse 0.8s infinite;
        }
      </style>
      <header>
        <div class="header-content">
          <a href="/home.html" class="logo">Kidtomboy</a>
          <nav>
            <a href="/home.html">Trang chủ</a>
            <a href="/pages/search.html">Tìm kiếm</a>
            <a href="/pages/project.html">Dự án</a>
            <a href="/pages/support.html">Hỗ trợ</a>
            <a href="/pages/about.html">Giới thiệu</a>
            <a href="/pages/game.html">Thêm ▾</a>
          </nav>
          <div class="music-indicator" id="music-status">
            <span>🔇</span> <span>Không nhạc</span>
          </div>
        </div>
      </header>
    `;
  }

  updateMusicStatus(detail) {
    const el = this.shadowRoot.getElementById('music-status');
    if (detail && detail.playing) {
      el.innerHTML = `<span>🎵</span><span>${detail.title || 'Đang phát'}</span>`;
    } else {
      el.innerHTML = `<span>🔇</span><span>Tắt nhạc</span>`;
    }
  }
}

customElements.define('header-bar', HeaderBar);