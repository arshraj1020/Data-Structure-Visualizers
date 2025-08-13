// --- DOM & SETUP ---
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('messageBox');

// --- UTILITY FUNCTIONS ---
function showMessage(message, type = 'info', duration = 3000) {
    messageBox.textContent = message;
    messageBox.className = `message-box bg-${type} show`;
    setTimeout(() => { messageBox.classList.remove('show'); }, duration);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- NODE CLASS (DOUBLY) ---
class Node {
    constructor(value, x = 0, y = 0) {
        this.value = value;
        this.next = null;
        this.previous = null; // Key difference
        // Visual properties
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.color = '#059669'; // Emerald-600
        this.textColor = 'white';
    }

    draw(highlightColor = null) {
        // Node circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = highlightColor || this.color;
        ctx.fill();
        ctx.strokeStyle = highlightColor ? '#a16207' : '#047857'; // Amber-700, Emerald-700
        ctx.lineWidth = 3;
        ctx.stroke();

        // Node value
        ctx.fillStyle = this.textColor;
        ctx.font = "16px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.value, this.x, this.y);
    }

    // FINAL CORRECTION: This function uses a more stable method to draw the arrows.
    drawArrowTo(node) {
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        const headlen = 10;

        // --- Draw 'next' pointer (top arc) ---
        const startNext = { x: this.x, y: this.y - this.radius };
        const endNext = { x: node.x, y: node.y - node.radius };
        const controlNext = { x: (startNext.x + endNext.x) / 2, y: startNext.y - 40 };
        
        ctx.beginPath();
        ctx.moveTo(startNext.x, startNext.y);
        ctx.quadraticCurveTo(controlNext.x, controlNext.y, endNext.x, endNext.y);
        ctx.stroke();
        
        // Arrowhead for 'next'
        let t = 0.95; // Position near the end of the curve
        let dx = 2 * (1 - t) * (controlNext.x - startNext.x) + 2 * t * (endNext.x - controlNext.x);
        let dy = 2 * (1 - t) * (controlNext.y - startNext.y) + 2 * t * (endNext.y - controlNext.y);
        let angle = Math.atan2(dy, dx);
        let x = Math.pow(1 - t, 2) * startNext.x + 2 * (1 - t) * t * controlNext.x + Math.pow(t, 2) * endNext.x;
        let y = Math.pow(1 - t, 2) * startNext.y + 2 * (1 - t) * t * controlNext.y + Math.pow(t, 2) * endNext.y;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();


        // --- Draw 'previous' pointer (bottom arc) ---
        const startPrev = { x: node.x, y: node.y + node.radius };
        const endPrev = { x: this.x, y: this.y + this.radius };
        const controlPrev = { x: (startPrev.x + endPrev.x) / 2, y: startPrev.y + 40 };

        ctx.beginPath();
        ctx.moveTo(startPrev.x, startPrev.y);
        ctx.quadraticCurveTo(controlPrev.x, controlPrev.y, endPrev.x, endPrev.y);
        ctx.stroke();

        // Arrowhead for 'previous'
        dx = 2 * (1 - t) * (controlPrev.x - startPrev.x) + 2 * t * (endPrev.x - controlPrev.x);
        dy = 2 * (1 - t) * (controlPrev.y - startPrev.y) + 2 * t * (endPrev.y - controlPrev.y);
        angle = Math.atan2(dy, dx);
        x = Math.pow(1 - t, 2) * startPrev.x + 2 * (1 - t) * t * controlPrev.x + Math.pow(t, 2) * endPrev.x;
        y = Math.pow(1 - t, 2) * startPrev.y + 2 * (1 - t) * t * controlPrev.y + Math.pow(t, 2) * endPrev.y;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
}

// --- VISUALIZER CLASS ---
class DoublyLinkedListVisualizer {
    constructor() {
        this.head = null;
        this.tail = null; // Keep track of tail for O(1) addLast
        this.isAnimating = false;
        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        this.repositionNodes();
        this.draw();
    }
    
    repositionNodes() {
        if (!this.head) return;
        let current = this.head;
        let x = 100;
        const y = canvas.height / 2;
        const spacing = 150;
        while(current) {
            current.x = x;
            current.y = y;
            x += spacing;
            current = current.next;
        }
    }

    draw(highlightMap = new Map()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!this.head) {
            ctx.font = "20px Inter";
            ctx.fillStyle = "#64748b";
            ctx.textAlign = "center";
            ctx.fillText("List is empty", canvas.width / 2, canvas.height / 2);
            return;
        }

        // Draw pointers and nodes
        let current = this.head;
        while (current) {
            current.draw(highlightMap.get(current));
            if (current.next) {
                current.drawArrowTo(current.next);
            }
            current = current.next;
        }
        
        // Draw Head/Tail labels
        ctx.font = "bold 16px Inter";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText("HEAD", this.head.x, this.head.y - 80);
        if (this.tail) {
            ctx.fillText("TAIL", this.tail.x, this.tail.y + 80);
        }
    }
    
    async addFirst(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        try {
            const newNode = new Node(value);
            if (this.head) {
                this.head.previous = newNode;
                newNode.next = this.head;
            } else {
                this.tail = newNode; // If list was empty, new node is also tail
            }
            this.head = newNode;
            
            this.repositionNodes();
            this.draw(new Map([[newNode, '#16a34a']]));
            await sleep(600);
            this.draw();
            showMessage(`Added ${value} to the front`, 'success');
        } finally {
            this.isAnimating = false;
        }
    }
    
    async addLast(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        try {
            const newNode = new Node(value);
            if (this.tail) {
                this.tail.next = newNode;
                newNode.previous = this.tail;
            } else {
                this.head = newNode; // If list was empty, new node is also head
            }
            this.tail = newNode;

            this.repositionNodes();
            this.draw(new Map([[newNode, '#16a34a']]));
            await sleep(600);
            this.draw();
            showMessage(`Added ${value} to the end`, 'success');
        } finally {
            this.isAnimating = false;
        }
    }

    async removeFirst() {
        if (this.isAnimating || !this.head) return;
        this.isAnimating = true;
        try {
            const nodeToRemove = this.head;
            this.draw(new Map([[nodeToRemove, '#ef4444']]));
            await sleep(600);
            
            this.head = this.head.next;
            if (this.head) {
                this.head.previous = null;
            } else {
                this.tail = null; // List is now empty
            }
            
            this.repositionNodes();
            this.draw();
            showMessage(`Removed ${nodeToRemove.value} from the front`, 'success');
        } finally {
            this.isAnimating = false;
        }
    }

    async removeLast() {
        if (this.isAnimating || !this.tail) return;
        this.isAnimating = true;
        try {
            const nodeToRemove = this.tail;
            this.draw(new Map([[nodeToRemove, '#ef4444']]));
            await sleep(600);

            this.tail = this.tail.previous;
            if (this.tail) {
                this.tail.next = null;
            } else {
                this.head = null; // List is now empty
            }

            this.repositionNodes();
            this.draw();
            showMessage(`Removed ${nodeToRemove.value} from the end`, 'success');
        } finally {
            this.isAnimating = false;
        }
    }

    async search(value) {
        if (this.isAnimating || !this.head) return;
        this.isAnimating = true;
        try {
            let current = this.head;
            let found = false;
            while(current) {
                if (current.value === value) {
                    this.draw(new Map([[current, '#16a34a']]));
                    await sleep(1000);
                    showMessage(`Found ${value}!`, 'success');
                    found = true;
                    break;
                }
                this.draw(new Map([[current, '#f59e0b']]));
                await sleep(400);
                current = current.next;
            }
            if (!found) {
                showMessage(`${value} not found.`, 'error');
            }
            this.draw();
        } finally {
            this.isAnimating = false;
        }
    }

    setupEventListeners() {
        const addValueInput = document.getElementById('add-value');
        const searchValueInput = document.getElementById('search-value');
        
        document.getElementById('add-first-btn').addEventListener('click', () => {
            const value = addValueInput.value;
            if (value) {
                this.addFirst(value);
                addValueInput.value = '';
            }
        });
        document.getElementById('add-last-btn').addEventListener('click', () => {
            const value = addValueInput.value;
            if (value) {
                this.addLast(value);
                addValueInput.value = '';
            }
        });
        document.getElementById('remove-first-btn').addEventListener('click', () => this.removeFirst());
        document.getElementById('remove-last-btn').addEventListener('click', () => this.removeLast());
        
        document.getElementById('search-btn').addEventListener('click', () => {
            const value = searchValueInput.value;
            if (value) {
                this.search(value);
                searchValueInput.value = '';
            }
        });
    }
}

new DoublyLinkedListVisualizer();
