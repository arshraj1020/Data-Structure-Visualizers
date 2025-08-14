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
    'clear': { complexity: 'O(1)', status: 'Clearing list...' }
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
        this.isAnimating = false;
        this.setupEventListeners();
        this.draw();
    }
    
    updateDisplayInfo() {
        infoDisplay.textContent = `Size: ${this.size}, Capacity: ${this.capacity}`;
    }

    draw(highlights = {}) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.updateDisplayInfo();

        const n = this.capacity;
        const cellWidth = Math.min(100, canvas.width / (n + 1));
        const cellHeight = 60;
        const spacing = 10;
        const totalWidth = n * (cellWidth + spacing);
        const startX = (canvas.width - totalWidth) / 2;
        const y = canvas.height / 2 - cellHeight;

        for (let i = 0; i < n; i++) {
            const x = startX + i * (cellWidth + spacing);

            // Draw cell
            ctx.beginPath();
            ctx.rect(x, y, cellWidth, cellHeight);
            if (i >= this.size) { // Unused capacity
                ctx.strokeStyle = '#cbd5e1';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            } else { // Used element
                ctx.fillStyle = highlights[i] || '#059669'; // Emerald
                ctx.fill();
            }

            // Draw value
            if (this.elements[i] !== null) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.elements[i], x + cellWidth / 2, y + cellHeight / 2);
            }

            // Draw index
            ctx.fillStyle = '#475569';
            ctx.font = '12px Fira Code';
            ctx.textAlign = 'center';
            ctx.fillText(i, x + cellWidth / 2, y + cellHeight + 20);
        }
    }

    async resize() {
        this.isAnimating = true;
        updateInfo('resize');
        await sleep(500);

        const newCapacity = this.capacity * 2;
        const newElements = new Array(newCapacity).fill(null);
        
        for (let i = 0; i < this.size; i++) {
            statusDisplay.textContent = `Copying element ${this.elements[i]}...`;
            newElements[i] = this.elements[i];
            this.draw({[i]:'#f59e0b'}); // Highlight copying element
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
        
        if (this.size === this.capacity) {
            await this.resize();
        }

        this.isAnimating = true;
        updateInfo('add');
        
        const index = this.size;
        this.elements[index] = value;
        this.size++;
        
        this.draw({[index]: '#16a34a'}); // Highlight new element
        await sleep(600);
        
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async addAtIndex(index, value) {
        if (this.isAnimating || !value || index < 0 || index > this.size) {
            showMessage("Index out of bounds.", "error");
            return;
        }

        if (this.size === this.capacity) {
            await this.resize();
        }
        this.isAnimating = true;
        updateInfo('add-at');
        
        // Shift elements to the right
        for (let i = this.size; i > index; i--) {
            this.elements[i] = this.elements[i-1];
            this.draw({[i-1]: '#f59e0b', [i]: '#fde047'});
            await sleep(200);
        }
        
        this.elements[index] = value;
        this.size++;
        
        this.draw({[index]: '#16a34a'});
        await sleep(600);
        
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async remove(index) {
        if (this.isAnimating || index < 0 || index >= this.size) {
            showMessage("Index out of bounds.", "error");
            return;
        }
        this.isAnimating = true;
        updateInfo('remove');
        
        this.draw({[index]: '#ef4444'});
        await sleep(400);
        this.elements[index] = null;
        
        // Shift elements to the left
        for(let i = index; i < this.size - 1; i++) {
            this.elements[i] = this.elements[i+1];
            this.draw({[i]: '#f59e0b', [i+1]: '#fde047'});
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
            showMessage("Index out of bounds.", "error");
            return;
        }
        this.isAnimating = true;
        updateInfo('get');
        this.draw({[index]: '#3b82f6'}); // Highlight blue
        showMessage(`Value at index ${index} is ${this.elements[index]}`, 'info');
        await sleep(1000);
        this.draw();
        updateInfo(null);
        this.isAnimating = false;
    }
    
    async set(index, value) {
         if (this.isAnimating || !value || index < 0 || index >= this.size) {
            showMessage("Index out of bounds.", "error");
            return;
        }
        this.isAnimating = true;
        updateInfo('set');
        this.elements[index] = value;
        this.draw({[index]: '#16a34a'}); // Highlight green
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

    setupEventListeners() {
        const valueInput = document.getElementById('value-input');
        const indexInput = document.getElementById('index-input');

        document.getElementById('add-btn').addEventListener('click', () => this.add(valueInput.value));
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
        
        document.getElementById('add-at-btn').addEventListener('click', () => {
            const index = parseInt(indexInput.value);
            this.addAtIndex(index, valueInput.value);
        });
        document.getElementById('remove-btn').addEventListener('click', () => {
            const index = parseInt(indexInput.value);
            this.remove(index);
        });
        document.getElementById('get-btn').addEventListener('click', () => {
            const index = parseInt(indexInput.value);
            this.get(index);
        });
        document.getElementById('set-btn').addEventListener('click', () => {
            const index = parseInt(indexInput.value);
            this.set(index, valueInput.value);
        });
    }
}

new ArrayListVisualizer();