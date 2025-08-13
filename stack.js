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
    'push': { complexity: 'O(1)', status: 'Pushing element...' },
    'pop': { complexity: 'O(1)', status: 'Popping element...' },
    'peek': { complexity: 'O(1)', status: 'Peeking at top element...' },
    'isEmpty': { complexity: 'O(1)', status: 'Checking if stack is empty...' },
    'size': { complexity: 'O(1)', status: 'Getting stack size...' },
    'clear': { complexity: 'O(n)', status: 'Clearing the stack...' },
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
class StackVisualizer {
    constructor() {
        this.stack = [];
        this.isAnimating = false;
        this.maxSize = 8;
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

    draw(highlights = {}) { // highlights is now an object e.g. { index: color }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const boxWidth = 120;
        const boxHeight = 50;
        const startY = canvas.height - boxHeight - 20;

        if (this.stack.length === 0) {
            ctx.font = "20px Inter";
            ctx.fillStyle = "#64748b";
            ctx.textAlign = "center";
            ctx.fillText("Stack is empty", centerX, canvas.height / 2);
            return;
        }

        this.stack.forEach((value, i) => {
            const y = startY - i * boxHeight;
            
            ctx.beginPath();
            ctx.rect(centerX - boxWidth / 2, y, boxWidth, boxHeight);
            ctx.fillStyle = highlights[i] || '#059669'; // Emerald-600
            ctx.fill();
            ctx.strokeStyle = '#047857'; // Emerald-700
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = "bold 18px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(value, centerX, y + boxHeight / 2);
        });

        if (this.stack.length > 0) {
            const topY = startY - (this.stack.length - 1) * boxHeight;
            ctx.font = "bold 16px Inter";
            ctx.fillStyle = "#1e293b";
            ctx.textAlign = "center";
            ctx.fillText("TOP", centerX - boxWidth, topY + boxHeight / 2);
        }
    }

    async push(value) {
        if (this.isAnimating) return;
        if (this.stack.length >= this.maxSize) {
            showMessage('Stack is full!', 'error');
            return;
        }
        this.isAnimating = true;
        updateInfo('push', `Pushing ${value}...`);
        
        this.stack.push(value);
        this.draw({ [this.stack.length - 1]: '#16a34a' });
        await sleep(600);
        this.draw();
        
        showMessage(`Pushed ${value} onto the stack`, 'success');
        updateInfo(null);
        this.isAnimating = false;
    }

    async pop() {
        if (this.isAnimating || this.stack.length === 0) {
            if (!this.isAnimating) showMessage('Stack is empty!', 'error');
            return;
        }
        this.isAnimating = true;
        updateInfo('pop');
        
        const poppedValue = this.stack[this.stack.length - 1];
        this.draw({ [this.stack.length - 1]: '#ef4444' });
        await sleep(600);
        
        this.stack.pop();
        this.draw();
        
        showMessage(`Popped ${poppedValue} from the stack`, 'success');
        updateInfo(null);
        this.isAnimating = false;
    }

    async peek() {
        if (this.isAnimating || this.stack.length === 0) {
             if (!this.isAnimating) showMessage('Stack is empty!', 'error');
            return;
        }
        this.isAnimating = true;
        updateInfo('peek');
        
        const topValue = this.stack[this.stack.length - 1];
        this.draw({ [this.stack.length - 1]: '#3b82f6' });
        await sleep(800);
        this.draw();
        
        showMessage(`Top element is ${topValue}`, 'info');
        updateInfo(null);
        this.isAnimating = false;
    }

    isEmpty() {
        if (this.isAnimating) return;
        updateInfo('isEmpty');
        const empty = this.stack.length === 0;
        showMessage(`Is the stack empty? ${empty}`, empty ? 'success' : 'info');
        updateInfo(null);
    }

    size() {
        if (this.isAnimating) return;
        updateInfo('size');
        showMessage(`The stack has ${this.stack.length} elements.`, 'info');
        updateInfo(null);
    }
    
    async clear() {
        if (this.isAnimating || this.stack.length === 0) return;
        this.isAnimating = true;
        updateInfo('clear');
        
        while(this.stack.length > 0) {
            this.draw({ [this.stack.length - 1]: '#ef4444' });
            await sleep(150);
            this.stack.pop();
        }
        this.draw();
        showMessage('Stack has been cleared.', 'success');
        updateInfo(null);
        this.isAnimating = false;
    }

    setupEventListeners() {
        const valueInput = document.getElementById('value-input');
        
        document.getElementById('push-btn').addEventListener('click', () => {
            if (valueInput.value) { this.push(valueInput.value); valueInput.value = ''; }
            else { showMessage('Please enter a value to push.', 'error'); }
        });
        document.getElementById('pop-btn').addEventListener('click', () => this.pop());
        document.getElementById('peek-btn').addEventListener('click', () => this.peek());
        document.getElementById('is-empty-btn').addEventListener('click', () => this.isEmpty());
        document.getElementById('size-btn').addEventListener('click', () => this.size());
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
    }
}

new StackVisualizer();