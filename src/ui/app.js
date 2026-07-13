document.addEventListener('DOMContentLoaded', () => {
    const feedContainer = document.getElementById('feed-container');
    const emptyState = document.getElementById('empty-state');
    const clearBtn = document.getElementById('clear-feed');
    
    // Stats elements
    const elFiles = document.getElementById('stat-files');
    const elChunks = document.getElementById('stat-chunks');
    const elTime = document.getElementById('stat-time');

    // Modal elements
    const modal = document.getElementById('details-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalCode = document.getElementById('modal-code');
    const closeModal = document.getElementById('close-modal');

    // Connect to Server-Sent Events (SSE)
    const evtSource = new EventSource('/events');

    evtSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status_update') {
                updateStats(data.payload);
            } else if (data.type === 'tool_call') {
                addFeedItem(data.payload);
            }
        } catch (err) {
            console.error("Error parsing event data:", err);
        }
    };

    evtSource.onerror = function(err) {
        console.error("SSE connection error", err);
    };

    function updateStats(stats) {
        // Animate counter
        animateValue(elFiles, parseInt(elFiles.innerText) || 0, stats.totalFiles, 1000);
        animateValue(elChunks, parseInt(elChunks.innerText) || 0, stats.totalChunks, 1000);
        
        if (stats.lastUpdated) {
            elTime.innerText = new Date(stats.lastUpdated).toLocaleTimeString();
        }
    }

    function addFeedItem(data) {
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        const item = document.createElement('div');
        
        let typeClass = 'status';
        let badgeText = data.tool;
        
        if (data.tool === 'search_code') typeClass = 'search';
        if (data.tool === 'index_project') typeClass = 'index';

        item.className = `feed-item ${typeClass}`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        // Format content
        let contentHtml = '';
        if (data.tool === 'search_code') {
            contentHtml = `Query: "${data.args.query}"`;
        } else if (data.tool === 'index_project') {
            contentHtml = `Indexing: ${data.args.projectPath}`;
        } else if (data.tool === 'multi_search') {
            const queriesPreview = data.args.queries.map(q => `"${q.query}"`).join(', ');
            contentHtml = `Multi-Search (${data.args.queries.length} queries): <br><span style="color:#a78bfa; font-size:0.8em">${queriesPreview}</span>`;
        } else if (data.tool === 'search_status') {
            contentHtml = `Checking server index status...`;
        } else {
            contentHtml = `Running ${data.tool}...`;
        }

        item.innerHTML = `
            <div class="feed-item-header">
                <span class="tool-badge ${typeClass}">${badgeText.replace('_', ' ')}</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="feed-content">${contentHtml}</div>
            <div class="feed-actions">
                <button class="btn-details">View Response</button>
            </div>
        `;

        // Store response data for the modal
        const btn = item.querySelector('.btn-details');
        btn.addEventListener('click', () => {
            showModal(data.tool, data.response);
        });

        feedContainer.prepend(item);

        // Keep only last 50 items
        if (feedContainer.children.length > 51) {
            feedContainer.lastElementChild.remove();
        }
    }

    clearBtn.addEventListener('click', () => {
        feedContainer.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'flex';
            feedContainer.appendChild(emptyState);
        }
    });

    // Modal Logic
    function showModal(tool, responseData) {
        modalTitle.innerText = `AI Output for: ${tool}`;
        if (typeof responseData === 'string') {
            modalCode.textContent = responseData;
        } else {
            modalCode.textContent = JSON.stringify(responseData, null, 2);
        }
        modal.classList.add('active');
    }

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Number animation utility
    function animateValue(obj, start, end, duration) {
        if (start === end) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }
});
