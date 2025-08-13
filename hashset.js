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
    'add': { complexity: 'O(1)', status: 'Adding element...' },
    'remove': { complexity: 'O(1)', status: 'Removing element...' },
    'contains': { complexity: 'O(1)', status: 'Checking for element...' },
    'clear': { complexity: 'O(n)', status: 'Clearing set...' }
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
    constructor(value) {
        this.value = value; // In a HashSet, the value is the key
        this.next = null;
    }
}

// --- VISUALIZER CLASS ---
class HashSetVisualizer {
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
    hash(key) { // The key is the value itself
        let hash = 0;
        const keyStr = String(key);
        for (let i = 0; i < keyStr.length; i++) {
            hash = (hash + keyStr.charCodeAt(i) * (i + 1)) % this.size;
        }
        return hash;
    }

    draw(highlights = {}) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bucketWidth = 80;
        const bucketHeight = 50;
        const nodeWidth = 80;
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
                
                let nodeColor = '#2563eb'; // blue-600
                if(highlights.nodeValue === current.value) {
                    nodeColor = highlights.nodeColor || nodeColor;
                }

                ctx.fillStyle = nodeColor;
                ctx.fillRect(nodeX, nodeY, nodeWidth, nodeHeight);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Fira Code';
                ctx.fillText(current.value, nodeX + nodeWidth/2, nodeY + nodeHeight/2);

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

    async add(value) {
        if (!value || this.isAnimating) return;
        this.isAnimating = true;
        updateInfo('add', `Hashing value "${value}"...`);

        const index = this.hash(value);
        await sleep(500);
        statusDisplay.textContent = `Hashed to index [${index}]. Checking for duplicates...`;
        this.draw({ bucket: index });
        await sleep(800);

        let current = this.table[index];
        while (current) {
            this.draw({ bucket: index, nodeValue: current.value, nodeColor: '#f59e0b'});
            await sleep(500);
            if (current.value === value) {
                statusDisplay.textContent = `Value "${value}" already exists in the set.`;
                this.draw({ bucket: index, nodeValue: value, nodeColor: '#ef4444' });
                await sleep(800);
                showMessage(`Value "${value}" is already in the set.`, 'error');
                this.isAnimating = false;
                updateInfo(null);
                this.draw();
                return;
            }
            current = current.next;
        }

        statusDisplay.textContent = `Value is unique. Inserting new node.`;
        const newNode = new Node(value);
        newNode.next = this.table[index];
        this.table[index] = newNode;
        
        this.draw({ bucket: index, nodeValue: value, nodeColor: '#16a34a' });
        await sleep(800);
        showMessage(`Added "${value}" to the set`, 'success');
        this.isAnimating = false;
        updateInfo(null);
        this.draw();
    }

    async remove(value) {
        if (!value || this.isAnimating) return;
        this.isAnimating = true;
        updateInfo('remove', `Hashing value "${value}"...`);
        
        const index = this.hash(value);
        await sleep(500);
        statusDisplay.textContent = `Hashed to index [${index}]. Searching chain...`;
        this.draw({ bucket: index });
        await sleep(800);

        let current = this.table[index];
        let previous = null;
        while(current) {
             this.draw({ bucket: index, nodeValue: current.value, nodeColor: '#f59e0b'});
             await sleep(500);
             if(current.value === value) {
                this.draw({ bucket: index, nodeValue: value, nodeColor: '#ef4444'});
                await sleep(800);
                if (previous) {
                    previous.next = current.next;
                } else {
                    this.table[index] = current.next;
                }
                showMessage(`Removed "${value}"`, 'success');
                this.isAnimating = false;
                updateInfo(null);
                this.draw();
                return;
             }
             previous = current;
             current = current.next;
        }
        
        showMessage(`Value "${value}" not found`, 'error');
        this.isAnimating = false;
        updateInfo(null);
        this.draw();
    }
    
    async contains(value) {
        if (!value || this.isAnimating) return;
        this.isAnimating = true;
        updateInfo('contains', `Hashing value "${value}"...`);

        const index = this.hash(value);
        await sleep(500);
        statusDisplay.textContent = `Hashed to index [${index}]. Searching chain...`;
        this.draw({ bucket: index });
        await sleep(800);

        let current = this.table[index];
        while (current) {
            this.draw({ bucket: index, nodeValue: current.value, nodeColor: '#f59e0b'});
            await sleep(500);
            if (current.value === value) {
                 this.draw({ bucket: index, nodeValue: value, nodeColor: '#16a34a' });
                showMessage(`Set contains "${value}"`, 'success');
                this.isAnimating = false;
                updateInfo(null);
                return;
            }
            current = current.next;
        }

        showMessage(`Set does not contain "${value}"`, 'error');
        this.isAnimating = false;
        updateInfo(null);
        this.draw();
    }
    
    clear() {
        if(this.isAnimating) return;
        updateInfo('clear');
        this.table = new Array(this.size).fill(null);
        this.draw();
        showMessage('HashSet has been cleared.', 'success');
        updateInfo(null);
    }

    setupEventListeners() {
        const valueInput = document.getElementById('value-input');

        document.getElementById('add-btn').addEventListener('click', () => {
            this.add(valueInput.value);
            valueInput.value = '';
        });
        document.getElementById('remove-btn').addEventListener('click', () => {
            this.remove(valueInput.value);
             valueInput.value = '';
        });
        document.getElementById('contains-btn').addEventListener('click', () => {
            this.contains(valueInput.value);
             valueInput.value = '';
        });
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
    }
}

new HashSetVisualizer();