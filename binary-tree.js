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

// --- NODE & TREE CLASSES ---
class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
        this.radius = 22;
        this.parent = null;
    }

    draw(color = '#1e40af', highlightPath = false) {
        if (this.parent) {
            ctx.beginPath();
            ctx.moveTo(this.parent.x, this.parent.y);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = highlightPath ? '#f59e0b' : '#94a3b8';
            ctx.lineWidth = highlightPath ? 3 : 2;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, this.x, this.y);
    }
}

class BinaryTreeVisualizer {
    constructor() {
        this.root = null;
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
    
    // --- DRAWING & POSITIONING (REWRITTEN) ---
    draw(highlights = new Map()) {
        const rect = canvas.parentElement.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (!this.root) return;
        this.setPositions();

        const q = [this.root];
        const nodesToDraw = [];
        while(q.length > 0) {
            const node = q.shift();
            nodesToDraw.push(node);
            if(node.left) q.push(node.left);
            if(node.right) q.push(node.right);
        }

        nodesToDraw.forEach(node => node.draw(undefined, highlights.get(node) === 'path'));
        nodesToDraw.forEach(node => node.draw(highlights.get(node) || '#1e40af'));
    }
    
    // --- FIX: This new positioning logic correctly lays out the tree ---
    setPositions() {
        if (!this.root) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        let x = 0;
        const xSpacing = 40;
        const ySpacing = 70;

        const setNodeCoords = (node, depth) => {
            if (node.left) {
                setNodeCoords(node.left, depth + 1);
            }
            node.x = x * xSpacing + xSpacing;
            node.y = depth * ySpacing + 50;
            x++;
            if (node.right) {
                setNodeCoords(node.right, depth + 1);
            }
        };

        const assignParents = (node) => {
            if (node.left) {
                node.left.parent = node;
                assignParents(node.left);
            }
            if (node.right) {
                node.right.parent = node;
                assignParents(node.right);
            }
        };

        // This ensures parent links are correct before drawing
        if (this.root) {
            this.root.parent = null;
            assignParents(this.root);
        }
        
        setNodeCoords(this.root, 0);
        
        // Center the tree
        const nodes = [];
        const q = [this.root];
        let minX = this.root.x, maxX = this.root.x;
        while(q.length > 0) {
            const node = q.shift();
            nodes.push(node);
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            if(node.left) q.push(node.left);
            if(node.right) q.push(node.right);
        }
        const treeWidth = maxX - minX;
        const offset = (rect.width - treeWidth) / 2 - minX;
        nodes.forEach(node => node.x += offset);
    }
    
    // --- CORE OPERATIONS (BST LOGIC) ---
    async insert(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        statusDisplay.textContent = `Inserting ${value}...`;
        
        const newNode = new Node(value);
        if (!this.root) {
            this.root = newNode;
        } else {
            let current = this.root;
            while (true) {
                this.draw(new Map([[current, '#f59e0b']]));
                await sleep(400);
                if (value < current.value) {
                    if (!current.left) { current.left = newNode; break; }
                    current = current.left;
                } else if (value > current.value) {
                    if (!current.right) { current.right = newNode; break; }
                    current = current.right;
                } else {
                    // Value already exists
                    this.isAnimating = false;
                    this.draw();
                    showMessage(`Value ${value} already exists in the tree.`, 'error');
                    return;
                }
            }
        }
        this.draw(new Map([[newNode, '#16a34a']]));
        await sleep(600);
        this.draw();
        statusDisplay.textContent = 'Ready.';
        this.isAnimating = false;
    }

    async search(value) {
        if (this.isAnimating || !this.root) return;
        this.isAnimating = true;
        statusDisplay.textContent = `Searching for ${value}...`;

        let current = this.root;
        while (current) {
            this.draw(new Map([[current, '#f59e0b']]));
            await sleep(500);
            if (current.value === value) {
                this.draw(new Map([[current, '#16a34a']]));
                showMessage(`Found ${value}!`, 'success');
                statusDisplay.textContent = 'Ready.';
                this.isAnimating = false;
                return;
            }
            current = value < current.value ? current.left : current.right;
        }
        showMessage(`${value} not found.`, 'error');
        this.draw();
        statusDisplay.textContent = 'Ready.';
        this.isAnimating = false;
    }
    
    async delete(value) {
         showMessage("Delete is a complex operation and not implemented in this visualizer.", "info");
    }

    // --- TRAVERSALS & PROPERTIES ---
    async traverse(order) {
        if(this.isAnimating || !this.root) return;
        this.isAnimating = true;
        
        const traversalOrder = [];
        const highlights = new Map();
        statusDisplay.textContent = `${order} traversal: ...`;
        
        const visit = async (node) => {
            highlights.set(node, '#f59e0b');
            this.draw(highlights);
            await sleep(400);
            traversalOrder.push(node.value);
            statusDisplay.textContent = `${order} traversal: ${traversalOrder.join(' -> ')}`;
            highlights.set(node, '#16a34a');
            this.draw(highlights);
            await sleep(200);
        };
        
        const inOrder = async (node) => { if (node) { await inOrder(node.left); await visit(node); await inOrder(node.right); }};
        const preOrder = async (node) => { if (node) { await visit(node); await preOrder(node.left); await preOrder(node.right); }};
        const postOrder = async (node) => { if (node) { await postOrder(node.left); await postOrder(node.right); await visit(node); }};
        const bfs = async () => {
            const q = [this.root];
            while(q.length > 0) {
                const node = q.shift();
                await visit(node);
                if(node.left) q.push(node.left);
                if(node.right) q.push(node.right);
            }
        };

        if (order === 'In-order') await inOrder(this.root);
        else if (order === 'Pre-order') await preOrder(this.root);
        else if (order === 'Post-order') await postOrder(this.root);
        else if (order === 'BFS') await bfs();
        
        await sleep(1000);
        this.draw();
        statusDisplay.textContent = 'Ready.';
        this.isAnimating = false;
    }
    
    async checkBalanced() {
        if(this.isAnimating || !this.root) return;
        this.isAnimating = true;
        statusDisplay.textContent = 'Checking if tree is balanced...';
        
        let isBalanced = true;
        const highlights = new Map();

        const getHeight = async (node) => {
            if(!node) return 0;
            
            highlights.set(node, '#f59e0b');
            this.draw(highlights);
            await sleep(400);

            const leftHeight = await getHeight(node.left);
            const rightHeight = await getHeight(node.right);

            if(Math.abs(leftHeight - rightHeight) > 1) {
                isBalanced = false;
                highlights.set(node, '#ef4444');
            } else {
                highlights.set(node, '#16a34a');
            }
            this.draw(highlights);
            await sleep(400);

            return Math.max(leftHeight, rightHeight) + 1;
        };

        await getHeight(this.root);
        showMessage(`Is the tree balanced? ${isBalanced}`, isBalanced ? 'success' : 'error');
        this.draw();
        statusDisplay.textContent = 'Ready.';
        this.isAnimating = false;
    }
    
    async findDiameter() {
        if(this.isAnimating || !this.root) return;
        this.isAnimating = true;
        statusDisplay.textContent = 'Calculating tree diameter...';
        
        let diameter = 0;
        const highlights = new Map();

        const getHeightAndDiameter = async (node) => {
            if(!node) return 0;
            
            highlights.set(node, '#f59e0b');
            this.draw(highlights);
            await sleep(400);

            let leftHeight = await getHeightAndDiameter(node.left);
            let rightHeight = await getHeightAndDiameter(node.right);
            
            diameter = Math.max(diameter, leftHeight + rightHeight);
            
            highlights.set(node, '#16a34a');
            this.draw(highlights);
            
            return Math.max(leftHeight, rightHeight) + 1;
        };

        await getHeightAndDiameter(this.root);
        showMessage(`The diameter of the tree is ${diameter}.`, 'info');
        this.draw();
        statusDisplay.textContent = 'Ready.';
        this.isAnimating = false;
    }
    
    setupEventListeners() {
        const valueInput = document.getElementById('value-input');
        
        const handleOp = (func, needsValue) => {
            const value = parseInt(valueInput.value);
            if(needsValue && isNaN(value)) {
                showMessage('Please enter a valid number.', 'error');
                return;
            }
            func(value);
            valueInput.value = '';
        }
        
        document.getElementById('insert-btn').addEventListener('click', () => handleOp(this.insert.bind(this), true));
        document.getElementById('search-btn').addEventListener('click', () => handleOp(this.search.bind(this), true));
        document.getElementById('delete-btn').addEventListener('click', () => handleOp(this.delete.bind(this), true));
        
        document.getElementById('inorder-btn').addEventListener('click', () => this.traverse('In-order'));
        document.getElementById('preorder-btn').addEventListener('click', () => this.traverse('Pre-order'));
        document.getElementById('postorder-btn').addEventListener('click', () => this.traverse('Post-order'));
        document.getElementById('bfs-btn').addEventListener('click', () => this.traverse('BFS'));
        document.getElementById('is-balanced-btn').addEventListener('click', () => this.checkBalanced());
        document.getElementById('diameter-btn').addEventListener('click', () => this.findDiameter());
    }
}

new BinaryTreeVisualizer();