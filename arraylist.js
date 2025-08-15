// --- DOM & SETUP ---
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('status-display');
const complexityDisplay = document.getElementById('complexity-display');
const infoDisplay = document.getElementById('info-display');
const messageBox = document.getElementById('messageBox');

// --- UTILITY FUNCTIONS ---
function showMessage(message, type = 'info', duration = 3000) {
    messageBox.textContent = message;
    messageBox.className = `message-box bg-${type} show`;
    setTimeout(() => { messageBox.classList.remove('show'); }, duration);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- OPERATION INFO ---
const INFO = {
    'add': { complexity: 'O(1) amortized', status: 'Adding element...' },
    'add-at': { complexity: 'O(n)', status: 'Adding at index...' },
    'remove': { complexity: 'O(n)', status: 'Removing at index...' },
    'get': { complexity: 'O(1)', status: 'Getting element...' },
    'set': { complexity: 'O(1)', status: 'Setting element...' },
    'resize': { complexity: 'O(n)', status: 'Resizing capacity...' },
    'clear': { complexity: 'O(1)', status: 'Clearing list...' },
    'sort': { complexity: 'O(n²)', status: 'Sorting (Bubble Sort)...' },
    'reverse': { complexity: 'O(n)', status: 'Reversing list...' },
};

function updateInfo(operation, statusText = null) {
    if (INFO[operation]) {
        complexityDisplay.textContent = INFO[operation].complexity;
        statusDisplay.textContent = statusText || INFO[operation].status;
    } else {
        complexityDisplay.textContent = 'O(?)';
        statusDisplay.textContent = 'Ready';
    }
}

// --- VISUALIZER CLASS ---
class ArrayListVisualizer {
    constructor(initialCapacity = 4) {
        this.elements = new Array(initialCapacity).fill(null);
        this.size = 0;
        this.capacity = initialCapacity;
        this.maxCapacity = 16;
        this.isAnimating = false;
        
        this.setupCanvas();
        this.setupEventListeners();
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        this.draw();
    }

    updateDisplayInfo() {
        infoDisplay.textContent = `Size: ${this.size}, Capacity: ${this.capacity}`;
    }

    draw(highlights = {}) {
        const rect = canvas.parentElement.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        this.updateDisplayInfo();

        const n = this.capacity;
        const cellSize = Math.min(60, (rect.width - 60) / n);
        const spacing = 8;
        const totalWidth = (n * cellSize) + ((n - 1) * spacing);
        const startX = (rect.width - totalWidth) / 2;
        const y = rect.height / 2 - cellSize;

        for (let i = 0; i < n; i++) {
            const x = startX + i * (cellSize + spacing);

            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, 8);

            if (i >= this.size) {
                ctx.strokeStyle = '#d1d5db';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                ctx.fillStyle = highlights[i] || '#10b981';
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
            }

            if (this.elements[i] !== null) {
                ctx.fillStyle = 'white';
                ctx.font = `bold ${cellSize * 0.4}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.elements[i], x + cellSize / 2, y + cellSize / 2);
            }

            ctx.fillStyle = '#4b5563';
            ctx.font = `${cellSize * 0.25}px Fira Code`;
            ctx.textAlign = 'center';
            ctx.fillText(i, x + cellSize / 2, y + cellSize + 15);
        }
    }

    async resize() {
        this.isAnimating = true;
        updateInfo('resize');
        await sleep(500);
        
        let newCapacity = this.capacity * 2;
        if (newCapacity > this.maxCapacity) {
            newCapacity = this.maxCapacity;
        }

        const newElements = new Array(newCapacity).fill(null);
        
        for (let i = 0; i < this.size; i++) {
            statusDisplay.textContent = `Copying element ${this.elements[i]}...`;
            newElements[i] = this.elements[i];
            this.draw({[i]:'#f59e0b'});
            await sleep(250);
        }
        
        this.elements = newElements;
        this.capacity = newCapacity;

        statusDisplay.textContent = `Resize complete. New capacity is ${this.capacity}.`;
        this.draw();
        await sleep(800);
        updateInfo(null);
        this.isAnimating = false;
    }

    async add(value) {
        if (this.isAnimating || !value) return;
        
        if (this.size === this.maxCapacity) {
            showMessage(`Sorry, we can only store ${this.maxCapacity} elements for now.`, "error");
            return;
        }
        
        if (this.size === this.capacity) {
            await this.resize();
        }

        this.isAnimating = true;
        updateInfo('add');
        
        const index = this.size;
        this.elements[index] = value;
        this.size++;
        
        this.draw({[index]: '#34d399'});
        await sleep(600);
        
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async addAtIndex(index, value) {
        if (this.isAnimating || !value || index < 0 || index > this.size) {
            if (!this.isAnimating) showMessage("Index out of bounds.", "error");
            return;
        }

        if (this.size === this.maxCapacity) {
            showMessage(`Sorry, we can only store ${this.maxCapacity} elements for now.`, "error");
            return;
        }

        if (this.size === this.capacity) {
            await this.resize();
        }
        this.isAnimating = true;
        updateInfo('add-at');
        
        for (let i = this.size; i > index; i--) {
            this.elements[i] = this.elements[i-1];
            this.draw({[i-1]: '#fbbf24', [i]: '#fde68a'});
            await sleep(200);
        }
        
        this.elements[index] = value;
        this.size++;
        
        this.draw({[index]: '#34d399'});
        await sleep(600);
        
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async remove(index) {
        if (this.isAnimating || index < 0 || index >= this.size) {
            if (!this.isAnimating) showMessage("Index out of bounds.", "error");
            return;
        }
        this.isAnimating = true;
        updateInfo('remove');
        
        this.draw({[index]: '#f87171'});
        await sleep(400);
        this.elements[index] = null;
        
        for(let i = index; i < this.size - 1; i++) {
            this.elements[i] = this.elements[i+1];
            this.draw({[i]: '#fbbf24', [i+1]: '#fde68a'});
            await sleep(200);
        }
        this.elements[this.size-1] = null;
        this.size--;
        
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async get(index) {
        if (this.isAnimating || index < 0 || index >= this.size) {
            if (!this.isAnimating) showMessage("Index out of bounds.", "error");
            return;
        }
        this.isAnimating = true;
        updateInfo('get');
        this.draw({[index]: '#60a5fa'});
        showMessage(`Value at index ${index} is ${this.elements[index]}`, 'info');
        await sleep(1000);
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async set(index, value) {
         if (this.isAnimating || !value || index < 0 || index >= this.size) {
            if (!this.isAnimating) showMessage("Index out of bounds.", "error");
            return;
        }
        this.isAnimating = true;
        updateInfo('set');
        this.elements[index] = value;
        this.draw({[index]: '#34d399'});
        showMessage(`Set value at index ${index} to ${value}`, 'success');
        await sleep(1000);
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }

    clear() {
        if (this.isAnimating) return;
        updateInfo('clear');
        this.elements = new Array(this.capacity).fill(null);
        this.size = 0;
        this.draw();
        showMessage("ArrayList cleared.", "success");
        updateInfo(null);
    }

    // --- NEW: Bubble Sort implementation ---
    async sort() {
        if (this.isAnimating || this.size <= 1) return;
        this.isAnimating = true;
        updateInfo('sort');

        for (let i = 0; i < this.size - 1; i++) {
            for (let j = 0; j < this.size - i - 1; j++) {
                // Highlight elements being compared
                this.draw({ [j]: '#fbbf24', [j + 1]: '#fbbf24' });
                await sleep(300);

                if (parseInt(this.elements[j]) > parseInt(this.elements[j + 1])) {
                    // Highlight elements to be swapped
                    this.draw({ [j]: '#f87171', [j + 1]: '#f87171' });
                    await sleep(300);

                    [this.elements[j], this.elements[j + 1]] = [this.elements[j + 1], this.elements[j]];

                    // Show the result of the swap
                    this.draw({ [j]: '#34d399', [j + 1]: '#34d399' });
                    await sleep(300);
                }
            }
        }

        this.draw();
        showMessage("Sorting complete.", "success");
        updateInfo(null);
        this.isAnimating = false;
    }

    // --- NEW: Reverse implementation ---
    async reverse() {
        if (this.isAnimating || this.size <= 1) return;
        this.isAnimating = true;
        updateInfo('reverse');

        let left = 0;
        let right = this.size - 1;

        while (left < right) {
            // Highlight elements to be swapped
            this.draw({ [left]: '#8b5cf6', [right]: '#8b5cf6' });
            await sleep(400);

            [this.elements[left], this.elements[right]] = [this.elements[right], this.elements[left]];

            // Show the result of the swap
            this.draw({ [left]: '#34d399', [right]: '#34d399' });
            await sleep(400);

            left++;
            right--;
        }

        this.draw();
        showMessage("Reversing complete.", "success");
        updateInfo(null);
        this.isAnimating = false;
    }

    setupEventListeners() {
        const valueInput = document.getElementById('value-input');
        const indexInput = document.getElementById('index-input');

        document.getElementById('add-btn').addEventListener('click', () => this.add(valueInput.value));
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
        document.getElementById('sort-btn').addEventListener('click', () => this.sort());
        document.getElementById('reverse-btn').addEventListener('click', () => this.reverse());
        
        const handleIndexOp = (func) => {
            if (isNaN(parseInt(indexInput.value))) {
                showMessage("Please enter a valid index.", "error");
                return;
            }
            func(parseInt(indexInput.value), valueInput.value);
        };

        document.getElementById('add-at-btn').addEventListener('click', () => handleIndexOp(this.addAtIndex.bind(this)));
        document.getElementById('remove-btn').addEventListener('click', () => handleIndexOp(this.remove.bind(this)));
        document.getElementById('get-btn').addEventListener('click', () => handleIndexOp(this.get.bind(this)));
        document.getElementById('set-btn').addEventListener('click', () => handleIndexOp(this.set.bind(this)));
    }
}

new ArrayListVisualizer();