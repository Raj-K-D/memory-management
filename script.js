
let memoryBlocks = [];
let allocatedProcesses = [];
let totalMemory = 0;
let operationHistory = [];
let currentView = 'blocks';

function initializeMemory() {
    const size = parseInt(document.getElementById('memorySize').value);
    const numBlocks = parseInt(document.getElementById('numBlocks').value);

    memoryBlocks = [];
    allocatedProcesses = [];
    totalMemory = size;

    let remaining = size;
    for (let i = 0; i < numBlocks; i++) {
        if (i === numBlocks - 1) {
            memoryBlocks.push({
                id: i,
                size: remaining,
                isFree: true,
                process: null
            });
        } else {
            const blockSize = Math.floor(remaining / (numBlocks - i) * (0.7 + Math.random() * 0.6));
            memoryBlocks.push({
                id: i,
                size: blockSize,
                isFree: true,
                process: null
            });
            remaining -= blockSize;
        }
    }

    addToHistory('Memory initialized', `${size}KB in ${numBlocks} blocks`);
    showMessage('Memory initialized successfully!', 'success');
    updateDisplay();
}

function allocateProcess() {
    const name = document.getElementById('processName').value.trim();
    const size = parseInt(document.getElementById('processSize').value);
    const algorithm = document.getElementById('algorithm').value;

    if (!name) {
        showMessage('Please enter a process name', 'error');
        return;
    }

    if (!size || size <= 0) {
        showMessage('Please enter a valid process size', 'error');
        return;
    }

    if (memoryBlocks.length === 0) {
        showMessage('Please initialize memory first', 'error');
        return;
    }

    let blockIndex = -1;

    if (algorithm === 'first-fit') {
        blockIndex = memoryBlocks.findIndex(block => block.isFree && block.size >= size);
    } else if (algorithm === 'best-fit') {
        let minWaste = Infinity;
        memoryBlocks.forEach((block, idx) => {
            if (block.isFree && block.size >= size) {
                const waste = block.size - size;
                if (waste < minWaste) {
                    minWaste = waste;
                    blockIndex = idx;
                }
            }
        });
    } else if (algorithm === 'worst-fit') {
        let maxWaste = -1;
        memoryBlocks.forEach((block, idx) => {
            if (block.isFree && block.size >= size) {
                const waste = block.size - size;
                if (waste > maxWaste) {
                    maxWaste = waste;
                    blockIndex = idx;
                }
            }
        });
    }

    if (blockIndex !== -1) {
        const block = memoryBlocks[blockIndex];

        if (block.size > size) {
            const newBlock = {
                id: memoryBlocks.length,
                size: block.size - size,
                isFree: true,
                process: null
            };
            block.size = size;
            memoryBlocks.splice(blockIndex + 1, 0, newBlock);
        }

        block.isFree = false;
        block.process = name;
        allocatedProcesses.push({ name, size, blockId: block.id, algorithm });

        addToHistory('Process allocated', `${name} (${size}KB) using ${algorithm}`);
        showMessage(`Process ${name} allocated successfully using ${algorithm}`, 'success');
        document.getElementById('processName').value = '';
        document.getElementById('processSize').value = '';
    } else {
        showMessage('No suitable memory block found for allocation', 'error');
    }

    updateDisplay();
}

function deallocateProcess(processName) {
    const processIndex = allocatedProcesses.findIndex(p => p.name === processName);
    if (processIndex === -1) return;

    const process = allocatedProcesses[processIndex];
    const block = memoryBlocks.find(b => b.id === process.blockId);

    if (block) {
        block.isFree = true;
        block.process = null;
    }

    allocatedProcesses.splice(processIndex, 1);
    addToHistory('Process deallocated', `${processName} (${process.size}KB)`);
    showMessage(`Process ${processName} deallocated`, 'info');
    mergeAdjacentFreeBlocks();
    updateDisplay();
}

function mergeAdjacentFreeBlocks() {
    for (let i = 0; i < memoryBlocks.length - 1; i++) {
        if (memoryBlocks[i].isFree && memoryBlocks[i + 1].isFree) {
            memoryBlocks[i].size += memoryBlocks[i + 1].size;
            memoryBlocks.splice(i + 1, 1);
            i--;
        }
    }
}

function resetMemory() {
    memoryBlocks = [];
    allocatedProcesses = [];
    totalMemory = 0;
    operationHistory = [];
    addToHistory('Memory reset', 'All memory cleared');
    showMessage('Memory reset successfully', 'info');
    updateDisplay();
}

function updateDisplay() {
    updateMemoryDisplay();
    updateProcessList();
    updateStats();
    updateHistory();
}

function updateMemoryDisplay() {
    const blocksContainer = document.getElementById('blocks-view');
    const visualContainer = document.getElementById('visual-view');

    blocksContainer.innerHTML = '';
    visualContainer.innerHTML = '';

    if (memoryBlocks.length === 0) {
        blocksContainer.innerHTML = '<p style="color: #999; text-align: center;">No memory blocks initialized</p>';
        visualContainer.innerHTML = '<p style="color: #999; text-align: center; line-height: 200px;">No memory blocks initialized</p>';
        return;
    }

    // Block view
    memoryBlocks.forEach(block => {
        const blockDiv = document.createElement('div');
        blockDiv.className = `memory-block ${block.isFree ? 'free' : 'allocated'}`;
        blockDiv.innerHTML = `
                    <div class="block-size">${block.size} KB</div>
                    <div class="block-label">${block.isFree ? 'Free' : block.process}</div>
                `;
        blockDiv.addEventListener('mouseenter', (e) => showTooltip(e, block));
        blockDiv.addEventListener('mouseleave', hideTooltip);
        blocksContainer.appendChild(blockDiv);
    });

    // Visual view
    let leftPosition = 0;
    memoryBlocks.forEach(block => {
        const segment = document.createElement('div');
        segment.className = `memory-segment ${block.isFree ? 'free' : 'allocated'}`;
        const width = (block.size / totalMemory) * 100;
        segment.style.width = `${width}%`;
        segment.style.left = `${leftPosition}%`;
        segment.innerHTML = `${block.isFree ? 'Free' : block.process}<br>${block.size}KB`;

        segment.addEventListener('mouseenter', (e) => showTooltip(e, block));
        segment.addEventListener('mouseleave', hideTooltip);

        visualContainer.appendChild(segment);
        leftPosition += width;
    });
}

function updateProcessList() {
    const processList = document.getElementById('processList');
    processList.innerHTML = '';

    if (allocatedProcesses.length === 0) {
        processList.innerHTML = '<p style="color: #999; text-align: center;">No processes allocated</p>';
    } else {
        allocatedProcesses.forEach(process => {
            const processDiv = document.createElement('div');
            processDiv.className = 'process-item';
            processDiv.innerHTML = `
                        <div class="process-info">
                            <div class="process-name">${process.name}</div>
                            <div class="process-size">${process.size} KB (${process.algorithm})</div>
                        </div>
                        <button class="deallocate-btn" onclick="deallocateProcess('${process.name}')">
                            <i class="fas fa-times"></i> Deallocate
                        </button>
                    `;
            processList.appendChild(processDiv);
        });
    }
}

function updateStats() {
    const usedMemory = memoryBlocks.filter(b => !b.isFree).reduce((sum, b) => sum + b.size, 0);
    const freeMemory = memoryBlocks.filter(b => b.isFree).reduce((sum, b) => sum + b.size, 0);
    const freeBlocks = memoryBlocks.filter(b => b.isFree).length;
    const utilization = totalMemory > 0 ? ((usedMemory / totalMemory) * 100).toFixed(1) : 0;

    document.getElementById('usedMemory').textContent = usedMemory;
    document.getElementById('freeMemory').textContent = freeMemory;
    document.getElementById('fragmentation').textContent = freeBlocks;
    document.getElementById('utilization').textContent = utilization + '%';
}

function updateHistory() {
    const timeline = document.getElementById('history-timeline');
    timeline.innerHTML = '';

    if (operationHistory.length === 0) {
        timeline.innerHTML = '<p style="color: #999; text-align: center;">No operations yet</p>';
        return;
    }

    operationHistory.slice().reverse().forEach(item => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
                    <div class="timeline-content">
                        <div class="timeline-title">${item.title}</div>
                        <div>${item.description}</div>
                        <div class="timeline-time">${item.time}</div>
                    </div>
                `;
        timeline.appendChild(timelineItem);
    });
}

function addToHistory(title, description) {
    const now = new Date();
    operationHistory.push({
        title,
        description,
        time: now.toLocaleTimeString()
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    messageDiv.innerHTML = `
                <div class="alert alert-${type}">
                    <i class="fas fa-${icon}"></i> ${text}
                </div>
            `;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function toggleView(view) {
    currentView = view;

    // Update view buttons
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update view display
    if (view === 'blocks') {
        document.getElementById('blocks-view').style.display = 'flex';
        document.getElementById('visual-view').style.display = 'none';
    } else {
        document.getElementById('blocks-view').style.display = 'none';
        document.getElementById('visual-view').style.display = 'block';
    }
}

function loadPreset(preset) {
    let memorySize, numBlocks;

    switch (preset) {
        case 'small':
            memorySize = 256;
            numBlocks = 4;
            break;
        case 'medium':
            memorySize = 1024;
            numBlocks = 6;
            break;
        case 'large':
            memorySize = 4096;
            numBlocks = 8;
            break;
        case 'fragmented':
            memorySize = 1024;
            numBlocks = 10;
            break;
    }

    document.getElementById('memorySize').value = memorySize;
    document.getElementById('numBlocks').value = numBlocks;
    initializeMemory();

    // For fragmented preset, add some processes and deallocate them
    if (preset === 'fragmented') {
        setTimeout(() => {
            document.getElementById('processName').value = 'P1';
            document.getElementById('processSize').value = 100;
            allocateProcess();

            setTimeout(() => {
                document.getElementById('processName').value = 'P2';
                document.getElementById('processSize').value = 150;
                allocateProcess();

                setTimeout(() => {
                    document.getElementById('processName').value = 'P3';
                    document.getElementById('processSize').value = 80;
                    allocateProcess();

                    setTimeout(() => {
                        deallocateProcess('P2');
                    }, 500);
                }, 500);
            }, 500);
        }, 500);
    }
}

function compareAlgorithms() {
    if (memoryBlocks.length === 0) {
        showMessage('Please initialize memory first', 'error');
        return;
    }

    const resultsDiv = document.getElementById('comparison-results');
    resultsDiv.innerHTML = '<div class="loading-spinner"></div> Running comparison test...';

    // Create a copy of current memory state
    const originalBlocks = JSON.parse(JSON.stringify(memoryBlocks));
    const originalProcesses = JSON.parse(JSON.stringify(allocatedProcesses));

    // Test each algorithm with the same set of processes
    const testProcesses = [
        { name: 'Test1', size: 100 },
        { name: 'Test2', size: 200 },
        { name: 'Test3', size: 150 },
        { name: 'Test4', size: 80 },
        { name: 'Test5', size: 120 }
    ];

    const algorithms = ['first-fit', 'best-fit', 'worst-fit'];
    const results = {};

    setTimeout(() => {
        algorithms.forEach(algorithm => {
            // Reset memory
            memoryBlocks = JSON.parse(JSON.stringify(originalBlocks));
            allocatedProcesses = [];

            // Run allocation test
            let allocatedCount = 0;
            let totalWaste = 0;

            testProcesses.forEach(process => {
                document.getElementById('algorithm').value = algorithm;
                document.getElementById('processName').value = process.name;
                document.getElementById('processSize').value = process.size;

                // Simulate allocation without UI updates
                const blockIndex = findBlockForAllocation(process.size, algorithm);
                if (blockIndex !== -1) {
                    const block = memoryBlocks[blockIndex];
                    if (block.size > process.size) {
                        const newBlock = {
                            id: memoryBlocks.length,
                            size: block.size - process.size,
                            isFree: true,
                            process: null
                        };
                        block.size = process.size;
                        memoryBlocks.splice(blockIndex + 1, 0, newBlock);
                    }
                    block.isFree = false;
                    block.process = process.name;
                    allocatedProcesses.push({ name: process.name, size: process.size, blockId: block.id });
                    allocatedCount++;
                    totalWaste += block.size - process.size;
                }
            });

            results[algorithm] = {
                allocated: allocatedCount,
                waste: totalWaste,
                efficiency: ((allocatedCount / testProcesses.length) * 100).toFixed(1)
            };
        });

        // Restore original state
        memoryBlocks = originalBlocks;
        allocatedProcesses = originalProcesses;

        // Display results
        let resultsHTML = '<table class="comparison-table"><thead><tr><th>Algorithm</th><th>Processes Allocated</th><th>Memory Waste (KB)</th><th>Efficiency</th></tr></thead><tbody>';

        algorithms.forEach(algorithm => {
            const result = results[algorithm];
            const algorithmName = algorithm.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            resultsHTML += `
                        <tr>
                            <td><strong>${algorithmName}</strong></td>
                            <td>${result.allocated}/${testProcesses.length}</td>
                            <td>${result.waste}</td>
                            <td>${result.efficiency}%</td>
                        </tr>
                    `;
        });

        resultsHTML += '</tbody></table>';
        resultsDiv.innerHTML = resultsHTML;
    }, 1000);
}

function findBlockForAllocation(size, algorithm) {
    let blockIndex = -1;

    if (algorithm === 'first-fit') {
        blockIndex = memoryBlocks.findIndex(block => block.isFree && block.size >= size);
    } else if (algorithm === 'best-fit') {
        let minWaste = Infinity;
        memoryBlocks.forEach((block, idx) => {
            if (block.isFree && block.size >= size) {
                const waste = block.size - size;
                if (waste < minWaste) {
                    minWaste = waste;
                    blockIndex = idx;
                }
            }
        });
    } else if (algorithm === 'worst-fit') {
        let maxWaste = -1;
        memoryBlocks.forEach((block, idx) => {
            if (block.isFree && block.size >= size) {
                const waste = block.size - size;
                if (waste > maxWaste) {
                    maxWaste = waste;
                    blockIndex = idx;
                }
            }
        });
    }

    return blockIndex;
}

function exportData() {
    const data = {
        memorySize: totalMemory,
        memoryBlocks: memoryBlocks,
        allocatedProcesses: allocatedProcesses,
        operationHistory: operationHistory,
        timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `memory-simulation-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showMessage('Data exported successfully', 'success');
}

function showTooltip(event, block) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `
                <strong>${block.isFree ? 'Free Block' : 'Allocated to ' + block.process}</strong><br>
                Size: ${block.size} KB<br>
                ${block.isFree ? 'Available for allocation' : 'In use'}
            `;
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
    tooltip.classList.add('show');
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeMemory();
});
