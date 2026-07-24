// Support Page – FAQ và form liên hệ (demo)

const faqData = [
  { q: 'Làm sao để liên hệ?', a: 'Bạn có thể dùng form bên dưới hoặc email.' },
  { q: 'Dự án này có mã nguồn mở không?', a: 'Có, toàn bộ mã nguồn đều có trên GitHub.' },
  { q: 'Tôi muốn đóng góp game mới?', a: 'Hãy fork repo và tạo pull request.' }
];

function renderFAQ() {
  const faqContainer = document.querySelector('.faq');
  faqContainer.innerHTML = '<h2>Câu hỏi thường gặp</h2>' + faqData.map(item => `
    <details>
      <summary>${item.q}</summary>
      <p>${item.a}</p>
    </details>
  `).join('');
}

document.getElementById('contactForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Cảm ơn bạn! Đây là demo nên không gửi thật.');
  this.reset();
});

renderFAQ();