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
        this.boardSize = 4; // Bảng 4x4
        this.cellSize = window.innerWidth < 768 ? 60 : 80; // Kích thước các ô vuông
        this.board = document.createElement('div');
        this.board.className = 'game-2048-board';
        this.container.appendChild(this.board);
        
        // Khởi tạo trạng thái game
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        // Thiết lập giao diện
        this.setupBoard();
        this.setupControls();
        
        // Bắt đầu game
        this.addRandomTile();
        this.addRandomTile();
        this.updateView();
    }

    setupBoard() {
        this.board.innerHTML = '';
        this.board.style.width = `${this.cellSize * this.boardSize}px`;
        this.board.style.height = `${this.cellSize * this.boardSize}px`;
        
        // Thêm wrapper cho controls trên điện thoại
        if (window.innerWidth < 768) {
            const controlsWrapper = document.createElement('div');
            controlsWrapper.className = 'game-2048-controls';
            this.container.appendChild(controlsWrapper);
            
            // Di chuyển score và button vào wrapper
            this.scoreDisplay = document.createElement('div');
            this.scoreDisplay.className = 'game-2048-score';
            this.scoreDisplay.innerHTML = `
                <div class="score-title">ĐIỂM</div>
                <div class="score-value">0</div>
            `;
            controlsWrapper.appendChild(this.scoreDisplay);
            
            this.restartBtn = document.createElement('button');
            this.restartBtn.className = 'game-2048-restart';
            this.restartBtn.innerHTML = '<i class="fas fa-redo"></i> Chơi lại';
            this.restartBtn.addEventListener('click', () => this.restart());
            controlsWrapper.appendChild(this.restartBtn);
        } else {
            // Layout desktop giữ nguyên
            this.scoreDisplay = document.createElement('div');
            this.scoreDisplay.className = 'game-2048-score';
            this.scoreDisplay.innerHTML = `
                <div class="score-title">ĐIỂM</div>
                <div class="score-value">0</div>
            `;
            this.container.appendChild(this.scoreDisplay);
            
            this.restartBtn = document.createElement('button');
            this.restartBtn.className = 'game-2048-restart';
            this.restartBtn.innerHTML = '<i class="fas fa-redo"></i> Chơi lại';
            this.restartBtn.addEventListener('click', () => this.restart());
            this.container.appendChild(this.restartBtn);
        }
        
        // Tạo các ô lưới
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'game-2048-cell';
                cell.style.width = `${this.cellSize - 10}px`;
                cell.style.height = `${this.cellSize - 10}px`;
                cell.style.top = `${i * this.cellSize + 5}px`;
                cell.style.left = `${j * this.cellSize + 5}px`;
                this.board.appendChild(cell);
            }
        }
        
        // Thêm phần hiển thị điểm
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'game-2048-score';
        this.scoreDisplay.innerHTML = `
            <div class="score-title">ĐIỂM</div>
            <div class="score-value">0</div>
        `;
        this.container.appendChild(this.scoreDisplay);
        
        // Thêm nút chơi lại
        this.restartBtn = document.createElement('button');
        this.restartBtn.className = 'game-2048-restart';
        this.restartBtn.innerHTML = '<i class="fas fa-redo"></i> Chơi lại';
        this.restartBtn.addEventListener('click', () => this.restart());
        this.container.appendChild(this.restartBtn);
    }

    setupControls() {
        // Điều khiển bằng bàn phím
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && !this.keepPlaying) return;
            
            let moved = false;
            switch(e.key) {
                case 'ArrowUp':
                    moved = this.moveTiles('up');
                    break;
                case 'ArrowDown':
                    moved = this.moveTiles('down');
                    break;
                case 'ArrowLeft':
                    moved = this.moveTiles('left');
                    break;
                case 'ArrowRight':
                    moved = this.moveTiles('right');
                    break;
            }
            
            if (moved) {
                this.addRandomTile();
                this.updateView();
                
                if (!this.won && this.checkWin()) {
                    this.won = true;
                    this.showMessage('Bạn đã đạt 2048!', 'Tiếp tục chơi?');
                }
                
                if (this.checkGameOver()) {
                    this.gameOver = true;
                    this.showMessage('Game Over!', 'Chơi lại?');
                }
            }
        });
        
        // Điều khiển cảm ứng cho điện thoại
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.board.addEventListener('touchstart', (e) => {
            if (this.gameOver && !this.keepPlaying) return;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, {passive: true});
        
        this.board.addEventListener('touchend', (e) => {
            if (this.gameOver && !this.keepPlaying) return;
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            let moved = false;
            
            // Xác định hướng vuốt
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Vuốt ngang
                if (diffX > 50) {
                    moved = this.moveTiles('right');
                } else if (diffX < -50) {
                    moved = this.moveTiles('left');
                }
            } else {
                // Vuốt dọc
                if (diffY > 50) {
                    moved = this.moveTiles('down');
                } else if (diffY < -50) {
                    moved = this.moveTiles('up');
                }
            }
            
            if (moved) {
                this.addRandomTile();
                this.updateView();
                
                if (!this.won && this.checkWin()) {
                    this.won = true;
                    this.showMessage('Bạn đã đạt 2048!', 'Tiếp tục chơi?');
                }
                
                if (this.checkGameOver()) {
                    this.gameOver = true;
                    this.showMessage('Game Over!', 'Chơi lại?');
                }
            }
            
            touchStartX = 0;
            touchStartY = 0;
        }, {passive: false});
    }

    addRandomTile() {
        const emptyCells = [];
        
        // Tìm tất cả ô trống
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({i, j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            // Chọn ngẫu nhiên một ô trống
            const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // 90% là số 2, 10% là số 4
            this.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    moveTiles(direction) {
        let moved = false;
        const oldGrid = this.grid.map(row => [...row]);
        
        // Xử lý di chuyển theo hướng
        switch(direction) {
            case 'up':
                for (let j = 0; j < this.boardSize; j++) {
                    for (let i = 1; i < this.boardSize; i++) {
                        if (this.grid[i][j] !== 0) {
                            let newRow = i;
                            while (newRow > 0 && this.grid[newRow-1][j] === 0) {
                                newRow--;
                            }
                            
                            if (newRow > 0 && this.grid[newRow-1][j] === this.grid[i][j]) {
                                // Ghép ô
                                this.grid[newRow-1][j] *= 2;
                                this.grid[i][j] = 0;
                                this.score += this.grid[newRow-1][j];
                                moved = true;
                            } else if (newRow !== i) {
                                // Di chuyển ô
                                this.grid[newRow][j] = this.grid[i][j];
                                this.grid[i][j] = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
                
            case 'down':
                for (let j = 0; j < this.boardSize; j++) {
                    for (let i = this.boardSize - 2; i >= 0; i--) {
                        if (this.grid[i][j] !== 0) {
                            let newRow = i;
                            while (newRow < this.boardSize - 1 && this.grid[newRow+1][j] === 0) {
                                newRow++;
                            }
                            
                            if (newRow < this.boardSize - 1 && this.grid[newRow+1][j] === this.grid[i][j]) {
                                // Ghép ô
                                this.grid[newRow+1][j] *= 2;
                                this.grid[i][j] = 0;
                                this.score += this.grid[newRow+1][j];
                                moved = true;
                            } else if (newRow !== i) {
                                // Di chuyển ô
                                this.grid[newRow][j] = this.grid[i][j];
                                this.grid[i][j] = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
                
            case 'left':
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 1; j < this.boardSize; j++) {
                        if (this.grid[i][j] !== 0) {
                            let newCol = j;
                            while (newCol > 0 && this.grid[i][newCol-1] === 0) {
                                newCol--;
                            }
                            
                            if (newCol > 0 && this.grid[i][newCol-1] === this.grid[i][j]) {
                                // Ghép ô
                                this.grid[i][newCol-1] *= 2;
                                this.grid[i][j] = 0;
                                this.score += this.grid[i][newCol-1];
                                moved = true;
                            } else if (newCol !== j) {
                                // Di chuyển ô
                                this.grid[i][newCol] = this.grid[i][j];
                                this.grid[i][j] = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
                
            case 'right':
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = this.boardSize - 2; j >= 0; j--) {
                        if (this.grid[i][j] !== 0) {
                            let newCol = j;
                            while (newCol < this.boardSize - 1 && this.grid[i][newCol+1] === 0) {
                                newCol++;
                            }
                            
                            if (newCol < this.boardSize - 1 && this.grid[i][newCol+1] === this.grid[i][j]) {
                                // Ghép ô
                                this.grid[i][newCol+1] *= 2;
                                this.grid[i][j] = 0;
                                this.score += this.grid[i][newCol+1];
                                moved = true;
                            } else if (newCol !== j) {
                                // Di chuyển ô
                                this.grid[i][newCol] = this.grid[i][j];
                                this.grid[i][j] = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
        }
        
        return moved;
    }

    updateView() {
        const cells = this.board.querySelectorAll('.game-2048-cell');
        const scoreValue = this.board.parentElement.querySelector('.score-value');
        
        // Cập nhật điểm
        scoreValue.textContent = this.score;
        
        // Cập nhật các ô
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const index = i * this.boardSize + j;
                const cell = cells[index];
                const value = this.grid[i][j];
                
                cell.textContent = value === 0 ? '' : value;
                cell.className = 'game-2048-cell';
                
                if (value > 0) {
                    cell.classList.add(`game-2048-cell-${value}`);
                }
            }
        }
    }

    checkWin() {
        // Kiểm tra nếu có ô nào đạt 2048
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.grid[i][j] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    checkGameOver() {
        // Kiểm tra nếu còn ô trống
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
            }
        }
        
        // Kiểm tra nếu còn nước đi hợp lệ
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const value = this.grid[i][j];
                
                // Kiểm tra ô bên phải
                if (j < this.boardSize - 1 && this.grid[i][j+1] === value) {
                    return false;
                }
                
                // Kiểm tra ô bên dưới
                if (i < this.boardSize - 1 && this.grid[i+1][j] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }

    showMessage(title, message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'game-2048-message';
        msgDiv.innerHTML = `
            <div class="message-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="message-buttons">
                    <button class="game-btn continue-btn">Tiếp tục</button>
                    <button class="game-btn restart-btn">Chơi lại</button>
                </div>
            </div>
        `;
        
        msgDiv.querySelector('.continue-btn').addEventListener('click', () => {
            this.keepPlaying = true;
            msgDiv.remove();
        });
        
        msgDiv.querySelector('.restart-btn').addEventListener('click', () => {
            this.restart();
            msgDiv.remove();
        });
        
        this.container.appendChild(msgDiv);
    }

    restart() {
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        this.addRandomTile();
        this.addRandomTile();
        this.updateView();
    }

    destroy() {
        // Dọn dẹp event listeners
        document.removeEventListener('keydown', this.handleKeyPress);
        this.board.removeEventListener('touchstart', this.handleTouchStart);
        this.board.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// Khởi tạo trình quản lý trò chơi khi DOM được tải
document.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});
