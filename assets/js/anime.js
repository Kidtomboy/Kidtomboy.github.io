// Anime Manager Class
class AnimeManager {
    constructor() {
        this.animeData = [];
        this.filteredAnime = [];
        this.init();
    }

    async init() {
        await this.loadAnimeData();
        this.renderAnimeList();
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.setupMenu();
    }

    async loadAnimeData() {
        try {
            const response = await fetch('../assets/data/animes/anime.csv');
            const csvData = await response.text();
            this.parseCSV(csvData);
        } catch (error) {
            console.error('Error loading anime data:', error);
        }
    }

    parseCSV(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Nhóm các tập phim theo tên anime
        const animeMap = new Map();
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const anime = {};
            
            for (let j = 0; j < headers.length; j++) {
                anime[headers[j]] = values[j] ? values[j].trim().replace(/^"|"$/g, '') : '';
            }
            
            if (!animeMap.has(anime.name)) {
                animeMap.set(anime.name, {
                    name: anime.name,
                    episodes: []
                });
            }
            
            animeMap.get(anime.name).episodes.push({
                episode: anime.episodes,
                link: anime.link
            });
        }
        
        this.animeData = Array.from(animeMap.values());
        this.filteredAnime = [...this.animeData];
        
        // Sắp xếp anime theo tên
        this.animeData.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredAnime.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderAnimeList() {
        const animeList = document.getElementById('anime-list');
        animeList.innerHTML = '';
        
        if (this.filteredAnime.length === 0) {
            animeList.innerHTML = '<div class="no-results">Không tìm thấy anime nào phù hợp</div>';
            return;
        }
        
        this.filteredAnime.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'anime-card';
            
            const animeHeader = document.createElement('div');
            animeHeader.className = 'anime-header';
            animeHeader.innerHTML = `
                <div class="anime-title">
                    <i class="fas fa-film"></i>
                    ${anime.name}
                </div>
                <div class="episode-count">${anime.episodes.length} tập</div>
            `;
            
            const episodesList = document.createElement('div');
            episodesList.className = 'episodes-list';
            
            // Sắp xếp các tập theo số tập (tách số từ chuỗi)
            anime.episodes.sort((a, b) => {
                const numA = parseInt(a.episode.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.episode.match(/\d+/)?.[0] || '0');
                return numB - numB; // Sắp xếp từ tập mới nhất
            });
            
            anime.episodes.forEach(ep => {
                const episodeCard = document.createElement('div');
                episodeCard.className = 'episode-card';
                
                if (ep.link && !ep.link.includes('Không tìm thấy')) {
                    episodeCard.innerHTML = `
                        <a href="${ep.link}" target="_blank" rel="noopener noreferrer">
                            <span class="episode-number">Tập ${ep.episode}</span>
                            <span class="episode-link">Xem ngay <i class="fas fa-external-link-alt"></i></span>
                        </a>
                    `;
                } else {
                    episodeCard.innerHTML = `
                        <div>
                            <span class="episode-number">Tập ${ep.episode}</span>
                            <span class="no-link">(Chưa có link)</span>
                        </div>
                    `;
                }
                
                episodesList.appendChild(episodeCard);
            });
            
            animeCard.appendChild(animeHeader);
            animeCard.appendChild(episodesList);
            animeList.appendChild(animeCard);
        });
    }

    filterAnime(searchTerm) {
        if (!searchTerm) {
            this.filteredAnime = [...this.animeData];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredAnime = this.animeData.filter(anime => 
                anime.name.toLowerCase().includes(term) ||
                anime.episodes.some(ep => ep.episode.toLowerCase().includes(term))
        }
        
        this.renderAnimeList();
    }

    setupEventListeners() {
        // Tìm kiếm anime
        document.getElementById('search-btn').addEventListener('click', () => {
            const searchTerm = document.getElementById('anime-search').value;
            this.filterAnime(searchTerm);
        });
        
        document.getElementById('anime-search').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = document.getElementById('anime-search').value;
                this.filterAnime(searchTerm);
            }
        });
    }

    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');
        
        timeElement.textContent = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        dateElement.textContent = now.toLocaleDateString('vi-VN', {
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

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new AnimeManager();
});