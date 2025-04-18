// Music Player Class
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSong = null;
        this.isPlaying = false;
        this.shuffleMode = false;
        this.repeatMode = false;
        this.volume = 0.8;
        this.youtubePlayer = null;
        this.soundcloudWidget = null;
        this.playlists = {
            local: [],
            youtube: [],
            soundcloud: []
        };
        
        this.initElements();
        this.initEvents();
        this.loadLocalMusic();
        this.loadFromLocalStorage();
        this.loadYouTubeAPI();
        this.loadSoundCloudAPI();
    }
    
    initElements() {
        this.elements = {
            playBtn: document.getElementById('play-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            backwardBtn: document.getElementById('backward-btn'),
            forwardBtn: document.getElementById('forward-btn'),
            shuffleBtn: document.getElementById('shuffle-btn'),
            repeatBtn: document.getElementById('repeat-btn'),
            volumeSlider: document.getElementById('volume-slider'),
            songTitle: document.getElementById('song-title'),
            songArtist: document.getElementById('song-artist'),
            songProgress: document.getElementById('song-progress'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),
            playlists: {
                local: document.querySelector('#local-tab .playlist'),
                youtube: document.getElementById('youtube-playlist'),
                soundcloud: document.getElementById('soundcloud-playlist')
            },
            tabContents: document.querySelectorAll('.tab-content'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            youtubeInput: document.getElementById('youtube-url'),
            soundcloudInput: document.getElementById('soundcloud-url'),
            addYoutubeBtn: document.getElementById('add-youtube'),
            addSoundcloudBtn: document.getElementById('add-soundcloud'),
            playerContainer: document.querySelector('.music-player')
        };
    }
    
    initEvents() {
        // Player controls
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.prevSong());
        this.elements.nextBtn.addEventListener('click', () => this.nextSong());
        this.elements.backwardBtn.addEventListener('click', () => this.seek(-10));
        this.elements.forwardBtn.addEventListener('click', () => this.seek(10));
        this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Volume control
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.setVolume(this.volume);
        });
        
        // Progress bar (for local files)
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        
        // Tab switching
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Add music from URLs
        this.elements.addYoutubeBtn.addEventListener('click', () => this.addFromUrl('youtube'));
        this.elements.addSoundcloudBtn.addEventListener('click', () => this.addFromUrl('soundcloud'));
        
        // Allow adding with Enter key
        this.elements.youtubeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFromUrl('youtube');
        });
        this.elements.soundcloudInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFromUrl('soundcloud');
        });
    }
    
    loadYouTubeAPI() {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }
    
    loadSoundCloudAPI() {
        if (!window.SC) {
            const script = document.createElement('script');
            script.src = "https://w.soundcloud.com/player/api.js";
            document.body.appendChild(script);
        }
    }
    
    switchTab(tabName) {
        // Update active tab button
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab content
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }
    
    loadLocalMusic() {
        // Load local music from playlist items
        const localItems = document.querySelectorAll('#local-tab .playlist-item');
        localItems.forEach(item => {
            const song = {
                id: `local-${Date.now()}`,
                title: item.querySelector('span').textContent,
                src: item.dataset.src,
                type: 'local',
                element: item
            };
            this.playlists.local.push(song);
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-song')) {
                    this.playSong(song);
                }
            });
            
            item.querySelector('.delete-song').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeSong(song.id, 'local');
                item.remove();
            });
        });
    }
    
    addFromUrl(platform) {
        const input = this.elements[`${platform}Input`];
        const url = input.value.trim();
        
        if (!url) return;
        
        // Basic URL validation
        if (!this.validateUrl(url, platform)) {
            alert(`Vui lòng nhập đúng định dạng URL ${platform}`);
            return;
        }
        
        const songId = `${platform}-${Date.now()}`;
        const song = {
            id: songId,
            title: this.extractTitleFromUrl(url, platform),
            src: url,
            type: platform
        };
        
        // Add to playlist
        this.playlists[platform].push(song);
        this.renderSongInPlaylist(song, platform);
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Clear input
        input.value = '';
    }
    
    validateUrl(url, platform) {
        if (platform === 'youtube') {
            return url.includes('youtube.com/watch') || url.includes('youtu.be/');
        } else if (platform === 'soundcloud') {
            return url.includes('soundcloud.com/');
        }
        return false;
    }
    
    extractTitleFromUrl(url, platform) {
        if (platform === 'youtube') {
            try {
                const urlObj = new URL(url);
                const params = new URLSearchParams(urlObj.search);
                return params.get('v') ? `YouTube Video (${params.get('v')})` : 'YouTube Video';
            } catch {
                return 'YouTube Video';
            }
        } else if (platform === 'soundcloud') {
            const parts = url.split('/');
            return `SoundCloud: ${parts[parts.length - 1].replace(/-/g, ' ')}`;
        }
        return `Bài hát từ ${url.split('/')[2]}`;
    }
    
    renderSongInPlaylist(song, platform) {
        const playlistElement = this.elements.playlists[platform];
        const songElement = document.createElement('div');
        songElement.className = 'playlist-item';
        songElement.dataset.id = song.id;
        songElement.innerHTML = `
            <i class="fab fa-${platform === 'youtube' ? 'youtube' : 'soundcloud'}"></i>
            <span>${song.title}</span>
            <i class="fas fa-trash delete-song"></i>
        `;
        
        songElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-song')) {
                this.playSong(song);
            }
        });
        
        songElement.querySelector('.delete-song').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeSong(song.id, platform);
            songElement.remove();
        });
        
        playlistElement.appendChild(songElement);
        song.element = songElement;
    }
    
    removeSong(songId, platform) {
        this.playlists[platform] = this.playlists[platform].filter(song => song.id !== songId);
        this.saveToLocalStorage();
        
        // If the current song is removed, stop playback
        if (this.currentSong && this.currentSong.id === songId) {
            this.stopCurrentPlayback();
            this.currentSong = null;
            this.isPlaying = false;
            this.elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.elements.songTitle.textContent = 'Chưa chọn bài hát';
            this.elements.songArtist.textContent = 'Nghệ sĩ';
            this.elements.songProgress.value = 0;
            this.elements.currentTime.textContent = '0:00';
            this.elements.totalTime.textContent = '0:00';
        }
    }
    
    playSong(song) {
        // Stop current playback
        this.stopCurrentPlayback();
        
        // Update UI for current playing song
        if (this.currentSong && this.currentSong.element) {
            this.currentSong.element.classList.remove('playing');
        }
        
        song.element.classList.add('playing');
        this.currentSong = song;
        
        // Scroll to the song in playlist
        song.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Set song info
        this.elements.songTitle.textContent = song.title;
        this.elements.songArtist.textContent = `Từ ${song.type}`;
        this.elements.songProgress.value = 0;
        this.elements.currentTime.textContent = '0:00';
        this.elements.totalTime.textContent = '--:--';
        
        // Play based on platform
        switch (song.type) {
            case 'local':
                this.playLocal(song);
                break;
            case 'youtube':
                this.playYouTube(song);
                break;
            case 'soundcloud':
                this.playSoundCloud(song);
                break;
        }
        
        // Update play button
        this.isPlaying = true;
        this.elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        // Set volume
        this.setVolume(this.volume);
    }
    
    stopCurrentPlayback() {
        if (this.currentSong) {
            switch (this.currentSong.type) {
                case 'local':
                    this.audio.pause();
                    this.audio.currentTime = 0;
                    this.audio.src = '';
                    break;
                case 'youtube':
                    if (this.youtubePlayer && this.youtubePlayer.stopVideo) {
                        this.youtubePlayer.stopVideo();
                    }
                    if (this.youtubeProgressInterval) {
                        clearInterval(this.youtubeProgressInterval);
                        this.youtubeProgressInterval = null;
                    }
                    break;
                case 'soundcloud':
                    if (this.soundcloudWidget && this.soundcloudWidget.pause) {
                        this.soundcloudWidget.pause();
                    }
                    break;
            }
        }
    }
    
    playLocal(song) {
        // Remove any embed players
        this.clearEmbedPlayers();
        
        this.audio.src = song.src;
        this.audio.load();
        this.audio.play();
        
        // When metadata is loaded, update duration
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        }, { once: true });
    }
    
    playYouTube(song) {
        this.clearEmbedPlayers();
        
        // Create player container
        const playerContainer = document.createElement('div');
        playerContainer.id = 'youtube-player';
        playerContainer.style.display = 'none';
        this.elements.playerContainer.appendChild(playerContainer);
        
        // Extract video ID
        const videoId = this.extractYouTubeId(song.src);
        if (!videoId) return;
        
        // Initialize YouTube player
        this.youtubePlayer = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0
            },
            events: {
                'onReady': (event) => {
                    event.target.playVideo();
                    this.setupYouTubeProgressTracking();
                },
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        this.handleSongEnd();
                    }
                }
            }
        });
    }
    
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    setupYouTubeProgressTracking() {
        // YouTube API doesn't provide direct progress updates, so we'll use interval
        this.youtubeProgressInterval = setInterval(() => {
            if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
                const currentTime = this.youtubePlayer.getCurrentTime();
                const duration = this.youtubePlayer.getDuration();
                
                if (duration > 0) {
                    const progressPercent = (currentTime / duration) * 100;
                    this.elements.songProgress.value = progressPercent;
                    this.elements.currentTime.textContent = this.formatTime(currentTime);
                    this.elements.totalTime.textContent = this.formatTime(duration);
                }
            }
        }, 1000);
    }
    
    playSoundCloud(song) {
        this.clearEmbedPlayers();
        
        // Create player container
        const playerContainer = document.createElement('div');
        playerContainer.id = 'soundcloud-player';
        this.elements.playerContainer.appendChild(playerContainer);
        
        // Initialize SoundCloud widget
        this.soundcloudWidget = SC.Widget('soundcloud-player');
        this.soundcloudWidget.load(song.src, {
            auto_play: true,
            buying: false,
            liking: false,
            download: false,
            sharing: false,
            show_artwork: false,
            show_comments: false,
            show_playcount: false,
            show_user: false,
            visual: false
        });
        
        // Setup event listeners
        this.soundcloudWidget.bind(SC.Widget.Events.READY, () => {
            this.soundcloudWidget.getDuration((duration) => {
                this.elements.totalTime.textContent = this.formatTime(duration/1000);
            });
            
            this.soundcloudWidget.getCurrentSound((sound) => {
                if (sound) {
                    this.elements.songTitle.textContent = sound.title || this.currentSong.title;
                    this.elements.songArtist.textContent = sound.user?.username || 'SoundCloud';
                }
            });
        });
        
        this.soundcloudWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (progress) => {
            const currentTime = progress.currentPosition / 1000;
            const duration = progress.duration / 1000;
            const progressPercent = (currentTime / duration) * 100;
            
            this.elements.songProgress.value = progressPercent;
            this.elements.currentTime.textContent = this.formatTime(currentTime);
        });
        
        this.soundcloudWidget.bind(SC.Widget.Events.FINISH, () => {
            this.handleSongEnd();
        });
    }
    
    clearEmbedPlayers() {
        // Clear any existing progress intervals
        if (this.youtubeProgressInterval) {
            clearInterval(this.youtubeProgressInterval);
            this.youtubeProgressInterval = null;
        }
        
        // Remove player elements
        document.getElementById('youtube-player')?.remove();
        document.getElementById('soundcloud-player')?.remove();
    }
    
    togglePlay() {
        if (!this.currentSong) {
            // Try to play first song if available
            const firstPlaylist = this.playlists.local.length > 0 ? 'local' :
                                this.playlists.youtube.length > 0 ? 'youtube' :
                                this.playlists.soundcloud.length > 0 ? 'soundcloud' : null;
            
            if (firstPlaylist) {
                this.playSong(this.playlists[firstPlaylist][0]);
            }
            return;
        }
        
        switch (this.currentSong.type) {
            case 'local':
                if (this.isPlaying) {
                    this.audio.pause();
                } else {
                    this.audio.play();
                }
                break;
            case 'youtube':
                if (this.youtubePlayer) {
                    if (this.isPlaying) {
                        this.youtubePlayer.pauseVideo();
                    } else {
                        this.youtubePlayer.playVideo();
                    }
                }
                break;
            case 'soundcloud':
                if (this.soundcloudWidget) {
                    if (this.isPlaying) {
                        this.soundcloudWidget.pause();
                    } else {
                        this.soundcloudWidget.play();
                    }
                }
                break;
        }
        
        this.isPlaying = !this.isPlaying;
        this.elements.playBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
    prevSong() {
        if (!this.currentSong) return;
        
        const currentPlaylist = this.playlists[this.currentSong.type];
        if (currentPlaylist.length === 0) return;
        
        let prevIndex;
        if (this.shuffleMode) {
            prevIndex = Math.floor(Math.random() * currentPlaylist.length);
        } else {
            const currentIndex = currentPlaylist.findIndex(s => s === this.currentSong);
            prevIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        }
        
        this.playSong(currentPlaylist[prevIndex]);
    }
    
    nextSong() {
        if (!this.currentSong) return;
        
        const currentPlaylist = this.playlists[this.currentSong.type];
        if (currentPlaylist.length === 0) return;
        
        let nextIndex;
        if (this.shuffleMode) {
            nextIndex = Math.floor(Math.random() * currentPlaylist.length);
        } else {
            const currentIndex = currentPlaylist.findIndex(s => s === this.currentSong);
            nextIndex = (currentIndex + 1) % currentPlaylist.length;
        }
        
        this.playSong(currentPlaylist[nextIndex]);
    }
    
    seek(seconds) {
        if (!this.currentSong) return;
        
        switch (this.currentSong.type) {
            case 'local':
                this.audio.currentTime = Math.max(0, Math.min(this.audio.currentTime + seconds, this.audio.duration));
                break;
            case 'youtube':
                if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
                    this.youtubePlayer.getCurrentTime().then((currentTime) => {
                        this.youtubePlayer.seekTo(Math.max(0, currentTime + seconds), true);
                    });
                }
                break;
            case 'soundcloud':
                if (this.soundcloudWidget && this.soundcloudWidget.getPosition) {
                    this.soundcloudWidget.getPosition((position) => {
                        this.soundcloudWidget.seekTo(position + (seconds * 1000));
                    });
                }
                break;
        }
    }
    
    toggleShuffle() {
        this.shuffleMode = !this.shuffleMode;
        this.elements.shuffleBtn.classList.toggle('active', this.shuffleMode);
    }
    
    toggleRepeat() {
        this.repeatMode = !this.repeatMode;
        this.elements.repeatBtn.classList.toggle('active', this.repeatMode);
    }
    
    setVolume(volume) {
        this.volume = volume;
        
        switch (this.currentSong?.type) {
            case 'local':
                this.audio.volume = volume;
                break;
            case 'youtube':
                if (this.youtubePlayer && this.youtubePlayer.setVolume) {
                    this.youtubePlayer.setVolume(volume * 100);
                }
                break;
            case 'soundcloud':
                if (this.soundcloudWidget && this.soundcloudWidget.setVolume) {
                    this.soundcloudWidget.setVolume(volume * 100);
                }
                break;
        }
        
        // Update volume slider UI
        this.elements.volumeSlider.value = volume * 100;
    }
    
    handleSongEnd() {
        if (this.repeatMode && this.currentSong) {
            this.playSong(this.currentSong);
        } else {
            this.nextSong();
        }
    }
    
    updateProgress() {
        const { currentTime, duration } = this.audio;
        const progressPercent = (currentTime / duration) * 100;
        this.elements.songProgress.value = progressPercent;
        this.elements.currentTime.textContent = this.formatTime(currentTime);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    saveToLocalStorage() {
        localStorage.setItem('musicPlaylists', JSON.stringify({
            youtube: this.playlists.youtube,
            soundcloud: this.playlists.soundcloud
        }));
    }
    
    loadFromLocalStorage() {
        const savedPlaylists = JSON.parse(localStorage.getItem('musicPlaylists'));
        if (savedPlaylists) {
            if (savedPlaylists.youtube) {
                this.playlists.youtube = savedPlaylists.youtube;
                this.playlists.youtube.forEach(song => this.renderSongInPlaylist(song, 'youtube'));
            }
            if (savedPlaylists.soundcloud) {
                this.playlists.soundcloud = savedPlaylists.soundcloud;
                this.playlists.soundcloud.forEach(song => this.renderSongInPlaylist(song, 'soundcloud'));
            }
        }
    }
}

// Todo List Class
class TodoList {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.initElements();
        this.initEvents();
        this.loadFromLocalStorage();
        this.renderTodos();
    }
    
    initElements() {
        this.elements = {
            todoInput: document.getElementById('todo-input'),
            todoTime: document.getElementById('todo-time'),
            addTodoBtn: document.getElementById('add-todo'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            todoList: document.getElementById('todo-list')
        };
    }
    
    initEvents() {
        this.elements.addTodoBtn.addEventListener('click', () => this.addTodo());
        this.elements.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                this.updateFilterButtons();
                this.renderTodos();
            });
        });
    }
    
    addTodo() {
        const text = this.elements.todoInput.value.trim();
        if (!text) return;
        
        const time = this.elements.todoTime.value;
        
        const todo = {
            id: Date.now(),
            text,
            time,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.renderTodo(todo);
        this.saveToLocalStorage();
        
        this.elements.todoInput.value = '';
    }
    
    renderTodo(todo) {
        if (!this.shouldShowTodo(todo)) return;
        
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoElement.dataset.id = todo.id;
        todoElement.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            ${todo.time ? `<span class="todo-time">${todo.time}</span>` : ''}
            <i class="fas fa-trash delete-todo"></i>
        `;
        
        const checkbox = todoElement.querySelector('input[type="checkbox"]');
        const deleteBtn = todoElement.querySelector('.delete-todo');
        
        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            todoElement.classList.toggle('completed', todo.completed);
            this.saveToLocalStorage();
        });
        
        deleteBtn.addEventListener('click', () => {
            this.removeTodo(todo.id);
            todoElement.remove();
        });
        
        this.elements.todoList.appendChild(todoElement);
    }
    
    renderTodos() {
        this.elements.todoList.innerHTML = '';
        this.todos
            .filter(todo => this.shouldShowTodo(todo))
            .sort((a, b) => {
                // Sort by time if available, then by creation date
                if (a.time && b.time) {
                    return a.time.localeCompare(b.time);
                }
                return new Date(a.createdAt) - new Date(b.createdAt);
            })
            .forEach(todo => this.renderTodo(todo));
    }
    
    shouldShowTodo(todo) {
        switch (this.currentFilter) {
            case 'pending': return !todo.completed;
            case 'completed': return todo.completed;
            default: return true;
        }
    }
    
    updateFilterButtons() {
        this.elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }
    
    removeTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveToLocalStorage();
    }
    
    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    loadFromLocalStorage() {
        const savedTodos = JSON.parse(localStorage.getItem('todos'));
        if (savedTodos) {
            this.todos = savedTodos;
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Time and date
    function updateTime() {
        const now = new Date();
        document.getElementById('time').textContent = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('date').textContent = now.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
        document.getElementById('year').textContent = now.getFullYear();
    }
    
    updateTime();
    setInterval(updateTime, 1000);
    
    // Menu toggle
    function setupMenu() {
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
    
    setupMenu();
    
    // Initialize music player and todo list
    const musicPlayer = new MusicPlayer();
    const todoList = new TodoList();
    
    // Set default volume
    musicPlayer.setVolume(0.8);
});