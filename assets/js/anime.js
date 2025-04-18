class AnimeViewer {
    constructor() {
        this.animeData = [];
        this.filteredAnime = [];
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadAnimeData();
        this.renderAnimeList();
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.setupMenu();
    }

    showLoading() {
        const animeList = document.getElementById('anime-list');
        animeList.innerHTML = `
            <div class="loading-anime">
                <i class="fas fa-spinner fa-spin"></i> Đang tải danh sách anime...
            </div>
        `;
    }

    async loadAnimeData() {
        try {
            // Đường dẫn đúng đến file CSV
            const response = await fetch('../assets/data/animes/anime.csv');
            if (!response.ok) throw new Error('Không tải được file CSV');
            
            const csvData = await response.text();
            this.parseCSV(csvData);
        } catch (error) {
            console.error('Error loading anime data:', error);
            this.showError('Lỗi khi tải dữ liệu anime. Vui lòng thử lại sau.');
        }
    }

    parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            this.showError('File CSV không có dữ liệu');
            return;
        }

        // Bỏ header
        lines.shift();

        const animeMap = new Map();
        
        for (const line of lines) {
            try {
                const [name, episode, link] = this.parseCSVLine(line);
                if (!name) continue;

                const anime = {
                    name: name.trim(),
                    episode: episode?.trim() || '',
                    link: link?.trim() || ''
                };

                if (!animeMap.has(anime.name)) {
                    animeMap.set(anime.name, []);
                }
                animeMap.get(anime.name).push(anime);
            } catch (e) {
                console.error('Error parsing line:', line, e);
            }
        }

        this.animeData = Array.from(animeMap.entries()).map(([name, episodes]) => ({
            name,
            episodes: episodes.sort((a, b) => {
                const numA = parseInt(a.episode.match(/\d+/)?.[0] || 0);
                const numB = parseInt(b.episode.match(/\d+/)?.[0] || 0);
                return numB - numA; // Mới nhất lên đầu
            })
        }));

        this.filteredAnime = [...this.animeData];
    }

    parseCSVLine(line) {
        // Xử lý trường hợp có dấu phẩy trong trường dữ liệu
        const result = [];
        let inQuotes = false;
        let currentField = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        result.push(currentField);
        return result;
    }

    isValidUrl(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    renderAnimeList() {
        const animeList = document.getElementById('anime-list');
        
        if (!this.filteredAnime.length) {
            animeList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i> Không tìm thấy anime phù hợp
                </div>
            `;
            return;
        }
        
        animeList.innerHTML = this.filteredAnime.map(anime => `
            <div class="anime-item">
                <div class="anime-header">
                    <div class="anime-title">
                        <i class="fas fa-film"></i> ${anime.name}
                    </div>
                    <div class="episode-count">
                        ${anime.episodes.length} ${anime.episodes.length === 1 ? 'tập' : 'tập'}
                    </div>
                </div>
                <div class="episodes-list">
                    ${anime.episodes.map(ep => `
                        <div class="episode-item">
                            <div class="episode-info">
                                <span class="episode-name">Tập ${ep.episode}</span>
                                ${this.renderLink(ep.link)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        // Thêm sự kiện click để mở rộng thu gọn
        document.querySelectorAll('.anime-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('expanded');
            });
        });
    }

    renderLink(link) {
        if (this.isValidUrl(link)) {
            return `
                <a href="${link}" target="_blank" class="episode-link" onclick="event.stopPropagation()">
                    <i class="fas fa-play"></i> Xem ngay
                </a>
            `;
        } else {
            const message = link.includes('Không tìm thấy') ? link : 'Chưa có link';
            return `
                <span class="episode-link disabled">
                    <i class="fas fa-clock"></i> ${message}
                </span>
            `;
        }
    }

    filterAnime(searchTerm) {
        const term = searchTerm?.toLowerCase() || '';
        this.filteredAnime = this.animeData.filter(anime => 
            anime.name.toLowerCase().includes(term) ||
            anime.episodes.some(ep => 
                ep.episode.toLowerCase().includes(term)
            )
        );
        this.renderAnimeList();
    }

    showError(message) {
        const animeList = document.getElementById('anime-list');
        animeList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
    }

    setupEventListeners() {
        // Tìm kiếm khi nhập
        document.getElementById('anime-search').addEventListener('input', (e) => {
            this.filterAnime(e.target.value);
        });
        
        // Tìm kiếm khi nhấn nút
        document.getElementById('search-btn').addEventListener('click', () => {
            const searchInput = document.getElementById('anime-search');
            this.filterAnime(searchInput.value);
        });
        
        // Tìm kiếm khi nhấn Enter
        document.getElementById('anime-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filterAnime(e.target.value);
            }
        });
    }

    updateTime() {
        const now = new Date();
        document.getElementById('time').textContent = now.toLocaleTimeString('vi-VN');
        document.getElementById('date').textContent = now.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
        document.getElementById('year').textContent = now.getFullYear();
    }

    setupMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const menu = document.getElementById('menu');
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);

        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            menu.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

// Khởi tạo khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    new AnimeViewer();
});