// --- DOM & SETUP ---
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('status-display');
const messageBox = document.getElementById('messageBox');

// --- UTILITY FUNCTIONS ---
function showMessage(message, type = 'info', duration = 3000) {
    messageBox.textContent = message;
    messageBox.className = `message-box bg-${type} show`;
    setTimeout(() => { messageBox.classList.remove('show'); }, duration);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- VISUALIZER CLASS ---
class TwoDArrayVisualizer {
    constructor() {
        this.grid = [];
        this.isAnimating = false;
        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = Math.max(container.clientHeight, 400); // Ensure a minimum height
        this.draw();
    }

    draw(highlights = {}) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (this.grid.length === 0) return;

        const rows = this.grid.length;
        const cols = this.grid[0].length;
        
        const PADDING = 40;
        const cellWidth = (canvas.width - PADDING * 2) / cols;
        const cellHeight = (canvas.height - PADDING * 2) / rows;
        const fontSize = Math.min(cellWidth, cellHeight) / 2.5;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = PADDING + c * cellWidth;
                const y = PADDING + r * cellHeight;
                const key = `${r}-${c}`;

                // Draw cell background
                ctx.fillStyle = highlights[key] || '#f8fafc'; // slate-50
                ctx.fillRect(x, y, cellWidth, cellHeight);

                // Draw cell border
                ctx.strokeStyle = '#cbd5e1'; // slate-300
                ctx.strokeRect(x, y, cellWidth, cellHeight);
                
                // Draw cell value
                ctx.fillStyle = '#1e293b'; // slate-800
                ctx.font = `bold ${fontSize}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.grid[r][c], x + cellWidth / 2, y + cellHeight / 2);
            }
        }
        
        // Draw indices
        ctx.font = `${fontSize * 0.8}px Fira Code`;
        ctx.fillStyle = '#64748b'; // slate-500
        for (let c = 0; c < cols; c++) { // Column indices
            const x = PADDING + c * cellWidth + cellWidth / 2;
            ctx.fillText(c, x, PADDING / 2);
        }
        for (let r = 0; r < rows; r++) { // Row indices
            const y = PADDING + r * cellHeight + cellHeight / 2;
            ctx.fillText(r, PADDING / 2 - 10, y);
        }
    }

    create(rows, cols) {
        if (this.isAnimating) return;
        if (rows <= 0 || rows > 10 || cols <= 0 || cols > 10) {
            showMessage('Please use dimensions between 1 and 10.', 'error');
            return;
        }
        statusDisplay.textContent = `Creating a ${rows}x${cols} grid...`;
        this.grid = Array.from({ length: rows }, () => 
            Array.from({ length: cols }, () => Math.floor(Math.random() * 90) + 10)
        );
        this.draw();
        showMessage(`Grid of size ${rows}x${cols} created.`, 'success');
        statusDisplay.textContent = 'Ready.';
    }

    async set(row, col, value) {
        if (this.isAnimating || !this.grid.length || row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) {
            showMessage('Invalid row or column index.', 'error');
            return;
        }
        this.isAnimating = true;
        statusDisplay.textContent = `Setting value at [${row}][${col}] to ${value}...`;
        
        this.grid[row][col] = value;
        this.draw({ [`${row}-${col}`]: '#4ade80' }); // Highlight green
        await sleep(800);
        this.draw();
        
        statusDisplay.textContent = 'Ready.';
        this.isAnimating = false;
    }

    async search(value) {
        if (this.isAnimating || !this.grid.length) return;
        this.isAnimating = true;

        let found = false;
        let foundPos = {};

        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                if(this.isAnimating == false) return; // Allow early exit
                
                statusDisplay.textContent = `Searching at [${r}][${c}]...`;
                const highlights = { [`${r}-${c}`]: '#fde047' }; // Highlight yellow
                this.draw(highlights);
                await sleep(150);

                if (this.grid[r][c] === value) {
                    found = true;
                    foundPos = { r, c };
                    break;
                }
            }
            if (found) break;
        }

        if (found) {
            statusDisplay.textContent = `Found ${value} at [${foundPos.r}][${foundPos.c}]!`;
            this.draw({ [`${foundPos.r}-${foundPos.c}`]: '#22c55e' }); // Highlight green
            showMessage(`Found ${value}!`, 'success');
        } else {
            statusDisplay.textContent = `Value ${value} not found in the grid.`;
            this.draw();
            showMessage(`${value} not found.`, 'error');
        }

        this.isAnimating = false;
    }

    setupEventListeners() {
        document.getElementById('create-btn').addEventListener('click', () => {
            const rows = parseInt(document.getElementById('create-rows').value);
            const cols = parseInt(document.getElementById('create-cols').value);
            this.create(rows, cols);
        });

        document.getElementById('set-btn').addEventListener('click', () => {
            const value = parseInt(document.getElementById('set-value').value);
            const row = parseInt(document.getElementById('set-row').value);
            const col = parseInt(document.getElementById('set-col').value);
            if ([value, row, col].some(isNaN)) {
                showMessage('Please enter valid numbers for value, row, and column.', 'error');
                return;
            }
            this.set(row, col, value);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            const value = parseInt(document.getElementById('search-value').value);
            if (isNaN(value)) {
                showMessage('Please enter a valid number to search for.', 'error');
                return;
            }
            this.search(value);
        });
    }
}

new TwoDArrayVisualizer();