const GRID_WIDTH = 8;
        const GRID_HEIGHT = 12;
        const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        
        let grid = [];
        let currentPiece = null;
        let nextPiece = null;
        let gameRunning = false;
        let gamePaused = false;
        let score = 0;
        let lines = 0;
        let level = 1;
        let dropTimer = null;
        let dropInterval = 1000;

        // Tetris-like pieces but with color matching focus
        const PIECES = [
            // I-piece (line)
            {
                shape: [[1, 1, 1, 1]],
                color: () => COLORS[Math.floor(Math.random() * COLORS.length)]
            },
            // O-piece (square)
            {
                shape: [[1, 1], [1, 1]],
                color: () => COLORS[Math.floor(Math.random() * COLORS.length)]
            },
            // T-piece
            {
                shape: [[0, 1, 0], [1, 1, 1]],
                color: () => COLORS[Math.floor(Math.random() * COLORS.length)]
            },
            // L-piece
            {
                shape: [[1, 0], [1, 0], [1, 1]],
                color: () => COLORS[Math.floor(Math.random() * COLORS.length)]
            },
            // Special star piece (power-up)
            {
                shape: [[1]],
                color: () => 'star',
                special: true
            }
        ];

        function initGrid() {
            grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
            const gridElement = document.getElementById('grid');
            gridElement.innerHTML = '';
            
            for (let i = 0; i < GRID_HEIGHT * GRID_WIDTH; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${i}`;
                gridElement.appendChild(cell);
            }
        }

        function createPiece() {
            const pieceTemplate = PIECES[Math.floor(Math.random() * PIECES.length)];
            return {
                shape: pieceTemplate.shape.map(row => [...row]),
                color: pieceTemplate.color(),
                x: Math.floor(GRID_WIDTH / 2) - Math.floor(pieceTemplate.shape[0].length / 2),
                y: 0,
                special: pieceTemplate.special || false
            };
        }

        function drawGrid() {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const cell = document.getElementById(`cell-${y * GRID_WIDTH + x}`);
                    const gridValue = grid[y][x];
                    
                    cell.className = 'cell';
                    if (gridValue) {
                        cell.classList.add('filled', gridValue.color);
                        if (gridValue.special) {
                            cell.innerHTML = '<div class="power-up">⭐</div>';
                        } else {
                            cell.innerHTML = '';
                        }
                    } else {
                        cell.innerHTML = '';
                    }
                }
            }
        }

        function drawCurrentPiece() {
            if (!currentPiece) return;
            
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const gridX = currentPiece.x + x;
                        const gridY = currentPiece.y + y;
                        
                        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                            const cell = document.getElementById(`cell-${gridY * GRID_WIDTH + gridX}`);
                            cell.classList.add('filled', currentPiece.color);
                            if (currentPiece.special) {
                                cell.innerHTML = '<div class="power-up">⭐</div>';
                            }
                        }
                    }
                }
            }
        }

        function drawNextPiece() {
            const nextGrid = document.getElementById('next-grid');
            nextGrid.innerHTML = '';
            
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement('div');
                cell.className = 'next-cell';
                nextGrid.appendChild(cell);
            }
            
            if (!nextPiece) return;
            
            for (let y = 0; y < nextPiece.shape.length; y++) {
                for (let x = 0; x < nextPiece.shape[y].length; x++) {
                    if (nextPiece.shape[y][x]) {
                        const cellIndex = (y + 1) * 4 + (x + 1);
                        const cell = nextGrid.children[cellIndex];
                        if (cell) {
                            cell.classList.add(nextPiece.color);
                            if (nextPiece.special) {
                                cell.innerHTML = '⭐';
                                cell.style.fontSize = '20px';
                                cell.style.textAlign = 'center';
                                cell.style.lineHeight = '30px';
                            }
                        }
                    }
                }
            }
        }

        function canMove(piece, dx, dy) {
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        const newX = piece.x + x + dx;
                        const newY = piece.y + y + dy;
                        
                        if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
                            return false;
                        }
                        
                        if (newY >= 0 && grid[newY][newX]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function placePiece() {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const gridX = currentPiece.x + x;
                        const gridY = currentPiece.y + y;
                        
                        if (gridY >= 0) {
                            grid[gridY][gridX] = {
                                color: currentPiece.color,
                                special: currentPiece.special
                            };
                        }
                    }
                }
            }
        }

        function checkMatches() {
            let matches = [];
            
            // Check horizontal matches
            for (let y = 0; y < GRID_HEIGHT; y++) {
                let count = 1;
                let currentColor = grid[y][0]?.color;
                
                for (let x = 1; x < GRID_WIDTH; x++) {
                    if (grid[y][x]?.color === currentColor && currentColor) {
                        count++;
                    } else {
                        if (count >= 3 && currentColor) {
                            for (let i = x - count; i < x; i++) {
                                matches.push({x: i, y: y});
                            }
                        }
                        count = 1;
                        currentColor = grid[y][x]?.color;
                    }
                }
                
                if (count >= 3 && currentColor) {
                    for (let i = GRID_WIDTH - count; i < GRID_WIDTH; i++) {
                        matches.push({x: i, y: y});
                    }
                }
            }
            
            // Check for star power-ups
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (grid[y][x]?.special) {
                        // Clear entire row
                        for (let i = 0; i < GRID_WIDTH; i++) {
                            matches.push({x: i, y: y});
                        }
                        break;
                    }
                }
            }
            
            return matches;
        }

        function clearMatches(matches) {
            matches.forEach(match => {
                grid[match.y][match.x] = null;
            });
            
            // Apply gravity
            for (let x = 0; x < GRID_WIDTH; x++) {
                let writeIndex = GRID_HEIGHT - 1;
                for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
                    if (grid[y][x]) {
                        grid[writeIndex][x] = grid[y][x];
                        if (writeIndex !== y) {
                            grid[y][x] = null;
                        }
                        writeIndex--;
                    }
                }
            }
            
            // Update score
            score += matches.length * 10 * level;
            lines += Math.floor(matches.length / GRID_WIDTH);
            level = Math.floor(lines / 10) + 1;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            
            updateUI();
        }

        function rotatePiece() {
            if (!currentPiece) return;
            
            const rotated = currentPiece.shape[0].map((_, i) =>
                currentPiece.shape.map(row => row[i]).reverse()
            );
            
            const originalShape = currentPiece.shape;
            currentPiece.shape = rotated;
            
            if (!canMove(currentPiece, 0, 0)) {
                currentPiece.shape = originalShape;
            }
        }

        function gameLoop() {
            if (!gameRunning || gamePaused) return;
            
            if (!currentPiece) {
                currentPiece = nextPiece || createPiece();
                nextPiece = createPiece();
                drawNextPiece();
                
                if (!canMove(currentPiece, 0, 0)) {
                    gameOver();
                    return;
                }
            }
            
            if (canMove(currentPiece, 0, 1)) {
                currentPiece.y++;
            } else {
                placePiece();
                currentPiece = null;
                
                const matches = checkMatches();
                if (matches.length > 0) {
                    clearMatches(matches);
                }
            }
            
            drawGrid();
            drawCurrentPiece();
            
            dropTimer = setTimeout(gameLoop, dropInterval);
        }

        function startGame() {
            if (gameRunning && !gamePaused) return;
            
            if (!gameRunning) {
                initGrid();
                score = 0;
                lines = 0;
                level = 1;
                dropInterval = 1000;
                currentPiece = null;
                nextPiece = createPiece();
            }
            
            gameRunning = true;
            gamePaused = false;
            document.getElementById('start-btn').disabled = true;
            document.getElementById('pause-btn').disabled = false;
            
            updateUI();
            gameLoop();
        }

        function pauseGame() {
            if (!gameRunning) return;
            
            gamePaused = !gamePaused;
            document.getElementById('pause-btn').textContent = gamePaused ? 'Resume' : 'Pause';
            
            if (!gamePaused) {
                gameLoop();
            } else {
                clearTimeout(dropTimer);
            }
        }

        function resetGame() {
            gameRunning = false;
            gamePaused = false;
            clearTimeout(dropTimer);
            
            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
            document.getElementById('pause-btn').textContent = 'Pause';
            
            initGrid();
            drawGrid();
            
            score = 0;
            lines = 0;
            level = 1;
            updateUI();
            
            const nextGrid = document.getElementById('next-grid');
            nextGrid.innerHTML = '';
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement('div');
                cell.className = 'next-cell';
                nextGrid.appendChild(cell);
            }
        }

        function gameOver() {
            gameRunning = false;
            clearTimeout(dropTimer);
            
            document.getElementById('final-score').innerHTML = `
                Final Score: ${score}<br>
                Lines Cleared: ${lines}<br>
                Level Reached: ${level}
            `;
            document.getElementById('game-over').style.display = 'flex';
            
            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
        }

        function updateUI() {
            document.getElementById('score').textContent = score;
            document.getElementById('lines').textContent = lines;
            document.getElementById('level').textContent = level;
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!gameRunning || gamePaused || !currentPiece) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (canMove(currentPiece, -1, 0)) {
                        currentPiece.x--;
                        drawGrid();
                        drawCurrentPiece();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (canMove(currentPiece, 1, 0)) {
                        currentPiece.x++;
                        drawGrid();
                        drawCurrentPiece();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (canMove(currentPiece, 0, 1)) {
                        currentPiece.y++;
                        drawGrid();
                        drawCurrentPiece();
                    }
                    break;
                case 'Space':
                    e.preventDefault();
                    rotatePiece();
                    drawGrid();
                    drawCurrentPiece();
                    break;
            }
        });

        // Initialize the game
        initGrid();
        drawGrid();
    