// 🔢 2048 - Puzzle, hỗ trợ nâng cao (DevMode) với AI, ghost tile, nhiều kích thước, hoàn tác toàn cục
import { audioEngine } from '../../core/audio-engine.js';
import { storage } from '../../core/storage.js';
import { isDevMode } from '../../core/devMode.js';

const boardEl = document.getElementById('board');
const scoreSpan = document.getElementById('score');
const bestSpan = document.getElementById('best');
const movesSpan = document.getElementById('moves');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const sizeSelect = document.getElementById('sizeSelect');

let SIZE = 4;
let grid = [];
let score = 0;
let bestScore = 0;
let moves = 0;
let gameActive = true;
let paused = false;
let history = [];
let selectedCell = null;
let highestTileNotified = 0;

let aiEnabled = false;
let ghostEnabled = false;
let pendingTile = null;
let aiInterval = null;

let advancedPanel = null, panelVisible = false;

audioEngine.init();

function initGrid() {
    grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    score = 0;
    moves = 0;
    gameActive = true;
    paused = false;
    history = [];
    selectedCell = null;
    highestTileNotified = 0;
    updateUI();
    addRandomTile(true);
    addRandomTile();
    updatePendingTile();
    renderBoard();
    boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`;
}

function updatePendingTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) empty.push({ r, c });
        }
    }
    if (empty.length > 0) {
        const pos = empty[Math.floor(Math.random() * empty.length)];
        pendingTile = { r: pos.r, c: pos.c, value: Math.random() < 0.9 ? 2 : 4 };
    } else {
        pendingTile = null;
    }
}

function addRandomTile(isInitial = false) {
    if (!isInitial && pendingTile) {
        if (grid[pendingTile.r]?.[pendingTile.c] === 0) {
            grid[pendingTile.r][pendingTile.c] = pendingTile.value;
            pendingTile = null;
            return true;
        }
        pendingTile = null;
    }
    const empty = [];
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
            if (grid[r][c] === 0) empty.push({ r, c });
    if (empty.length === 0) return false;
    const pos = empty[Math.floor(Math.random() * empty.length)];
    const val = isInitial ? (Math.random() < 0.9 ? 2 : 4) : (Math.random() < 0.9 ? 2 : 4);
    grid[pos.r][pos.c] = val;
    return true;
}

function renderBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'tile';
            const val = grid[r][c];
            if (val > 0) {
                cell.dataset.value = val;
                cell.textContent = val;
            }
            if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
                cell.style.boxShadow = 'inset 0 0 0 3px white';
            }
            if (ghostEnabled && pendingTile && pendingTile.r === r && pendingTile.c === c && val === 0) {
                cell.classList.add('ghost');
                cell.textContent = pendingTile.value;
                cell.dataset.value = pendingTile.value;
            }
            cell.addEventListener('click', () => handleCellClick(r, c));
            boardEl.appendChild(cell);
        }
    }
    if (!gameActive) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `<p>💀 Game Over</p><button id="restartOverlay">Chơi lại</button>`;
        boardEl.appendChild(overlay);
        document.getElementById('restartOverlay')?.addEventListener('click', restart);
    } else {
        checkAndShowVictory();
    }
}

function checkAndShowVictory() {
    const maxTile = Math.max(...grid.flat());
    if (maxTile >= 2048 && maxTile > highestTileNotified) {
        highestTileNotified = maxTile;
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `<p>🎉 Chúc mừng! Bạn đã đạt ${maxTile}!</p><button id="continueOverlay">Tiếp tục</button>`;
        boardEl.appendChild(overlay);
        document.getElementById('continueOverlay').addEventListener('click', () => renderBoard());
    }
}

function updateUI() {
    scoreSpan.textContent = score;
    bestSpan.textContent = bestScore;
    movesSpan.textContent = moves;
}

function canMove() {
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) return true;
            if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
            if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
        }
    return false;
}

function checkGameState() {
    if (!canMove()) {
        gameActive = false;
        renderBoard();
        return false;
    }
    return true;
}

function move(direction) {
    if (!gameActive || paused) return false;
    const oldGrid = grid.map(row => [...row]);
    const oldScore = score;
    let moved = false;
    const vectors = {
        0: { dr: -1, dc: 0, sr: 0, er: SIZE, sr2: 1, sc: 0, ec: SIZE, sc2: 1 },
        1: { dr: 0, dc: 1, sr: 0, er: SIZE, sr2: 1, sc: SIZE - 1, ec: -1, sc2: -1 },
        2: { dr: 1, dc: 0, sr: SIZE - 1, er: -1, sr2: -1, sc: 0, ec: SIZE, sc2: 1 },
        3: { dr: 0, dc: -1, sr: 0, er: SIZE, sr2: 1, sc: 0, ec: SIZE, sc2: 1 }
    };
    const v = vectors[direction];
    const traversed = Array(SIZE).fill().map(() => Array(SIZE).fill(false));

    for (let r = v.sr; r !== v.er; r += v.sr2) {
        for (let c = v.sc; c !== v.ec; c += v.sc2) {
            if (grid[r][c] === 0) continue;
            let cr = r, cc = c;
            while (true) {
                const nr = cr + v.dr, nc = cc + v.dc;
                if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
                if (grid[nr][nc] === 0) {
                    grid[nr][nc] = grid[cr][cc];
                    grid[cr][cc] = 0;
                    cr = nr; cc = nc;
                    moved = true;
                } else if (grid[nr][nc] === grid[cr][cc] && !traversed[nr][nc]) {
                    grid[nr][nc] *= 2;
                    score += grid[nr][nc];
                    grid[cr][cc] = 0;
                    traversed[nr][nc] = true;
                    moved = true;
                    break;
                } else break;
            }
        }
    }

    if (moved) {
        moves++;
        history.push({ grid: oldGrid, score: oldScore, moves: moves - 1 });
        if (history.length > 20) history.shift();
        addRandomTile();
        updatePendingTile();
        updateUI();
        renderBoard();
        checkGameState();
        audioEngine.play('move');
        saveBest();
        return true;
    }
    return false;
}

// --- Hoàn tác (có sẵn cho mọi người) ---
function undo() {
    if (history.length === 0 || !gameActive) return;
    const last = history.pop();
    grid = last.grid;
    score = last.score;
    moves = last.moves;
    gameActive = true;
    selectedCell = null;
    updatePendingTile(); // tính lại pending tile từ bàn cờ đã khôi phục
    updateUI();
    renderBoard();
    audioEngine.play('click');
}

function handleCellClick(r, c) {
    if (!isDevMode() || !gameActive || paused) return;
    if (grid[r][c] !== 0) {
        selectedCell = { r, c };
        renderBoard();
    } else {
        selectedCell = null;
        renderBoard();
    }
}

// --- Cheat functions (chỉ DevMode) ---
function deleteSelectedCell() {
    if (!selectedCell || !gameActive || paused) return;
    const nonEmptyCount = grid.flat().filter(v => v !== 0).length;
    if (nonEmptyCount <= 1) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `<p>⚠️ Không thể xóa ô cuối cùng!</p><button id="okOverlay">OK</button>`;
        boardEl.appendChild(overlay);
        document.getElementById('okOverlay').addEventListener('click', () => renderBoard());
        return;
    }
    grid[selectedCell.r][selectedCell.c] = 0;
    selectedCell = null;
    updatePendingTile();
    updateUI();
    renderBoard();
}

function modifySelectedCell(factor) {
    if (!selectedCell || !gameActive || paused) return;
    const val = grid[selectedCell.r][selectedCell.c];
    if (val === 0) return;
    let newVal = factor === 2 ? val * 2 : Math.max(2, Math.floor(val / 2));
    grid[selectedCell.r][selectedCell.c] = newVal;
    selectedCell = null;
    updateUI();
    renderBoard();
}

function moveSelectedCell(dr, dc) {
    if (!selectedCell || !gameActive || paused) return;
    const nr = selectedCell.r + dr, nc = selectedCell.c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc] === 0) {
        grid[nr][nc] = grid[selectedCell.r][selectedCell.c];
        grid[selectedCell.r][selectedCell.c] = 0;
        selectedCell = { r: nr, c: nc };
        updatePendingTile();
        updateUI();
        renderBoard();
    }
}

function startAI() {
    if (!aiEnabled || !gameActive || paused) return;
    const dirs = [0, 1, 2, 3];
    let bestDir = -1, bestEval = -Infinity;
    for (const dir of dirs) {
        const simGrid = grid.map(row => [...row]);
        if (simulateMove(simGrid, dir)) {
            const empty = simGrid.flat().filter(v => v === 0).length;
            const maxVal = Math.max(...simGrid.flat());
            const smooth = calculateSmoothness(simGrid);
            const scoreEval = empty * 10 + maxVal + smooth * 0.1;
            if (scoreEval > bestEval) {
                bestEval = scoreEval;
                bestDir = dir;
            }
        }
    }
    if (bestDir >= 0) move(bestDir);
    if (aiEnabled && gameActive && !paused) aiInterval = setTimeout(startAI, 150);
}

function simulateMove(g, dir) {
    const v = {
        0: [-1,0,0,SIZE,1,0,SIZE,1],
        1: [0,1,0,SIZE,1,SIZE-1,-1,-1],
        2: [1,0,SIZE-1,-1,-1,0,SIZE,1],
        3: [0,-1,0,SIZE,1,0,SIZE,1]
    }[dir];
    const [dr, dc, sr, er, sr2, sc, ec, sc2] = v;
    const visited = Array(SIZE).fill().map(()=>Array(SIZE).fill(false));
    let moved = false;
    for (let r = sr; r !== er; r += sr2) {
        for (let c = sc; c !== ec; c += sc2) {
            if (g[r][c]===0) continue;
            let cr=r, cc=c;
            while (true) {
                const nr=cr+dr, nc=cc+dc;
                if (nr<0||nr>=SIZE||nc<0||nc>=SIZE) break;
                if (g[nr][nc]===0) { g[nr][nc]=g[cr][cc]; g[cr][cc]=0; cr=nr; cc=nc; moved=true; }
                else if (g[nr][nc]===g[cr][cc] && !visited[nr][nc]) { g[nr][nc]*=2; g[cr][cc]=0; visited[nr][nc]=true; moved=true; break; }
                else break;
            }
        }
    }
    return moved;
}

function calculateSmoothness(g) {
    let smooth = 0;
    for (let r=0; r<SIZE; r++) for (let c=0; c<SIZE; c++) {
        if (g[r][c]===0) continue;
        const val = Math.log2(g[r][c]);
        if (c<SIZE-1 && g[r][c+1]!==0) smooth -= Math.abs(val - Math.log2(g[r][c+1]));
        if (r<SIZE-1 && g[r+1][c]!==0) smooth -= Math.abs(val - Math.log2(g[r+1][c]));
    }
    return smooth;
}

function toggleAI() {
    aiEnabled = !aiEnabled;
    if (aiEnabled) { clearTimeout(aiInterval); startAI(); }
    else clearTimeout(aiInterval);
    refreshAdvancedPanel();
}

// --- Sự kiện bàn phím ---
document.addEventListener('keydown', (e) => {
    if (e.key === '`') { e.preventDefault(); toggleAdvancedPanel(); return; }

    // Hoàn tác cho mọi chế độ: Ctrl+Z hoặc U
    if ((e.ctrlKey && e.key === 'z') || (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        undo();
        return;
    }

    if (!isDevMode()) {
        if (!gameActive || paused || aiEnabled) return;
        switch (e.key) {
            case 'ArrowUp': e.preventDefault(); move(0); break;
            case 'ArrowRight': e.preventDefault(); move(1); break;
            case 'ArrowDown': e.preventDefault(); move(2); break;
            case 'ArrowLeft': e.preventDefault(); move(3); break;
        }
        return;
    }

    // DevMode
    if (aiEnabled && ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)) return;
    if (selectedCell && ['w','a','s','d'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        switch (e.key.toLowerCase()) {
            case 'w': moveSelectedCell(-1,0); break;
            case 's': moveSelectedCell(1,0); break;
            case 'a': moveSelectedCell(0,-1); break;
            case 'd': moveSelectedCell(0,1); break;
        }
        return;
    }
    if (['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        selectedCell = null;
        switch (e.key) {
            case 'ArrowUp': move(0); break;
            case 'ArrowRight': move(1); break;
            case 'ArrowDown': move(2); break;
            case 'ArrowLeft': move(3); break;
        }
        return;
    }
    e.preventDefault();
    switch (e.key) {
        case 'q': case 'Q': toggleAI(); break;
        case 'e': case 'E': ghostEnabled = !ghostEnabled; refreshAdvancedPanel(); renderBoard(); break;
        case 't': case 'T':
            if (gameActive && !paused) {
                const val = highestTileNotified >= 2048 ? highestTileNotified * 2 : 2048;
                for (let r=0; r<SIZE; r++) for (let c=0; c<SIZE; c++) if (grid[r][c]===0) {
                    grid[r][c]=val; score+=val; updatePendingTile(); updateUI(); renderBoard(); return;
                }
            }
            break;
        case 'x': case 'X': deleteSelectedCell(); break;
        case '+': case '=': modifySelectedCell(2); break;
        case '-': modifySelectedCell(0.5); break;
        case 'c': case 'C': score += 1024; updateUI(); saveBest(); break;
        case 'r': case 'R': restart(); break;
    }
});

// --- Cảm ứng ---
let touchX0, touchY0;
boardEl.addEventListener('touchstart', e => {
    touchX0 = e.touches[0].clientX;
    touchY0 = e.touches[0].clientY;
}, { passive: true });
boardEl.addEventListener('touchend', e => {
    if (!gameActive || paused || aiEnabled || isDevMode()) return;
    const dx = e.changedTouches[0].clientX - touchX0;
    const dy = e.changedTouches[0].clientY - touchY0;
    if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 1 : 3);
    } else if (Math.abs(dy) > Math.abs(dx)) {
        move(dy > 0 ? 2 : 0);
    }
});

// --- Nút điều khiển ---
pauseBtn.addEventListener('click', () => {
    if (!gameActive) return;
    paused = !paused;
    pauseBtn.textContent = paused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
    if (aiEnabled) paused ? clearTimeout(aiInterval) : startAI();
});
restartBtn.addEventListener('click', restart);
fullscreenBtn.addEventListener('click', () => document.documentElement.requestFullscreen());

function restart() {
    clearTimeout(aiInterval);
    aiEnabled = false;
    initGrid();
    refreshAdvancedPanel();
}

// --- Điểm cao ---
async function loadBest() {
    try {
        await storage.openDB();
        const data = await storage.getAll('gameScores');
        const entry = data.find(s => s.gameName === '2048');
        bestScore = entry ? entry.score : 0;
    } catch (_) {}
    bestSpan.textContent = bestScore;
}
async function saveBest() {
    if (score > bestScore) {
        bestScore = score;
        bestSpan.textContent = bestScore;
        try {
            await storage.openDB();
            const tx = storage.db.transaction('gameScores', 'readwrite');
            tx.objectStore('gameScores').put({ gameName: '2048', score: bestScore });
        } catch (_) {}
    }
}

// --- DevMode Panel ---
function createAdvancedPanel() {
    if (!isDevMode()) return;
    advancedPanel = document.createElement('div');
    advancedPanel.id = 'advanced-panel';
    advancedPanel.style.display = 'none';
    advancedPanel.innerHTML = `
    <style>#advanced-panel{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;padding:12px;border-radius:8px;z-index:9999;font-size:12px;max-width:280px;border:1px solid #0f0;}.on{color:#0f0;}.off{color:#f00;}</style>
    <div><b>HỖ TRỢ PHÁT TRIỂN</b> (phím \`)</div>
    <div>[Q] AI tự động: <span id="ai-stat" class="off">OFF</span></div>
    <div>[E] Ghost tile: <span id="ghost-stat" class="off">OFF</span></div>
    <div>[T] Thắng ngay (2048+)</div>
    <div>[X] Xóa ô đã chọn (click chọn ô)</div>
    <div>[+]/[-] Nhân/Chia ô đã chọn</div>
    <div>[WASD] Di chuyển ô đã chọn</div>
    <div>[U] Hoàn tác</div>
    <div>[C] +1000 điểm</div>
    <div>[R] Chơi lại</div>
    `;
    document.body.appendChild(advancedPanel);
    refreshAdvancedPanel();
}

function refreshAdvancedPanel() {
    if (!advancedPanel) return;
    document.getElementById('ai-stat').textContent = aiEnabled ? 'ON' : 'OFF';
    document.getElementById('ai-stat').className = aiEnabled ? 'on' : 'off';
    document.getElementById('ghost-stat').textContent = ghostEnabled ? 'ON' : 'OFF';
    document.getElementById('ghost-stat').className = ghostEnabled ? 'on' : 'off';
}

function toggleAdvancedPanel() {
    if (!isDevMode() || !advancedPanel) return;
    panelVisible = !panelVisible;
    advancedPanel.style.display = panelVisible ? 'block' : 'none';
}

sizeSelect.addEventListener('change', () => {
    SIZE = parseInt(sizeSelect.value);
    restart();
});

// --- Khởi động ---
loadBest().then(() => {
    createAdvancedPanel();
    initGrid();
});