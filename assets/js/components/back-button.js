class BackButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        .back-btn {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          z-index: 999;
          transition: all var(--transition-speed);
        }
        .back-btn:hover {
          transform: scale(1.1);
        }
      </style>
      <a href="/index.html" class="back-btn" title="Về Trang Chính">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 12l6-6m-6 6 6 6"/>
        </svg>
      </a>
    `;
  }
}

customElements.define('back-button', BackButton);