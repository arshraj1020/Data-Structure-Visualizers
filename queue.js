// --- DOM & SETUP ---
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('messageBox');
const statusDisplay = document.getElementById('status-display');
const complexityDisplay = document.getElementById('complexity-display');

// --- UTILITY FUNCTIONS ---
function showMessage(message, type = 'info', duration = 3000) {
    messageBox.textContent = message;
    messageBox.className = `message-box bg-${type} show`;
    setTimeout(() => { messageBox.classList.remove('show'); }, duration);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- OPERATION INFO ---
const INFO = {
    'enqueue': { complexity: 'O(1)', status: 'Enqueueing element...' },
    'dequeue': { complexity: 'O(n)', status: 'Dequeueing element...' },
    'peek': { complexity: 'O(1)', status: 'Peeking at front element...' },
    'isEmpty': { complexity: 'O(1)', status: 'Checking if queue is empty...' },
    'size': { complexity: 'O(1)', status: 'Getting queue size...' },
    'clear': { complexity: 'O(n)', status: 'Clearing the queue...' },
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
class QueueVisualizer {
    constructor() {
        this.queue = [];
        this.isAnimating = false;
        this.maxSize = 7;
        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        this.draw();
    }

    draw(highlights = {}) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const boxWidth = 100;
        const boxHeight = 60;
        const spacing = 20;
        const totalWidth = this.queue.length * (boxWidth + spacing) - spacing;
        let startX = (canvas.width - totalWidth) / 2;
        const y = canvas.height / 2 - boxHeight / 2;

        if (this.queue.length === 0) {
            ctx.font = "20px Inter";
            ctx.fillStyle = "#64748b";
            ctx.textAlign = "center";
            ctx.fillText("Queue is empty", canvas.width / 2, canvas.height / 2);
            return;
        }

        // Draw elements
        this.queue.forEach((value, i) => {
            const x = startX + i * (boxWidth + spacing);
            
            ctx.beginPath();
            ctx.rect(x, y, boxWidth, boxHeight);
            ctx.fillStyle = highlights[i] || '#059669';
            ctx.fill();
            ctx.strokeStyle = '#047857';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = "bold 18px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(value, x + boxWidth / 2, y + boxHeight / 2);
        });

        // Draw "Front" and "Rear" pointers
        const frontX = startX;
        const rearX = startX + (this.queue.length - 1) * (boxWidth + spacing);
        ctx.font = "bold 16px Inter";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        
        ctx.fillText("Front", frontX + boxWidth/2, y - 40);
        ctx.fillText("Rear", rearX + boxWidth/2, y + boxHeight + 40);
    }

    async enqueue(value) {
        if (this.isAnimating) return;
        if (this.queue.length >= this.maxSize) {
            showMessage(`Queue is full (max ${this.maxSize} elements)!`, 'error');
            return;
        }
        this.isAnimating = true;
        updateInfo('enqueue', `Enqueueing ${value}...`);
        
        this.queue.push(value);
        this.draw({ [this.queue.length - 1]: '#16a34a' });
        await sleep(600);
        this.draw();
        
        showMessage(`Enqueued ${value}`, 'success');
        updateInfo(null);
        this.isAnimating = false;
    }

    async dequeue() {
        if (this.isAnimating || this.queue.length === 0) {
            if (!this.isAnimating) showMessage('Queue is empty!', 'error');
            return;
        }
        this.isAnimating = true;
        updateInfo('dequeue');
        
        const dequeuedValue = this.queue[0];
        this.draw({ 0: '#ef4444' }); // Highlight front element red
        await sleep(600);
        
        this.queue.shift(); // O(n) operation
        this.draw();
        
        showMessage(`Dequeued ${dequeuedValue}`, 'success');
        updateInfo(null);
        this.isAnimating = false;
    }

    async peek() {
        if (this.isAnimating || this.queue.length === 0) {
            if (!this.isAnimating) showMessage('Queue is empty!', 'error');
            return;
        }
        this.isAnimating = true;
        updateInfo('peek');
        
        const frontValue = this.queue[0];
        this.draw({ 0: '#3b82f6' }); // Highlight front element blue
        await sleep(800);
        this.draw();
        
        showMessage(`Front element is ${frontValue}`, 'info');
        updateInfo(null);
        this.isAnimating = false;
    }

    isEmpty() {
        if (this.isAnimating) return;
        updateInfo('isEmpty');
        const empty = this.queue.length === 0;
        showMessage(`Is the queue empty? ${empty}`, empty ? 'success' : 'info');
        updateInfo(null);
    }

    size() {
        if (this.isAnimating) return;
        updateInfo('size');
        showMessage(`The queue has ${this.queue.length} elements.`, 'info');
        updateInfo(null);
    }
    
    async clear() {
        if (this.isAnimating || this.queue.length === 0) return;
        this.isAnimating = true;
        updateInfo('clear');
        
        // Visually clear from the front
        while(this.queue.length > 0) {
            this.draw({ 0: '#ef4444' });
            await sleep(150);
            this.queue.shift();
            this.draw();
        }

        showMessage('Queue has been cleared.', 'success');
        updateInfo(null);
        this.isAnimating = false;
    }

    setupEventListeners() {
        const valueInput = document.getElementById('value-input');
        
        document.getElementById('enqueue-btn').addEventListener('click', () => {
            if (valueInput.value) { this.enqueue(valueInput.value); valueInput.value = ''; }
            else { showMessage('Please enter a value to enqueue.', 'error'); }
        });
        document.getElementById('dequeue-btn').addEventListener('click', () => this.dequeue());
        document.getElementById('peek-btn').addEventListener('click', () => this.peek());
        document.getElementById('is-empty-btn').addEventListener('click', () => this.isEmpty());
        document.getElementById('size-btn').addEventListener('click', () => this.size());
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
    }
}

new QueueVisualizer();