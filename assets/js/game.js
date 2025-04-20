// Lớp quản lý trò chơi
class GameManager {
    constructor() {
        this.games = [
            {
                id: 'snake',
                title: 'Rắn săn mồi',
                description: 'Điều khiển chú rắn ăn thức ăn và tránh chạm vào tường hoặc chính mình',
                category: 'classic',
                icon: 'fas fa-dragon',
                controls: 'Mũi tên hoặc vuốt màn hình'
            },
            {
                id: 'flappy',
                title: 'Flappy Bird',
                description: 'Điều khiển chú chim bay qua các ống nước mà không bị chạm vào chúng',
                category: 'action',
                icon: 'fas fa-dove',
                controls: 'Nhấn phím cách hoặc chạm màn hình'
            },
            {
                id: 'tictactoe',
                title: 'Caro 3x3',
                description: 'Trò chơi cổ điển X và O, hãy tạo thành 1 hàng ngang, dọc hoặc chéo',
                category: 'puzzle',
                icon: 'fas fa-times-circle',
                controls: 'Nhấn vào ô trống'
            },
            {
                id: 'memory',
                title: 'Trí nhớ siêu phàm',
                description: 'Lật các cặp thẻ giống nhau với số lần ít nhất có thể',
                category: 'puzzle',
                icon: 'fas fa-brain',
                controls: 'Nhấn vào thẻ để lật'
            },
            {
                id: 'pong',
                title: 'Pong Classic',
                description: 'Trò chơi bóng bàn điện tử cổ điển, đánh bóng qua lại',
                category: 'classic',
                icon: 'fas fa-table-tennis',
                controls: 'Di chuyển chuột hoặc vuốt màn hình'
            },
            {
                id: 'dino',
                title: 'Khủng long Chrome',
                description: 'Nhảy qua các chướng ngại vật giống như trò chơi khủng long Chrome',
                category: 'action',
                icon: 'fas fa-running',
                controls: 'Nhấn phím cách hoặc chạm màn hình'
            },
            {
                id: 'game2048',
                title: '2048 Cổ điển',
                description: 'Trượt các ô số để ghép các ô cùng giá trị. Đạt đến 2048 để chiến thắng!',
                category: 'puzzle',
                icon: 'fas fa-th',
                controls: 'Mũi tên hoặc vuốt màn hình'
            },
            {
                id: 'other',
                title: 'Đang phát triển',
                description: 'Tựa game đang phát triển thêm!',
                category: 'other',
                icon: 'fas fa-spinner',
                controls: 'Chưa phát triển'
            }

        ];
        
        this.currentGame = null;
        this.gameInstance = null;
        this.init();
    }

    init() {
        this.renderGames();
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.setupMenu();
    }

    setupEventListeners() {
        // Nút danh mục
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderGames(btn.dataset.category);
            });
        });

        // Nút đóng cửa sổ
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeGame();
        });

        // Nút khởi động lại trò chơi
        document.getElementById('restart-game').addEventListener('click', () => {
            if (this.gameInstance && typeof this.gameInstance.restart === 'function') {
                this.gameInstance.restart();
            }
        });

        // Nút đóng trò chơi
        document.getElementById('close-game').addEventListener('click', () => {
            this.closeGame();
        });

        // Đóng cửa sổ khi nhấp vào bên ngoài
        document.getElementById('game-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('game-modal')) {
                this.closeGame();
            }
        });
    }

    renderGames(category = 'all') {
        const gamesGrid = document.getElementById('games-grid');
        gamesGrid.innerHTML = '';

        const filteredGames = category === 'all' 
            ? this.games 
            : this.games.filter(game => game.category === category);

        if (filteredGames.length === 0) {
            gamesGrid.innerHTML = '<div class="no-games">Không có game nào trong danh mục này</div>';
            return;
        }

        filteredGames.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.dataset.id = game.id;
            
            gameCard.innerHTML = `
                <div class="game-thumbnail">
                    <i class="${game.icon}"></i>
                </div>
                <div class="game-info">
                    <div class="game-title">
                        <i class="${game.icon}"></i>
                        ${game.title}
                    </div>
                    <div class="game-description">${game.description}</div>
                    <div class="game-meta">
                        <span><i class="fas fa-gamepad"></i> ${game.controls}</span>
                        <span><i class="fas fa-tag"></i> ${this.getCategoryName(game.category)}</span>
                    </div>
                </div>
            `;
            
            gameCard.addEventListener('click', () => {
                this.openGame(game.id);
            });
            
            gamesGrid.appendChild(gameCard);
        });
    }

    getCategoryName(category) {
        switch(category) {
            case 'puzzle': return 'Đố vui';
            case 'action': return 'Hành động';
            case 'classic': return 'Cổ điển';
            default: return 'Khác';
        }
    }

    openGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        this.currentGame = game;
        document.getElementById('modal-title').innerHTML = `
            <i class="${game.icon}"></i> ${game.title}
        `;
        
        const gameContainer = document.getElementById('game-container');
        gameContainer.innerHTML = '';
        
        // Khởi tạo trò chơi đã chọn
        switch(gameId) {
            case 'snake':
                this.gameInstance = new SnakeGame(gameContainer);
                break;
            case 'flappy':
                this.gameInstance = new FlappyBird(gameContainer);
                break;
            case 'tictactoe':
                this.gameInstance = new TicTacToe(gameContainer);
                break;
            case 'memory':
                this.gameInstance = new MemoryGame(gameContainer);
                break;
            case 'pong':
                this.gameInstance = new PongGame(gameContainer);
                break;
            case 'dino':
                this.gameInstance = new DinoGame(gameContainer);
                break;
            case 'game2048':
                this.gameInstance = new Game2048(gameContainer);
                break;
            default:
                gameContainer.innerHTML = '<p>Game đang được phát triển</p>';
                this.gameInstance = null;
        }
        
        document.getElementById('game-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeGame() {
        if (this.gameInstance && typeof this.gameInstance.destroy === 'function') {
            this.gameInstance.destroy();
        }
        
        document.getElementById('game-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentGame = null;
        this.gameInstance = null;
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

// Trò chơi con rắn (rồng?)
class SnakeGame {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.canvas.id = 'snake-canvas';
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // Kích thước cho mỗi ô lưới
        this.snake = [
            {x: 5 * this.gridSize, y: 5 * this.gridSize} // Bắt đầu từ vị trí (5,5)
        ];
        this.food = this.generateFood();
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameSpeed = 150;
        this.score = 0;
        this.gameOver = false;
        
        // Điều chỉnh kích thước canvas cho điện thoại
        if (window.innerWidth < 768) {
            this.canvas.width = 300;
            this.canvas.height = 300;
            this.gridSize = 15;
        }
        
        this.setupControls();
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.draw();
    }

    setupControls() {
        // Điều khiển bằng bàn phím
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
            }
        });
        
        // Điều khiển cảm ứng cho điện thoại
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, {passive: true});
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Vuốt ngang
                if (diffX > 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                } else if (diffX < 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                }
            } else {
                // Vuốt dọc
                if (diffY > 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                } else if (diffY < 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                }
            }
            
            touchStartX = 0;
            touchStartY = 0;
            e.preventDefault();
        }, {passive: false});
    }

    generateFood() {
        const maxPos = Math.floor(this.canvas.width / this.gridSize);
        let newFood;
        let overlapping;
        
        // Đảm bảo thức ăn không xuất hiện trên thân rắn
        do {
            newFood = {
                x: Math.floor(Math.random() * maxPos) * this.gridSize,
                y: Math.floor(Math.random() * maxPos) * this.gridSize
            };
            
            overlapping = this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        } while (overlapping);
        
        return newFood;
    }

    update() {
        if (this.gameOver) return;
        
        // Cập nhật hướng di chuyển
        this.direction = this.nextDirection;
        
        const head = {...this.snake[0]};
        
        // Di chuyển đầu rắn
        switch(this.direction) {
            case 'up':
                head.y -= this.gridSize;
                break;
            case 'down':
                head.y += this.gridSize;
                break;
            case 'left':
                head.x -= this.gridSize;
                break;
            case 'right':
                head.x += this.gridSize;
                break;
        }
        
        // Kiểm tra va chạm với tường
        if (
            head.x < 0 || 
            head.y < 0 || 
            head.x >= this.canvas.width || 
            head.y >= this.canvas.height
        ) {
            this.endGame();
            return;
        }
        
        // Kiểm tra va chạm với thân rắn
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }
        
        // Kiểm tra ăn thức ăn (sử dụng toạ độ chính xác)
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.food = this.generateFood();
            
            // Tăng tốc độ mỗi 5 điểm
            if (this.score % 5 === 0 && this.gameSpeed > 50) {
                this.gameSpeed -= 10;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
            }
            
            // Không xóa đuôi khi ăn thức ăn (rắn dài thêm)
        } else {
            // Xóa đuôi nếu không ăn thức ăn
            this.snake.pop();
        }
        
        // Thêm thâm cho rắn
        this.snake.unshift(head);
        this.draw();
    }

    draw() {
        // Xóa canvas
        this.ctx.fillStyle = '#0f0f15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Vẽ rắn
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#00c8ff' : '#6e00ff';
            this.ctx.fillRect(segment.x, segment.y, this.gridSize, this.gridSize);
            this.ctx.strokeStyle = '#0f0f15';
            this.ctx.strokeRect(segment.x, segment.y, this.gridSize, this.gridSize);
            
            // Vẽ mắt cho đầu rắn (điều hướng)
            if (index === 0) {
                this.ctx.fillStyle = 'white';
                const eyeSize = this.gridSize / 5;
                
                // Mắt trái hoặc phải tùy theo hướng
                if (this.direction === 'left' || this.direction === 'right') {
                    const eyeX = this.direction === 'left' 
                        ? segment.x + eyeSize 
                        : segment.x + this.gridSize - eyeSize * 2;
                    this.ctx.fillRect(eyeX, segment.y + eyeSize, eyeSize, eyeSize);
                } else {
                    const eyeY = this.direction === 'up' 
                        ? segment.y + eyeSize 
                        : segment.y + this.gridSize - eyeSize * 2;
                    this.ctx.fillRect(segment.x + eyeSize, eyeY, eyeSize, eyeSize);
                }
            }
        });
        
        // Vẽ thức ăn cho rắn
        this.ctx.fillStyle = '#ff00aa';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x + this.gridSize / 2, 
            this.food.y + this.gridSize / 2, 
            this.gridSize / 2, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Vẽ điểm số
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Điểm: ${this.score}`, 10, 25);
    }

    endGame() {
        this.gameOver = true;
        clearInterval(this.gameLoop);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Điểm cuối: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.textAlign = 'left';
        
        // Thêm nút chơi lại
        this.ctx.fillStyle = '#00c8ff';
        this.ctx.fillRect(
            this.canvas.width / 2 - 60, 
            this.canvas.height / 2 + 50, 
            120, 
            40
        );
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Chơi lại', this.canvas.width / 2, this.canvas.height / 2 + 75);
        
        // Xử lý click chơi lại
        const restartHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (
                x >= this.canvas.width / 2 - 60 &&
                x <= this.canvas.width / 2 + 60 &&
                y >= this.canvas.height / 2 + 50 &&
                y <= this.canvas.height / 2 + 90
            ) {
                this.restart();
                this.canvas.removeEventListener('click', restartHandler);
                this.canvas.removeEventListener('touchstart', restartHandler);
            }
        };
        
        this.canvas.addEventListener('click', restartHandler);
        this.canvas.addEventListener('touchstart', restartHandler, {passive: true});
    }

    restart() {
        clearInterval(this.gameLoop);
        this.snake = [{x: 5 * this.gridSize, y: 5 * this.gridSize}];
        this.food = this.generateFood();
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameOver = false;
        this.gameSpeed = 150;
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.draw();
    }

    destroy() {
        clearInterval(this.gameLoop);
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Trò chơi Flappy Bird
class FlappyBird {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 600;
        this.canvas.id = 'flappy-canvas';
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.bird = {
            x: 100,
            y: 300,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jump: -10 // Thay đổi độ cao khi nhảy
        };
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.pipeGap = 180;
        this.pipeWidth = 60;
        this.pipeSpeed = 2;
        this.pipeFrequency = 2000;
        
        // Điều chỉnh kích thước canvas cho điện thoại
        if (window.innerWidth < 768) {
            this.canvas.width = 300;
            this.canvas.height = 500;
            this.bird.width = 30;
            this.bird.height = 22;
            this.pipeGap = 180;
            this.pipeWidth = 60;
        }
        
        this.setupControls();
        this.lastPipeTime = 0;
        this.lastFrameTime = 0;
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
        this.draw();
    }

    setupControls() {
        // Điều khiển bàn phím
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Điều khiển cảm ứng cho điện thoại
        this.canvas.addEventListener('touchstart', (e) => {
            this.jump();
            e.preventDefault();
        }, {passive: false});
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.jump();
            e.preventDefault();
        });
    }

    handleKeyPress(e) {
        if (e.code === 'Space') {
            this.jump();
        }
    }

    jump() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.lastPipeTime = performance.now();
        }
        
        if (!this.gameOver) {
            this.bird.velocity = this.bird.jump;
        } else {
            this.restart();
        }
    }

    update(timestamp) {
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        if (this.gameOver) {
            this.draw();
            this.gameLoop = requestAnimationFrame(this.update.bind(this));
            return;
        }
        
        if (!this.gameStarted) {
            this.draw();
            this.gameLoop = requestAnimationFrame(this.update.bind(this));
            return;
        }
        
        // Cập nhật cho con chim
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Kiểm tra xem chim có đâm vào đất hay trần nhà không?
        if (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0) {
            this.endGame();
        }
        
        // Tạo lên ps mới
        if (timestamp - this.lastPipeTime > this.pipeFrequency) {
            this.generatePipe();
            this.lastPipeTime = timestamp;
        }
        
        // Cập nhật đường ống
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= this.pipeSpeed;
            
            // Kiểm tra xem chim có bay qua ống không
            if (
                !this.pipes[i].passed && 
                this.pipes[i].x + this.pipeWidth < this.bird.x
            ) {
                this.score++;
                this.pipes[i].passed = true;
                
                // Tăng độ khó - tùy chọn
                if (this.score % 5 === 0) {
                    this.pipeSpeed += 0.5;
                    if (this.pipeFrequency > 1000) {
                        this.pipeFrequency -= 100;
                    }
                }
            }
            
            // Kiểm tra va chạm với đường ống
            if (
                this.bird.x + this.bird.width > this.pipes[i].x && 
                this.bird.x < this.pipes[i].x + this.pipeWidth && 
                (this.bird.y < this.pipes[i].topHeight || 
                 this.bird.y + this.bird.height > this.pipes[i].topHeight + this.pipeGap)
            ) {
                this.endGame();
            }
            
            // Xóa các đường ống nằm ngoài màn hình - tránh lỗi
            if (this.pipes[i].x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        this.draw();
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    generatePipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight,
            passed: false
        });
    }

    draw() {
        // Xóa canvas
        this.ctx.fillStyle = '#4ec0ca';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Vẽ hình chim
        this.ctx.fillStyle = '#ffeb3b';
        this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
        this.ctx.fillStyle = '#ff5722';
        this.ctx.beginPath();
        this.ctx.arc(
            this.bird.x + this.bird.width, 
            this.bird.y + this.bird.height / 3, 
            this.bird.height / 3, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Vẽ ống
        this.ctx.fillStyle = '#4caf50';
        this.pipes.forEach(pipe => {
            // Ống trên cùng
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Ống dưới
            this.ctx.fillRect(
                pipe.x, 
                pipe.topHeight + this.pipeGap, 
                this.pipeWidth, 
                this.canvas.height - pipe.topHeight - this.pipeGap
            );
        });
        
        // Vẽ điểm
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 50);
        
        if (!this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Nhấn SPACE hoặc chạm màn hình để bắt đầu', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '30px Arial';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Điểm: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText('Nhấn SPACE hoặc chạm màn hình để chơi lại', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        
        this.ctx.textAlign = 'left';
    }

    endGame() {
        this.gameOver = true;
    }

    restart() {
        cancelAnimationFrame(this.gameLoop);
        this.bird = {
            x: 100,
            y: 300,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jump: -10
        };
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.pipeSpeed = 2;
        this.pipeFrequency = 2000;
        
        if (window.innerWidth < 768) {
            this.bird.width = 30;
            this.bird.height = 22;
        }
        
        this.lastPipeTime = 0;
        this.lastFrameTime = 0;
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
        this.draw();
    }

    destroy() {
        cancelAnimationFrame(this.gameLoop);
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Trò chơi Tic Tac Toe 
class TicTacToe {
    constructor(container) {
        this.container = container;
        this.board = document.createElement('div');
        this.board.className = 'tic-tac-toe';
        this.container.appendChild(this.board);
        
        this.currentPlayer = 'X';
        this.gameBoard = ['', '', '', '', '', '', '', '', ''];
        this.gameOver = false;
        
        this.createBoard();
    }

    createBoard() {
        this.board.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'tic-tac-toe-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            this.board.appendChild(cell);
        }
    }

    handleCellClick(index) {
        if (this.gameOver || this.gameBoard[index] !== '') return;
        
        this.gameBoard[index] = this.currentPlayer;
        this.renderBoard();
        
        if (this.checkWinner()) {
            this.showWinner(this.currentPlayer);
            return;
        }
        
        if (this.checkDraw()) {
            this.showDraw();
            return;
        }
        
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    renderBoard() {
        const cells = this.board.querySelectorAll('.tic-tac-toe-cell');
        
        cells.forEach((cell, index) => {
            cell.textContent = this.gameBoard[index];
            
            if (this.gameBoard[index] === 'X') {
                cell.style.color = '#00c8ff';
            } else if (this.gameBoard[index] === 'O') {
                cell.style.color = '#ff00aa';
            }
        });
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Hàng
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cột
            [0, 4, 8], [2, 4, 6]             // Đường chéo
        ];
        
        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return (
                this.gameBoard[a] !== '' && 
                this.gameBoard[a] === this.gameBoard[b] && 
                this.gameBoard[a] === this.gameBoard[c]
            );
        });
    }

    checkDraw() {
        return this.gameBoard.every(cell => cell !== '');
    }

    showWinner(player) {
        this.gameOver = true;
        
        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'game-message';
        winnerDiv.innerHTML = `
            <h3>Người chơi ${player} thắng!</h3>
            <button class="game-btn restart-btn">
                <i class="fas fa-redo"></i> Chơi lại
            </button>
        `;
        
        winnerDiv.querySelector('.restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        this.container.appendChild(winnerDiv);
    }

    showDraw() {
        this.gameOver = true;
        
        const drawDiv = document.createElement('div');
        drawDiv.className = 'game-message';
        drawDiv.innerHTML = `
            <h3>Hòa!</h3>
            <button class="game-btn restart-btn">
                <i class="fas fa-redo"></i> Chơi lại
            </button>
        `;
        
        drawDiv.querySelector('.restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        this.container.appendChild(drawDiv);
    }

    restart() {
        this.currentPlayer = 'X';
        this.gameBoard = ['', '', '', '', '', '', '', '', ''];
        this.gameOver = false;
        
        const messageDiv = this.container.querySelector('.game-message');
        if (messageDiv) {
            messageDiv.remove();
        }
        
        this.createBoard();
    }

    destroy() {
        // Dọn dẹp nếu cần
    }
}

// Trò chơi trí nhớ
class MemoryGame {
    constructor(container) {
        this.container = container;
        this.game = document.createElement('div');
        this.game.className = 'memory-game';
        this.container.appendChild(this.game);
        
        this.cards = ['🍎', '🍌', '🍒', '🍓', '🍊', '🍋', '🍐', '🍉'];
        this.shuffledCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        
        this.initGame();
    }

    initGame() {
        // Nhân đôi và xáo trộn các lá bài
        this.shuffledCards = [...this.cards, ...this.cards]
            .sort(() => Math.random() - 0.5);
        
        this.game.innerHTML = '';
        
        this.shuffledCards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            
            const front = document.createElement('div');
            front.className = 'front';
            front.textContent = '?';
            
            const back = document.createElement('div');
            back.className = 'back';
            back.textContent = emoji;
            
            card.appendChild(front);
            card.appendChild(back);
            card.addEventListener('click', () => this.flipCard(card, index));
            
            this.game.appendChild(card);
        });
    }

    flipCard(card, index) {
        // Không cho phép lật nếu đã lật hoặc đã khớp
        if (
            card.classList.contains('flipped') || 
            this.flippedCards.length === 2
        ) {
            return;
        }
        
        card.classList.add('flipped');
        this.flippedCards.push({ card, index });
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.checkForMatch();
        }
    }

    checkForMatch() {
        const [firstCard, secondCard] = this.flippedCards;
        
        if (this.shuffledCards[firstCard.index] === this.shuffledCards[secondCard.index]) {
            // Tìm thấy kết quả khớp
            firstCard.card.classList.add('matched');
            secondCard.card.classList.add('matched');
            this.flippedCards = [];
            this.matchedPairs++;
            
            if (this.matchedPairs === this.cards.length) {
                setTimeout(() => {
                    this.showWinMessage();
                }, 500);
            }
        } else {
            // Kết quả không khớp
            setTimeout(() => {
                firstCard.card.classList.remove('flipped');
                secondCard.card.classList.remove('flipped');
                this.flippedCards = [];
            }, 1000);
        }
    }

    showWinMessage() {
        const winDiv = document.createElement('div');
        winDiv.className = 'game-message';
        winDiv.innerHTML = `
            <h3>Bạn thắng với ${this.moves} lượt!</h3>
            <button class="game-btn restart-btn">
                <i class="fas fa-redo"></i> Chơi lại
            </button>
        `;
        
        winDiv.querySelector('.restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        this.container.appendChild(winDiv);
    }

    restart() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        
        const messageDiv = this.container.querySelector('.game-message');
        if (messageDiv) {
            messageDiv.remove();
        }
        
        this.initGame();
    }

    destroy() {
        // Dọn dẹp nếu cần
    }
}

// Trò chơi Pong
class PongGame {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth < 768 ? 300 : 600;
        this.canvas.height = window.innerWidth < 768 ? 500 : 400;
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.paddleWidth = window.innerWidth < 768 ? 80 : 15;
        this.paddleHeight = window.innerWidth < 768 ? 15 : 80;
        this.ballSize = 10;
        
        // Đổi hướng trục cho điện thoại (chơi từ dưới lên)
        this.isMobile = window.innerWidth < 768;
        
        // Vị trí paddle (đổi trục x/y cho điện thoại)
        this.playerPaddle = {
            x: this.isMobile ? this.canvas.width / 2 - this.paddleWidth / 2 : 10,
            y: this.isMobile ? this.canvas.height - 30 : this.canvas.height / 2 - this.paddleHeight / 2,
            speed: 8
        };
        
        this.computerPaddle = {
            x: this.isMobile ? this.canvas.width / 2 - this.paddleWidth / 2 : this.canvas.width - 25,
            y: this.isMobile ? 15 : this.canvas.height / 2 - this.paddleHeight / 2,
            speed: this.isMobile ? 4 : 5 // Giảm tốc độ bot trên điện thoại
        };
        
        this.computerPaddle.speed = this.isMobile ? 5 : 5;

        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            dx: (Math.random() > 0.5 ? 1 : -1) * 4,
            dy: (Math.random() * 2 - 1) * 4
        };
        
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameOver = false;
        this.botReactionDelay = 0; // Độ trễ phản ứng của bot
        this.maxBotDelay = 3; // Số frame tối đa bot bị trễ
        
        this.setupControls();
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    setupControls() {
        if (this.isMobile) {
            // Điều khiển cảm ứng ngang cho điện thoại
            this.canvas.addEventListener('touchmove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.playerPaddle.x = e.touches[0].clientX - rect.left - this.paddleWidth / 2;
                e.preventDefault();
            }, {passive: false});
            
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.playerPaddle.x = e.clientX - rect.left - this.paddleWidth / 2;
            });
        } else {
            // Điều khiển truyền thống cho desktop
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.playerPaddle.y = e.clientY - rect.top - this.paddleHeight / 2;
            });
        }
    }

    update() {
        if (this.gameOver) {
            this.draw();
            this.gameLoop = requestAnimationFrame(this.update.bind(this));
            return;

    // Tăng tốc độ sau mỗi lần đỡ bóng thành công
        if (frameCount % 10 === 0) {
            this.ball.dx *= 1.01;
            this.ball.dy *= 1.01;
    }
        }
        
        // Di chuyển ball (đổi trục nếu là điện thoại)
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // AI cho computer (thêm độ trễ và sai số)
        if (this.botReactionDelay <= 0) {
            let targetPos;
            if (this.isMobile) {
                // Bot ngang (điện thoại)
                targetPos = this.ball.x;
                // Thêm sai số ngẫu nhiên
                targetPos += (Math.random() * 45 - 20);
            } else {
                // Bot dọc (desktop)
                targetPos = this.ball.y;
                // Thêm sai số ngẫu nhiên
                targetPos += (Math.random() * 30 - 15);
            }
            
            // Tính toán vị trí với tốc độ giới hạn
            if (this.isMobile) {
                if (this.computerPaddle.x + this.paddleWidth / 2 < targetPos) {
                    this.computerPaddle.x += this.computerPaddle.speed;
                } else {
                    this.computerPaddle.x -= this.computerPaddle.speed;
                }
            } else {
                if (this.computerPaddle.y + this.paddleHeight / 2 < targetPos) {
                    this.computerPaddle.y += this.computerPaddle.speed;
                } else {
                    this.computerPaddle.y -= this.computerPaddle.speed;
                }
            }
            
            // Reset độ trễ
            this.botReactionDelay = Math.floor(Math.random() * this.maxBotDelay);
        } else {
            this.botReactionDelay--;
        }
        
        // Giới hạn paddle trong canvas
        if (this.isMobile) {
            this.playerPaddle.x = Math.max(0, Math.min(this.canvas.width - this.paddleWidth, this.playerPaddle.x));
            this.computerPaddle.x = Math.max(0, Math.min(this.canvas.width - this.paddleWidth, this.computerPaddle.x));
        } else {
            this.playerPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.playerPaddle.y));
            this.computerPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.computerPaddle.y));
        }
        
        // Va chạm với tường (đổi trục cho điện thoại)
        if (this.isMobile) {
            if (this.ball.x - this.ballSize / 2 <= 0 || this.ball.x + this.ballSize / 2 >= this.canvas.width) {
                this.ball.dx = -this.ball.dx;
            }
        } else {
            if (this.ball.y - this.ballSize / 2 <= 0 || this.ball.y + this.ballSize / 2 >= this.canvas.height) {
                this.ball.dy = -this.ball.dy;
            }
        }
        
        // Va chạm với paddle (xử lý khác nhau cho điện thoại/desktop)
        if (this.isMobile) {
            // Va chạm paddle ngang (điện thoại)
            if (
                this.ball.y - this.ballSize / 2 <= this.playerPaddle.y + this.paddleHeight &&
                this.ball.y + this.ballSize / 2 >= this.playerPaddle.y &&
                this.ball.x >= this.playerPaddle.x &&
                this.ball.x <= this.playerPaddle.x + this.paddleWidth
            ) {
                this.ball.dy = -Math.abs(this.ball.dy); // Đảm bảo bóng đi lên
                // Thay đổi hướng ngang dựa trên vị trí chạm
                const hitPos = (this.ball.x - (this.playerPaddle.x + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                this.ball.dx = hitPos * 6;
            }
            
            if (
                this.ball.y + this.ballSize / 2 >= this.computerPaddle.y &&
                this.ball.y - this.ballSize / 2 <= this.computerPaddle.y + this.paddleHeight &&
                this.ball.x >= this.computerPaddle.x &&
                this.ball.x <= this.computerPaddle.x + this.paddleWidth
            ) {
                this.ball.dy = Math.abs(this.ball.dy); // Đảm bảo bóng đi xuống
                const hitPos = (this.ball.x - (this.computerPaddle.x + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                this.ball.dx = hitPos * 6;
            }
        } else {
            // Va chạm paddle dọc (desktop)
            if (
                this.ball.x - this.ballSize / 2 <= this.playerPaddle.x + this.paddleWidth &&
                this.ball.x + this.ballSize / 2 >= this.playerPaddle.x &&
                this.ball.y >= this.playerPaddle.y &&
                this.ball.y <= this.playerPaddle.y + this.paddleHeight
            ) {
                this.ball.dx = Math.abs(this.ball.dx);
                const hitPos = (this.ball.y - (this.playerPaddle.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
                this.ball.dy = hitPos * 5;
            }
            
            if (
                this.ball.x + this.ballSize / 2 >= this.computerPaddle.x &&
                this.ball.x - this.ballSize / 2 <= this.computerPaddle.x + this.paddleWidth &&
                this.ball.y >= this.computerPaddle.y &&
                this.ball.y <= this.computerPaddle.y + this.paddleHeight
            ) {
                this.ball.dx = -Math.abs(this.ball.dx);
                const hitPos = (this.ball.y - (this.computerPaddle.y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
                this.ball.dy = hitPos * 5;
            }
        }
        
        // Ghi điểm (đổi trục cho điện thoại)
        if (this.isMobile) {
            if (this.ball.y - this.ballSize / 2 <= 0) {
                this.playerScore++;
                this.resetBall();
            }
            if (this.ball.y + this.ballSize / 2 >= this.canvas.height) {
                this.computerScore++;
                this.resetBall();
            }
        } else {
            if (this.ball.x - this.ballSize / 2 <= 0) {
                this.computerScore++;
                this.resetBall();
            }
            if (this.ball.x + this.ballSize / 2 >= this.canvas.width) {
                this.playerScore++;
                this.resetBall();
            }
        }
        
        // Kết thúc game
        if (this.playerScore >= 5 || this.computerScore >= 5) {
            this.gameOver = true;
        }
        
        this.draw();
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
        this.ball.dy = (Math.random() * 2 - 1) * 4;
        this.botReactionDelay = this.maxBotDelay; // Thêm độ trễ khi reset ball
    }

    draw() {
        // Xóa canvas
        this.ctx.fillStyle = '#0f0f15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Vẽ paddle (đổi hướng cho điện thoại)
        this.ctx.fillStyle = '#00c8ff';
        this.ctx.fillRect(
            this.playerPaddle.x, 
            this.playerPaddle.y, 
            this.paddleWidth, 
            this.paddleHeight
        );
        
        this.ctx.fillStyle = '#ff00aa';
        this.ctx.fillRect(
            this.computerPaddle.x, 
            this.computerPaddle.y, 
            this.paddleWidth, 
            this.paddleHeight
        );
        
        // Vẽ ball
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            this.ball.x, 
            this.ball.y, 
            this.ballSize / 2, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Vẽ điểm
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        
        if (this.isMobile) {
            // Hiển thị điểm bên cạnh cho điện thoại
            this.ctx.fillText(`Bạn: ${this.playerScore}`, 70, 30);
            this.ctx.fillText(`Đối thủ: ${this.computerScore}`, this.canvas.width - 90, 30);
        } else {
            this.ctx.fillText(`${this.playerScore} - ${this.computerScore}`, this.canvas.width / 2, 40);
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '30px Arial';
            
            const winner = this.playerScore > this.computerScore ? 'Bạn thắng!' : 'Đối thủ thắng!';
            this.ctx.fillText(winner, this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Chạm để chơi lại', this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            // Xử lý chơi lại
            const restartHandler = () => {
                this.restart();
                this.canvas.removeEventListener('click', restartHandler);
                this.canvas.removeEventListener('touchstart', restartHandler);
            };
            
            this.canvas.addEventListener('click', restartHandler);
            this.canvas.addEventListener('touchstart', restartHandler, {passive: true});
        }
    }

    restart() {
        cancelAnimationFrame(this.gameLoop);
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameOver = false;
        
        if (this.isMobile) {
            this.playerPaddle.x = this.canvas.width / 2 - this.paddleWidth / 2;
            this.playerPaddle.y = this.canvas.height - 30;
            this.computerPaddle.x = this.canvas.width / 2 - this.paddleWidth / 2;
            this.computerPaddle.y = 15;
        } else {
            this.playerPaddle.y = this.canvas.height / 2 - this.paddleHeight / 2;
            this.computerPaddle.y = this.canvas.height / 2 - this.paddleHeight / 2;
        }
        
        this.resetBall();
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    destroy() {
        cancelAnimationFrame(this.gameLoop);
    }
}

// Trò chơi khủng long Chrome
class DinoGame {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 600;
        this.canvas.height = 200;
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.dino = {
            x: 50,
            y: 150,
            width: 40,
            height: 60,
            isJumping: false,
            velocity: 0,
            gravity: 0.8,
            jumpForce: -15
        };
        
        this.cactus = {
            x: this.canvas.width,
            y: 160,
            width: 30,
            height: 40,
            speed: 5
        };
        
        this.clouds = [];
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        
        // Điều chỉnh cho điện thoại
        if (window.innerWidth < 768) {
            this.canvas.width = 300;
            this.canvas.height = 150;
            this.dino.y = 100;
            this.dino.width = 25;
            this.dino.height = 40;
            this.cactus.y = 110;
            this.cactus.width = 20;
            this.cactus.height = 30;
        }
        
        this.setupControls();
        this.lastFrameTime = 0;
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    setupControls() {
        // Điều khiển bàn phím
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.jump();
            }
        });
        
        // Điều khiển cảm ứng
        this.canvas.addEventListener('touchstart', (e) => {
            this.jump();
            e.preventDefault();
        }, {passive: false});
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.jump();
            e.preventDefault();
        });
    }

    jump() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            return;
        }
        
        if (!this.gameOver && !this.dino.isJumping) {
            this.dino.velocity = this.dino.jumpForce;
            this.dino.isJumping = true;
        } else if (this.gameOver) {
            this.restart();
        }
    }

    update(timestamp) {
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        if (this.gameOver) {
            this.draw();
            this.gameLoop = requestAnimationFrame(this.update.bind(this));
            return;
        }
        
        if (!this.gameStarted) {
            this.draw();
            this.gameLoop = requestAnimationFrame(this.update.bind(this));
            return;
        }
        
        // Cập nhật khủng long
        if (this.dino.isJumping) {
            this.dino.y += this.dino.velocity;
            this.dino.velocity += this.dino.gravity;
            
            // Kiểm tra xem đã hạ cánh chưa
            if (this.dino.y >= (window.innerWidth < 768 ? 100 : 150)) {
                this.dino.y = window.innerWidth < 768 ? 100 : 150;
                this.dino.isJumping = false;
                this.dino.velocity = 0;
            }
        }
        
        // Cập nhật xương rồng
        this.cactus.x -= this.cactus.speed;
        
        // Tạo cây xương rồng mới
        if (this.cactus.x + this.cactus.width < 0) {
            this.cactus.x = this.canvas.width;
            this.score++;
            
            // Tăng tốc độ
            if (this.score % 5 === 0) {
                this.cactus.speed += 0.5;
            }
        }
        
        // Tạo ra các đám mây
        if (Math.random() < 0.01) {
            this.clouds.push({
                x: this.canvas.width,
                y: Math.random() * 60 + 20,
                width: Math.random() * 40 + 20,
                speed: Math.random() * 2 + 1
            });
        }
        
        // Cập nhật đám mây
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            this.clouds[i].x -= this.clouds[i].speed;
            
            if (this.clouds[i].x + this.clouds[i].width < 0) {
                this.clouds.splice(i, 1);
            }
        }
        
        // Kiểm tra va chạm
        if (
            this.dino.x + this.dino.width > this.cactus.x &&
            this.dino.x < this.cactus.x + this.cactus.width &&
            this.dino.y + this.dino.height > this.cactus.y
        ) {
            this.gameOver = true;
        }
        
        this.draw();
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    draw() {
        // Xóa canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Vẽ mặt đất
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(0, window.innerWidth < 768 ? 130 : 180, this.canvas.width, 20);
        
        // Vẽ mây
        this.ctx.fillStyle = '#dddddd';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width / 2, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 3, cloud.y - cloud.width / 4, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 2, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Vẽ khủng long
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
        
        // Vẽ mắt
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(
            this.dino.x + this.dino.width - 10, 
            this.dino.y + 10, 
            5, 
            5
        );
        
        // Vẽ cây xương rồng
        this.ctx.fillStyle = '#4caf50';
        this.ctx.fillRect(this.cactus.x, this.cactus.y, this.cactus.width, this.cactus.height);
        
        // Vẽ điểm
        this.ctx.fillStyle = '#222222';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Điểm: ${this.score}`, this.canvas.width - 10, 30);
        
        if (!this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Nhấn SPACE hoặc chạm màn hình để bắt đầu', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillText(`Điểm: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('Nhấn SPACE hoặc chạm màn hình để chơi lại', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        
        this.ctx.textAlign = 'left';
    }

    restart() {
        cancelAnimationFrame(this.gameLoop);
        this.dino = {
            x: 50,
            y: window.innerWidth < 768 ? 100 : 150,
            width: window.innerWidth < 768 ? 25 : 40,
            height: window.innerWidth < 768 ? 40 : 60,
            isJumping: false,
            velocity: 0,
            gravity: 0.8,
            jumpForce: -15
        };
        
        this.cactus = {
            x: this.canvas.width,
            y: window.innerWidth < 768 ? 110 : 160,
            width: window.innerWidth < 768 ? 20 : 30,
            height: window.innerWidth < 768 ? 30 : 40,
            speed: 5
        };
        
        this.clouds = [];
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        
        this.lastFrameTime = 0;
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }

    destroy() {
        cancelAnimationFrame(this.gameLoop);
        document.removeEventListener('keydown', this.jump);
    }
}

// Trò chơi 2048
class Game2048 {
    constructor(container) {
        this.container = container;
        this.container.innerHTML = '';
        
        // Tạo giao diện game
        this.createGameUI();
        
        // Khởi tạo game
        this.initGame();
        
        // Thiết lập điều khiển
        this.setupControls();
    }
    
    createGameUI() {
        // Tạo header chứa điểm số
        this.header = document.createElement('div');
        this.header.className = 'game-2048-header';
        
        this.scoreContainer = document.createElement('div');
        this.scoreContainer.className = 'score-container';
        
        this.scoreElement = document.createElement('div');
        this.scoreElement.className = 'score';
        this.scoreElement.innerHTML = `
            <div class="score-title">ĐIỂM</div>
            <div class="score-value">0</div>
        `;
        
        this.bestScoreElement = document.createElement('div');
        this.bestScoreElement.className = 'score best-score';
        this.bestScoreElement.innerHTML = `
            <div class="score-title">CAO NHẤT</div>
            <div class="score-value">${localStorage.getItem('2048-best-score') || 0}</div>
        `;
        
        this.scoreContainer.appendChild(this.scoreElement);
        this.scoreContainer.appendChild(this.bestScoreElement);
        this.header.appendChild(this.scoreContainer);
        
        // Nút chơi lại
        this.restartBtn = document.createElement('button');
        this.restartBtn.className = 'game-2048-restart';
        this.restartBtn.innerHTML = '<i class="fas fa-redo"></i>';
        this.restartBtn.addEventListener('click', () => this.restart());
        this.header.appendChild(this.restartBtn);
        
        this.container.appendChild(this.header);
        
        // Tạo grid
        this.gridElement = document.createElement('div');
        this.gridElement.className = 'game-2048-grid';
        this.container.appendChild(this.gridElement);
        
        // Thông báo game over hoặc chiến thắng
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'game-2048-message hidden';
        this.container.appendChild(this.messageElement);
    }
    
    initGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        // Thêm 2 ô số ban đầu
        this.addRandomTile();
        this.addRandomTile();
        
        // Cập nhật giao diện
        this.updateView();
    }
    
    addRandomTile() {
        if (this.isGridFull()) return;
        
        let value = Math.random() < 0.9 ? 2 : 4;
        let emptyCells = [];
        
        // Tìm tất cả ô trống
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        // Chọn ngẫu nhiên 1 ô trống
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.grid[row][col] = value;
    }
    
    isGridFull() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    updateView() {
        // Cập nhật điểm số
        this.scoreElement.querySelector('.score-value').textContent = this.score;
        
        // Cập nhật grid
        this.gridElement.innerHTML = '';
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const value = this.grid[row][col];
                const tile = document.createElement('div');
                tile.className = `game-2048-tile tile-${value}`;
                
                if (value > 0) {
                    tile.textContent = value;
                    tile.classList.add(`tile-color-${Math.min(value, 2048)}`);
                }
                
                this.gridElement.appendChild(tile);
            }
        }
        
        // Kiểm tra game over
        if (this.gameOver) {
            this.showMessage('Game Over!', 'Chạm để chơi lại');
        }
        
        // Kiểm tra chiến thắng
        if (!this.won && this.hasWon()) {
            this.won = true;
            this.showMessage('Bạn đã thắng!', 'Tiếp tục chơi?');
        }
    }
    
    showMessage(title, subtitle) {
        this.messageElement.innerHTML = `
            <div class="message-title">${title}</div>
            <div class="message-subtitle">${subtitle}</div>
        `;
        this.messageElement.classList.remove('hidden');
        
        // Xử lý click để chơi lại
        const handler = () => {
            if (this.gameOver) {
                this.restart();
            } else if (this.won) {
                this.keepPlaying = true;
                this.messageElement.classList.add('hidden');
            }
            this.messageElement.removeEventListener('click', handler);
        };
        
        this.messageElement.addEventListener('click', handler);
    }
    
    hasWon() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkGameOver() {
        // Nếu còn ô trống thì chưa game over
        if (!this.isGridFull()) return false;
        
        // Kiểm tra xem còn nước đi hợp lệ nào không
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const value = this.grid[row][col];
                
                // Kiểm tra ô bên phải
                if (col < 3 && this.grid[row][col + 1] === value) {
                    return false;
                }
                
                // Kiểm tra ô bên dưới
                if (row < 3 && this.grid[row + 1][col] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    setupControls() {
        // Điều khiển bằng bàn phím
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && !this.won) return;
            
            let moved = false;
            
            switch(e.key) {
                case 'ArrowUp':
                    moved = this.moveUp();
                    break;
                case 'ArrowDown':
                    moved = this.moveDown();
                    break;
                case 'ArrowLeft':
                    moved = this.moveLeft();
                    break;
                case 'ArrowRight':
                    moved = this.moveRight();
                    break;
                default:
                    return; // Không xử lý phím khác
            }
            
            if (moved) {
                this.addRandomTile();
                this.updateView();
                
                if (!this.keepPlaying && this.hasWon()) {
                    this.won = true;
                    this.showMessage('Bạn đã thắng!', 'Tiếp tục chơi?');
                }
                
                if (this.checkGameOver()) {
                    this.gameOver = true;
                    this.updateBestScore();
                    this.updateView();
                }
            }
        });
        
        // Điều khiển cảm ứng cho mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.container.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            if (this.gameOver && !this.won) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            // Xác định hướng vuốt
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Vuốt ngang
                if (diffX > 0) {
                    this.handleMove(this.moveRight());
                } else {
                    this.handleMove(this.moveLeft());
                }
            } else {
                // Vuốt dọc
                if (diffY > 0) {
                    this.handleMove(this.moveDown());
                } else {
                    this.handleMove(this.moveUp());
                }
            }
            
            touchStartX = 0;
            touchStartY = 0;
        }, { passive: true });
    }
    
    handleMove(moved) {
        if (moved) {
            this.addRandomTile();
            this.updateView();
            
            if (!this.keepPlaying && this.hasWon()) {
                this.won = true;
                this.showMessage('Bạn đã thắng!', 'Tiếp tục chơi?');
            }
            
            if (this.checkGameOver()) {
                this.gameOver = true;
                this.updateBestScore();
                this.updateView();
            }
        }
    }
    
    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < 4; row++) {
            // Di chuyển các ô sang trái
            const newRow = this.grid[row].filter(val => val !== 0);
            
            // Gộp các ô giống nhau
            for (let col = 0; col < newRow.length - 1; col++) {
                if (newRow[col] === newRow[col + 1]) {
                    newRow[col] *= 2;
                    newRow[col + 1] = 0;
                    this.score += newRow[col];
                    moved = true;
                }
            }
            
            // Lọc lại các ô sau khi gộp
            const mergedRow = newRow.filter(val => val !== 0);
            
            // Thêm các ô 0 vào cuối
            while (mergedRow.length < 4) {
                mergedRow.push(0);
            }
            
            // Kiểm tra xem có thay đổi không
            if (!this.arraysEqual(this.grid[row], mergedRow)) {
                moved = true;
            }
            
            this.grid[row] = mergedRow;
        }
        
        return moved;
    }
    
    moveRight() {
        let moved = false;
        
        for (let row = 0; row < 4; row++) {
            // Di chuyển các ô sang phải
            const newRow = this.grid[row].filter(val => val !== 0);
            
            // Gộp các ô giống nhau từ phải sang
            for (let col = newRow.length - 1; col > 0; col--) {
                if (newRow[col] === newRow[col - 1]) {
                    newRow[col] *= 2;
                    newRow[col - 1] = 0;
                    this.score += newRow[col];
                    moved = true;
                }
            }
            
            // Lọc lại các ô sau khi gộp
            const mergedRow = newRow.filter(val => val !== 0);
            
            // Thêm các ô 0 vào đầu
            while (mergedRow.length < 4) {
                mergedRow.unshift(0);
            }
            
            // Kiểm tra xem có thay đổi không
            if (!this.arraysEqual(this.grid[row], mergedRow)) {
                moved = true;
            }
            
            this.grid[row] = mergedRow;
        }
        
        return moved;
    }
    
    moveUp() {
        let moved = false;
        
        for (let col = 0; col < 4; col++) {
            // Lấy cột hiện tại
            let column = [];
            for (let row = 0; row < 4; row++) {
                column.push(this.grid[row][col]);
            }
            
            // Di chuyển các ô lên trên
            const newColumn = column.filter(val => val !== 0);
            
            // Gộp các ô giống nhau
            for (let row = 0; row < newColumn.length - 1; row++) {
                if (newColumn[row] === newColumn[row + 1]) {
                    newColumn[row] *= 2;
                    newColumn[row + 1] = 0;
                    this.score += newColumn[row];
                    moved = true;
                }
            }
            
            // Lọc lại các ô sau khi gộp
            const mergedColumn = newColumn.filter(val => val !== 0);
            
            // Thêm các ô 0 vào cuối
            while (mergedColumn.length < 4) {
                mergedColumn.push(0);
            }
            
            // Kiểm tra xem có thay đổi không
            if (!this.arraysEqual(column, mergedColumn)) {
                moved = true;
            }
            
            // Cập nhật lại cột
            for (let row = 0; row < 4; row++) {
                this.grid[row][col] = mergedColumn[row];
            }
        }
        
        return moved;
    }
    
    moveDown() {
        let moved = false;
        
        for (let col = 0; col < 4; col++) {
            // Lấy cột hiện tại
            let column = [];
            for (let row = 0; row < 4; row++) {
                column.push(this.grid[row][col]);
            }
            
            // Di chuyển các ô xuống dưới
            const newColumn = column.filter(val => val !== 0);
            
            // Gộp các ô giống nhau từ dưới lên
            for (let row = newColumn.length - 1; row > 0; row--) {
                if (newColumn[row] === newColumn[row - 1]) {
                    newColumn[row] *= 2;
                    newColumn[row - 1] = 0;
                    this.score += newColumn[row];
                    moved = true;
                }
            }
            
            // Lọc lại các ô sau khi gộp
            const mergedColumn = newColumn.filter(val => val !== 0);
            
            // Thêm các ô 0 vào đầu
            while (mergedColumn.length < 4) {
                mergedColumn.unshift(0);
            }
            
            // Kiểm tra xem có thay đổi không
            if (!this.arraysEqual(column, mergedColumn)) {
                moved = true;
            }
            
            // Cập nhật lại cột
            for (let row = 0; row < 4; row++) {
                this.grid[row][col] = mergedColumn[row];
            }
        }
        
        return moved;
    }
    
    arraysEqual(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    updateBestScore() {
        const bestScore = parseInt(localStorage.getItem('2048-best-score') || 0);
        if (this.score > bestScore) {
            localStorage.setItem('2048-best-score', this.score);
            this.bestScoreElement.querySelector('.score-value').textContent = this.score;
        }
    }
    
    restart() {
        this.updateBestScore();
        this.initGame();
        this.messageElement.classList.add('hidden');
    }
    
    destroy() {
        // Dọn dẹp event listeners nếu cần
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Khởi tạo trình quản lý trò chơi khi DOM được tải
document.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});
