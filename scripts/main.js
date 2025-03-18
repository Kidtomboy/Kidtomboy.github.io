// Hiệu ứng slideshow ảnh nền
const slides = document.querySelectorAll('.slideshow img');
let currentSlide = 0;

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

document.querySelector('.next-slide').addEventListener('click', nextSlide);
document.querySelector('.prev-slide').addEventListener('click', prevSlide);

setInterval(nextSlide, 5000);

// Hiệu ứng nút lên đầu trang
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Hiệu ứng trích dẫn
const quotes = document.querySelectorAll('.quote');
let currentQuote = 0;

function showQuote(index) {
    quotes.forEach((quote, i) => {
        quote.classList.toggle('active', i === index);
    });
}

function nextQuote() {
    currentQuote = (currentQuote + 1) % quotes.length;
    showQuote(currentQuote);
}

function prevQuote() {
    currentQuote = (currentQuote - 1 + quotes.length) % quotes.length;
    showQuote(currentQuote);
}

document.querySelector('.next-quote').addEventListener('click', nextQuote);
document.querySelector('.prev-quote').addEventListener('click', prevQuote);

setInterval(nextQuote, 7000);

// Chuyển hướng đến GitHub khi click vào dự án
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
        const githubLink = card.getAttribute('data-github');
        if (githubLink) {
            window.open(githubLink, '_blank');
        }
    });
});

// Hàm phát hiện thiết bị di động
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
if (isMobileDevice()) {
    document.body.classList.add('mobile-view');
}