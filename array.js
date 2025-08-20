// --- DOM & SETUP ---
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const complexityDisplay = document.getElementById('complexity-display');
const statusDisplay = document.getElementById('status-display');
const playPauseBtn = document.getElementById('play-pause-btn');
const stepBtn = document.getElementById('step-btn');
const prefixSumContainer = document.getElementById('prefix-sum-container');

// --- UTILITY ---
function showMessage(message, type = 'info', duration = 3000) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box bg-${type} show`;
    setTimeout(() => { messageBox.classList.remove('show'); }, duration);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- INFO & STATUS ---
const INFO = {
    'create': { complexity: 'O(n)', status: 'Creating array...' },
    'insert': { complexity: 'O(n)', status: 'Inserting element...' },
    'delete': { complexity: 'O(n)', status: 'Deleting element...' },
    'bubbleSort': { complexity: 'O(n²)', status: 'Bubble Sort' },
    'selectionSort': { complexity: 'O(n²)', status: 'Selection Sort' },
    'insertionSort': { complexity: 'O(n²)', status: 'Insertion Sort' },
    'prefixSum': { complexity: 'O(n)', status: 'Generating Prefix Sum Array...' },
    'rangeSum': { complexity: 'O(1)', status: 'Calculating Range Sum...' },
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
class ArrayVisualizer {
    constructor() {
        this.array = [];
        this.prefixSumArray = null; // NEW: To store the prefix sum array
        this.animationQueue = [];
        this.currentStep = 0;
        this.isPlaying = false;
        
        this.setupCanvas();
        this.setupEventListeners();
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 250 * dpr;
        ctx.scale(dpr, dpr);
        this.draw();
    }

    draw(highlights = {}) {
        const rect = canvas.parentElement.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (this.array.length === 0) return;

        const n = this.array.length;
        const cellSize = Math.min(60, (rect.width - 60) / n);
        const spacing = 8;
        const totalWidth = (n * cellSize) + ((n - 1) * spacing);
        const startX = (rect.width - totalWidth) / 2;
        const y = rect.height / 2 - cellSize;

        this.array.forEach((value, i) => {
            const x = startX + i * (cellSize + spacing);

            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, 8);

            ctx.fillStyle = highlights[i] || '#6366f1';
            ctx.strokeStyle = '#4338ca';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = `bold ${cellSize * 0.4}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, x + cellSize / 2, y + cellSize / 2);

            ctx.fillStyle = '#4b5563';
            ctx.font = `${cellSize * 0.25}px Fira Code`;
            ctx.textAlign = 'center';
            ctx.fillText(i, x + cellSize / 2, y + cellSize + 15);
        });
    }

    create(size) {
        if (this.isPlaying) return;
        if (size <= 0 || size > 15) {
            showMessage('Please enter a size between 1 and 15.', 'error');
            return;
        }
        updateInfo('create');
        this.array = Array.from({length: size}, () => Math.floor(Math.random() * 90) + 10);
        this.prefixSumArray = null; // Reset prefix sum array
        prefixSumContainer.innerHTML = ''; // Clear display
        this.draw();
        showMessage(`Array of size ${size} created.`, 'success');
        updateInfo(null);
    }
    
    // --- NEW: Prefix Sum Generation ---
    async generatePrefixSum() {
        if (this.isPlaying || this.array.length === 0) return;
        this.isPlaying = true;
        updateInfo('prefixSum');
        
        this.prefixSumArray = [];
        prefixSumContainer.innerHTML = '';
        let currentSum = 0;

        for(let i = 0; i < this.array.length; i++) {
            currentSum += this.array[i];
            this.prefixSumArray.push(currentSum);
            
            // Highlight elements being summed
            const highlights = {};
            for(let j = 0; j <= i; j++) { highlights[j] = '#f59e0b'; }
            this.draw(highlights);
            
            // Add new cell to the display
            const cell = document.createElement('div');
            cell.className = 'prefix-sum-cell';
            cell.textContent = currentSum;
            prefixSumContainer.appendChild(cell);
            
            await sleep(500);
        }

        this.draw(); // Clear highlights
        showMessage('Prefix sum array generated.', 'success');
        updateInfo(null);
        this.isPlaying = false;
    }

    // --- NEW: Range Sum Query ---
    getRangeSum(start, end) {
        if (this.isPlaying) return;
        if (!this.prefixSumArray) {
            showMessage('Please generate the prefix sum array first.', 'error');
            return;
        }
        if (isNaN(start) || isNaN(end) || start < 0 || end >= this.array.length || start > end) {
            showMessage('Invalid start or end index.', 'error');
            return;
        }
        updateInfo('rangeSum');

        const sum = this.prefixSumArray[end] - (start > 0 ? this.prefixSumArray[start - 1] : 0);
        
        // Highlight cells in the prefix sum display
        const cells = prefixSumContainer.children;
        cells[end].classList.add('highlight');
        if (start > 0) {
            cells[start - 1].classList.add('highlight');
        }

        showMessage(`Sum from index ${start} to ${end} is ${sum}.`, 'success');
        
        // Remove highlight after a delay
        setTimeout(() => {
            cells[end].classList.remove('highlight');
            if (start > 0) {
                cells[start - 1].classList.remove('highlight');
            }
            updateInfo(null);
        }, 2000);
    }

    async insert(value, index) { /* ... existing code ... */ }
    async delete(index) { /* ... existing code ... */ }
    prepareSort(sortType) { /* ... existing code ... */ }
    generateBubbleSortSteps(arr) { /* ... existing code ... */ }
    generateSelectionSortSteps(arr) { /* ... existing code ... */ }
    generateInsertionSortSteps(arr) { /* ... existing code ... */ }
    async stepForward() { /* ... existing code ... */ }
    async play() { /* ... existing code ... */ }
    pause() { /* ... existing code ... */ }

    setupEventListeners() {
        document.getElementById('create-btn').addEventListener('click', () => {
            this.create(parseInt(document.getElementById('create-size').value));
        });
        
        document.getElementById('insert-btn').addEventListener('click', () => {
            const value = parseInt(document.getElementById('value-input').value);
            const index = parseInt(document.getElementById('index-input').value);
            if (!isNaN(value) && !isNaN(index)) this.insert(value, index);
        });

        document.getElementById('delete-btn').addEventListener('click', () => {
            const index = parseInt(document.getElementById('index-input').value);
            if (!isNaN(index)) this.delete(index);
        });

        document.getElementById('sort-btn').addEventListener('click', () => {
            const sortType = document.getElementById('sort-select').value;
            this.prepareSort(sortType);
        });

        playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) this.pause();
            else this.play();
        });

        stepBtn.addEventListener('click', () => {
            if (!this.isPlaying) this.stepForward();
        });
        
        // --- NEW: Event listeners for prefix sum ---
        document.getElementById('prefix-sum-btn').addEventListener('click', () => {
            this.generatePrefixSum();
        });
        
        document.getElementById('range-sum-btn').addEventListener('click', () => {
            const start = parseInt(document.getElementById('range-start').value);
            const end = parseInt(document.getElementById('range-end').value);
            this.getRangeSum(start, end);
        });
    }
}

// NOTE: I'm omitting the unchanged methods from the class for brevity.
// You would paste the new methods and properties into your existing ArrayVisualizer class.
// The full, copy-pasteable code is below.
const fullClassCode = `
class ArrayVisualizer {
    constructor() {
        this.array = [];
        this.prefixSumArray = null; // NEW: To store the prefix sum array
        this.animationQueue = [];
        this.currentStep = 0;
        this.isPlaying = false;
        
        this.setupCanvas();
        this.setupEventListeners();
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 250 * dpr;
        ctx.scale(dpr, dpr);
        this.draw();
    }

    draw(highlights = {}) {
        const rect = canvas.parentElement.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (this.array.length === 0) return;

        const n = this.array.length;
        const cellSize = Math.min(60, (rect.width - 60) / n);
        const spacing = 8;
        const totalWidth = (n * cellSize) + ((n - 1) * spacing);
        const startX = (rect.width - totalWidth) / 2;
        const y = rect.height / 2 - cellSize;

        this.array.forEach((value, i) => {
            const x = startX + i * (cellSize + spacing);

            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, 8);

            ctx.fillStyle = highlights[i] || '#6366f1';
            ctx.strokeStyle = '#4338ca';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = \`bold \${cellSize * 0.4}px Inter\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, x + cellSize / 2, y + cellSize / 2);

            ctx.fillStyle = '#4b5563';
            ctx.font = \`\${cellSize * 0.25}px Fira Code\`;
            ctx.textAlign = 'center';
            ctx.fillText(i, x + cellSize / 2, y + cellSize + 15);
        });
    }

    create(size) {
        if (this.isPlaying) return;
        if (size <= 0 || size > 15) {
            showMessage('Please enter a size between 1 and 15.', 'error');
            return;
        }
        updateInfo('create');
        this.array = Array.from({length: size}, () => Math.floor(Math.random() * 90) + 10);
        this.prefixSumArray = null; // Reset prefix sum array
        prefixSumContainer.innerHTML = ''; // Clear display
        this.draw();
        showMessage(\`Array of size \${size} created.\`, 'success');
        updateInfo(null);
    }
    
    async generatePrefixSum() {
        if (this.isPlaying || this.array.length === 0) return;
        this.isPlaying = true;
        updateInfo('prefixSum');
        
        this.prefixSumArray = [];
        prefixSumContainer.innerHTML = '';
        let currentSum = 0;

        for(let i = 0; i < this.array.length; i++) {
            currentSum += this.array[i];
            this.prefixSumArray.push(currentSum);
            
            const highlights = {};
            for(let j = 0; j <= i; j++) { highlights[j] = '#f59e0b'; }
            this.draw(highlights);
            
            const cell = document.createElement('div');
            cell.className = 'prefix-sum-cell';
            cell.textContent = currentSum;
            prefixSumContainer.appendChild(cell);
            
            await sleep(500);
        }

        this.draw();
        showMessage('Prefix sum array generated.', 'success');
        updateInfo(null);
        this.isPlaying = false;
    }

    getRangeSum(start, end) {
        if (this.isPlaying) return;
        if (!this.prefixSumArray) {
            showMessage('Please generate the prefix sum array first.', 'error');
            return;
        }
        if (isNaN(start) || isNaN(end) || start < 0 || end >= this.array.length || start > end) {
            showMessage('Invalid start or end index.', 'error');
            return;
        }
        updateInfo('rangeSum');

        const sum = this.prefixSumArray[end] - (start > 0 ? this.prefixSumArray[start - 1] : 0);
        
        const cells = prefixSumContainer.children;
        cells[end].classList.add('highlight');
        if (start > 0) {
            cells[start - 1].classList.add('highlight');
        }

        showMessage(\`Sum from index \${start} to \${end} is \${sum}.\`, 'success');
        
        setTimeout(() => {
            cells[end].classList.remove('highlight');
            if (start > 0) {
                cells[start - 1].classList.remove('highlight');
            }
            updateInfo(null);
        }, 2000);
    }

    async insert(value, index) {
        if (this.isPlaying || index < 0 || index > this.array.length || this.array.length >= 15) {
             if (this.array.length >= 15) showMessage('Array is full (max 15).', 'error');
            return;
        }
        updateInfo('insert', \`Inserting \${value} at index \${index}\`);
        this.array.splice(index, 0, value);
        this.prefixSumArray = null; 
        prefixSumContainer.innerHTML = '';
        this.draw({[index]: '#22c55e'});
        await sleep(800);
        this.draw();
        updateInfo(null);
    }

    async delete(index) {
        if (this.isPlaying || index < 0 || index >= this.array.length) return;
        updateInfo('delete', \`Deleting element at index \${index}\`);
        this.prefixSumArray = null; 
        prefixSumContainer.innerHTML = '';
        this.draw({[index]: '#ef4444'});
        await sleep(800);
        this.array.splice(index, 1);
        this.draw();
        updateInfo(null);
    }

    prepareSort(sortType) {
        if (this.isPlaying || this.array.length <= 1) return;
        this.prefixSumArray = null; 
        prefixSumContainer.innerHTML = '';
        this.animationQueue = [];
        this.currentStep = 0;
        const tempArray = [...this.array];
        updateInfo(sortType);
        
        switch(sortType) {
            case 'bubbleSort': this.generateBubbleSortSteps(tempArray); break;
            case 'selectionSort': this.generateSelectionSortSteps(tempArray); break;
            case 'insertionSort': this.generateInsertionSortSteps(tempArray); break;
        }
        
        showMessage('Ready to visualize. Press Play or Step.', 'info');
    }

    generateBubbleSortSteps(arr) {
        const n = arr.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                this.animationQueue.push({ type: 'compare', indices: [j, j + 1], text: \`Comparing \${arr[j]} and \${arr[j+1]}\` });
                if (arr[j] > arr[j + 1]) {
                    this.animationQueue.push({ type: 'swap', indices: [j, j + 1], text: \`Swapping \${arr[j]} and \${arr[j+1]}\` });
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                }
            }
        }
    }
    
    generateSelectionSortSteps(arr) {
        const n = arr.length;
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            for (let j = i + 1; j < n; j++) {
                this.animationQueue.push({ type: 'compare', indices: [j, minIdx], text: \`Comparing \${arr[j]} and \${arr[minIdx]}\` });
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx !== i) {
                this.animationQueue.push({ type: 'swap', indices: [i, minIdx], text: \`Swapping \${arr[i]} and \${arr[minIdx]}\` });
                [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            }
        }
    }
    
    generateInsertionSortSteps(arr) {
         const n = arr.length;
        for (let i = 1; i < n; i++) {
            let key = arr[i];
            let j = i - 1;
            this.animationQueue.push({ type: 'compare', indices: [i, j], text: \`Comparing key \${key} with \${arr[j]}\` });
            while (j >= 0 && arr[j] > key) {
                this.animationQueue.push({ type: 'shift', indices: [j, j + 1], text: \`Shifting \${arr[j]}\` });
                arr[j + 1] = arr[j];
                j = j - 1;
                if(j >= 0) this.animationQueue.push({ type: 'compare', indices: [i, j], text: \`Comparing key \${key} with \${arr[j]}\` });
            }
            this.animationQueue.push({ type: 'insert', index: j + 1, value: key, text: \`Inserting \${key}\` });
            arr[j + 1] = key;
        }
    }

    async stepForward() {
        if (this.currentStep >= this.animationQueue.length) {
            this.isPlaying = false;
            playPauseBtn.textContent = 'Play';
            this.draw();
            updateInfo(null, 'Sort complete!');
            return;
        }

        const step = this.animationQueue[this.currentStep];
        statusDisplay.textContent = step.text;
        
        if (step.type === 'compare') {
            this.draw({ [step.indices[0]]: '#fde047', [step.indices[1]]: '#fde047' });
        } else if (step.type === 'swap') {
            const [i, j] = step.indices;
            this.draw({ [i]: '#f87171', [j]: '#f87171' });
            await sleep(250);
            [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
            this.draw({ [i]: '#4ade80', [j]: '#4ade80' });
        }
         else if (step.type === 'shift') {
            this.draw({ [step.indices[0]]: '#fbbf24', [step.indices[1]]: '#fde68a' });
            await sleep(250);
            this.array[step.indices[1]] = this.array[step.indices[0]];
            this.draw();
        } else if (step.type === 'insert') {
            this.draw({ [step.index]: '#4ade80' });
            await sleep(250);
            this.array[step.index] = step.value;
            this.draw();
        }

        this.currentStep++;
    }

    async play() {
        if (this.animationQueue.length === 0) return;
        this.isPlaying = true;
        playPauseBtn.textContent = 'Pause';
        while (this.isPlaying && this.currentStep < this.animationQueue.length) {
            await this.stepForward();
            await sleep(400);
        }
        if (this.isPlaying) { 
             this.isPlaying = false;
             playPauseBtn.textContent = 'Play';
             this.draw();
             updateInfo(null, 'Sort complete!');
        }
    }

    pause() {
        this.isPlaying = false;
        playPauseBtn.textContent = 'Play';
    }

    setupEventListeners() {
        document.getElementById('create-btn').addEventListener('click', () => {
            this.create(parseInt(document.getElementById('create-size').value));
        });
        
        document.getElementById('insert-btn').addEventListener('click', () => {
            const value = parseInt(document.getElementById('value-input').value);
            const index = parseInt(document.getElementById('index-input').value);
            if (!isNaN(value) && !isNaN(index)) this.insert(value, index);
        });

        document.getElementById('delete-btn').addEventListener('click', () => {
            const index = parseInt(document.getElementById('index-input').value);
            if (!isNaN(index)) this.delete(index);
        });

        document.getElementById('sort-btn').addEventListener('click', () => {
            const sortType = document.getElementById('sort-select').value;
            this.prepareSort(sortType);
        });

        playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) this.pause();
            else this.play();
        });

        stepBtn.addEventListener('click', () => {
            if (!this.isPlaying) this.stepForward();
        });
        
        document.getElementById('prefix-sum-btn').addEventListener('click', () => {
            this.generatePrefixSum();
        });
        
        document.getElementById('range-sum-btn').addEventListener('click', () => {
            const start = parseInt(document.getElementById('range-start').value);
            const end = parseInt(document.getElementById('range-end').value);
            this.getRangeSum(start, end);
        });
    }
}`;
// The above is just for display, the class below is the one that runs.
// I have to re-declare it to avoid breaking the context. The user should use the full code.
new ArrayVisualizer();