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

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- OPERATION INFO ---
const INFO = {
    'set': { complexity: 'O(1)', status: 'Set (Insert/Update)...' },
    'get': { complexity: 'O(1)', status: 'Get (Search)...' },
    'delete': { complexity: 'O(1)', status: 'Deleting...' },
    'clear': { complexity: 'O(n)', status: 'Clearing table...' }
};

function updateInfo(operation, statusText = null) {
    complexityDisplay.innerHTML = `O(1) <span class="text-slate-500">avg</span>, O(n) <span class="text-slate-500">worst</span>`;
    if (INFO[operation]) {
        statusDisplay.textContent = statusText || INFO[operation].status;
    } else {
        complexityDisplay.textContent = 'O(?)';
        statusDisplay.textContent = 'Ready';
    }
}

// --- NODE FOR LINKED LIST CHAINING ---
class Node {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.next = null;
    }
}

// --- VISUALIZER CLASS ---
class HashMapVisualizer {
    constructor(size = 7) {
        this.size = size;
        this.table = new Array(size).fill(null);
        this.isAnimating = false;
        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 600;
        this.draw();
    }

    // Simple hash function for demonstration
    hash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash + key.charCodeAt(i) * (i + 1)) % this.size;
        }
        return hash;
    }

    draw(highlights = {}) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bucketWidth = 80;
        const bucketHeight = 50;
        const nodeWidth = 120;
        const nodeHeight = 40;
        const startY = 40;
        const startX = 60;

        // Draw buckets
        for (let i = 0; i < this.size; i++) {
            const y = startY + i * (bucketHeight + 20);
            ctx.fillStyle = highlights.bucket === i ? '#fde047' : '#f1f5f9';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, y, bucketWidth, bucketHeight);
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`[${i}]`, startX + bucketWidth / 2, y + bucketHeight / 2);

            // Draw linked list chains
            let current = this.table[i];
            let nodeIndex = 0;
            while (current) {
                const nodeX = startX + bucketWidth + 50 + nodeIndex * (nodeWidth + 20);
                const nodeY = y + (bucketHeight - nodeHeight) / 2;
                
                // Highlight logic
                let nodeColor = '#2563eb'; // blue-600
                if(highlights.nodeKey === current.key) {
                    nodeColor = highlights.nodeColor || nodeColor;
                }

                ctx.fillStyle = nodeColor;
                ctx.fillRect(nodeX, nodeY, nodeWidth, nodeHeight);
                ctx.fillStyle = 'white';
                ctx.font = '12px Fira Code';
                ctx.fillText(`${current.key}: ${current.value}`, nodeX + nodeWidth/2, nodeY + nodeHeight/2);

                // Draw arrow from previous
                const arrowStartX = (nodeIndex === 0) ? startX + bucketWidth : nodeX - 20;
                const arrowStartY = y + bucketHeight / 2;
                ctx.beginPath();
                ctx.moveTo(arrowStartX, arrowStartY);
                ctx.lineTo(nodeX, arrowStartY);
                ctx.strokeStyle = '#334155';
                ctx.stroke();

                current = current.next;
                nodeIndex++;
            }
        }
    }

    async set(key, value) {
        if (!key || !value || this.isAnimating) return;
        this.isAnimating = true;
        updateInfo('set', `Hashing key "${key}"...`);

        const index = this.hash(key);
        await sleep(500);
        statusDisplay.textContent = `Hashed to index [${index}]. Searching for key...`;
        this.draw({ bucket: index });
        await sleep(800);

        let current = this.table[index];
        let previous = null;
        while (current) {
            this.draw({ bucket: index, nodeKey: current.key, nodeColor: '#f59e0b'});
            await sleep(500);
            if (current.key === key) {
                statusDisplay.textContent = `Key found. Updating value to "${value}".`;
                current.value = value;
                this.draw({ bucket: index, nodeKey: key, nodeColor: '#16a34a' });
                await sleep(800);
                showMessage(`Updated key "${key}"`, 'success');
                this.isAnimating = false;
                updateInfo(null);
                this.draw();
                return;
            }
            previous = current;
            current = current.next;
        }

        statusDisplay.textContent = `Key not found. Inserting new node.`;
        const newNode = new Node(key, value);
        if (previous) {
            previous.next = newNode;
        } else {
            this.table[index] = newNode;
        }
        
        this.draw({ bucket: index, nodeKey: key, nodeColor: '#16a34a' });
        await sleep(800);
        showMessage(`Set key "${key}"`, 'success');
        this.isAnimating = false;
        updateInfo(null);
        this.draw();
    }

    async get(key) {
        if (!key || this.isAnimating) return;
        this.isAnimating = true;
        updateInfo('get', `Hashing key "${key}"...`);

        const index = this.hash(key);
        await sleep(500);
        statusDisplay.textContent = `Hashed to index [${index}]. Searching chain...`;
        this.draw({ bucket: index });
        await sleep(800);

        let current = this.table[index];
        while (current) {
            this.draw({ bucket: index, nodeKey: current.key, nodeColor: '#f59e0b'});
            await sleep(500);
            if (current.key === key) {
                 this.draw({ bucket: index, nodeKey: key, nodeColor: '#16a34a' });
                showMessage(`Value for "${key}" is "${current.value}"`, 'success');
                this.isAnimating = false;
                updateInfo(null);
                return;
            }
            current = current.next;
        }

        showMessage(`Key "${key}" not found`, 'error');
        this.isAnimating = false;
        updateInfo(null);
        this.draw();
    }

    async delete(key) {
        if (!key || this.isAnimating) return;
        this.isAnimating = true;
        updateInfo('delete', `Hashing key "${key}"...`);
        
        const index = this.hash(key);
        await sleep(500);
        statusDisplay.textContent = `Hashed to index [${index}]. Searching chain...`;
        this.draw({ bucket: index });
        await sleep(800);

        let current = this.table[index];
        let previous = null;
        while(current) {
             this.draw({ bucket: index, nodeKey: current.key, nodeColor: '#f59e0b'});
             await sleep(500);
             if(current.key === key) {
                this.draw({ bucket: index, nodeKey: key, nodeColor: '#ef4444'});
                await sleep(800);
                if (previous) {
                    previous.next = current.next;
                } else {
                    this.table[index] = current.next;
                }
                showMessage(`Deleted key "${key}"`, 'success');
                this.isAnimating = false;
                updateInfo(null);
                this.draw();
                return;
             }
             previous = current;
             current = current.next;
        }
        
        showMessage(`Key "${key}" not found`, 'error');
        this.isAnimating = false;
        updateInfo(null);
        this.draw();
    }
    
    clear() {
        if(this.isAnimating) return;
        updateInfo('clear');
        this.table = new Array(this.size).fill(null);
        this.draw();
        showMessage('HashMap has been cleared.', 'success');
        updateInfo(null);
    }

    setupEventListeners() {
        const keyInput = document.getElementById('key-input');
        const valueInput = document.getElementById('value-input');

        document.getElementById('set-btn').addEventListener('click', () => {
            this.set(keyInput.value, valueInput.value);
            keyInput.value = '';
            valueInput.value = '';
        });
        document.getElementById('get-btn').addEventListener('click', () => {
            this.get(keyInput.value);
             keyInput.value = '';
        });
        document.getElementById('delete-btn').addEventListener('click', () => {
            this.delete(keyInput.value);
             keyInput.value = '';
        });
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
    }
}

new HashMapVisualizer();