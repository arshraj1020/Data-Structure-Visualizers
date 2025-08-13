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

// --- NODE CLASS ---
class Node {
    constructor(value, x = 0, y = 0) {
        this.value = value;
        this.next = null;
        // Visual properties
        this.x = x;
        this.y = y;
        this.radius = 28;
        this.color = '#4f46e5'; // indigo-600
        this.textColor = 'white';
    }

    draw(highlightColor = null) {
        // Node circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = highlightColor || this.color;
        ctx.fill();
        ctx.strokeStyle = highlightColor ? '#a16207' : '#3730a3'; // amber-700 for highlight
        ctx.lineWidth = 3;
        ctx.stroke();

        // Node value
        ctx.fillStyle = this.textColor;
        ctx.font = "16px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.value, this.x, this.y);
    }

    drawArrowTo(node) {
        const angle = Math.atan2(node.y - this.y, node.x - this.x);
        const startX = this.x + this.radius * Math.cos(angle);
        const startY = this.y + this.radius * Math.sin(angle);
        const endX = node.x - node.radius * Math.cos(angle);
        const endY = node.y - node.radius * Math.sin(angle);
        
        const headlen = 10;
        const dx = endX - startX;
        const dy = endY - startY;
        const arrowAngle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(arrowAngle - Math.PI / 6), endY - headlen * Math.sin(arrowAngle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(arrowAngle + Math.PI / 6), endY - headlen * Math.sin(arrowAngle + Math.PI / 6));
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// --- VISUALIZER CLASS ---
class LinkedListVisualizer {
    constructor() {
        this.head = null;
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
        let x = 80;
        const y = canvas.height / 2;
        const spacing = 120;
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

        let current = this.head;
        
        // Draw Head pointer
        ctx.font = "bold 16px Inter";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText("HEAD", this.head.x, this.head.y - 50);
        this.drawPointer(this.head.x, this.head.y - 40, this.head.x, this.head.y - this.head.radius);

        while (current) {
            current.draw(highlightMap.get(current));
            if (current.next) {
                current.drawArrowTo(current.next);
            } else {
                ctx.font = "bold 16px Inter";
                ctx.fillStyle = "#ef4444";
                ctx.fillText("NULL", current.x + 80, current.y);
            }
            current = current.next;
        }
    }
    
    drawPointer(fromX, fromY, toX, toY) {
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    async addFirst(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        try {
            const newNode = new Node(value);
            newNode.next = this.head;
            this.head = newNode;
            
            this.repositionNodes();
            this.draw(new Map([[newNode, '#16a34a']])); // Highlight green
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
            if (!this.head) {
                this.head = newNode;
            } else {
                let current = this.head;
                while (current.next) {
                    this.draw(new Map([[current, '#f59e0b']])); // Highlight amber
                    await sleep(400);
                    current = current.next;
                }
                this.draw(new Map([[current, '#f59e0b']]));
                await sleep(400);
                current.next = newNode;
            }

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
            this.draw(new Map([[nodeToRemove, '#ef4444']])); // Highlight red
            await sleep(600);
            
            this.head = this.head.next;
            this.repositionNodes();
            this.draw();
            showMessage(`Removed ${nodeToRemove.value} from the front`, 'success');
        } finally {
            this.isAnimating = false;
        }
    }

    async removeLast() {
        if (this.isAnimating || !this.head) return;
        this.isAnimating = true;
        try {
            if (!this.head.next) { // Only one node
                await this.removeFirst();
                return; // removeFirst handles the animation flag
            }

            let current = this.head;
            while (current.next && current.next.next) {
                this.draw(new Map([[current, '#f59e0b']]));
                await sleep(400);
                current = current.next;
            }
            
            const nodeToRemove = current.next;
            this.draw(new Map([[current, '#f59e0b'], [nodeToRemove, '#ef4444']]));
            await sleep(600);

            current.next = null;
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
            this.draw(); // Redraw to remove final highlight
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

new LinkedListVisualizer();
