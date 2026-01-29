(function() {
    'use strict';

    // ===== State =====
    let allSessions = [];
    let allProjects = [];
    let stats = {};
    let currentFilter = 'all';
    let currentSearch = '';
    let currentSessionId = null;
    let filteredSessions = [];

    // Virtual scroll state
    const MESSAGES_PER_PAGE = 50;
    let currentPage = 0;
    let allMessages = [];
    let isLoadingMore = false;

    // ===== DOM Elements =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ===== Initialization =====
    function init() {
        bindEvents();
        checkTheme();
    }

    function checkTheme() {
        const savedTheme = localStorage.getItem('deepv-theme');
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            $('#theme-toggle').textContent = '🌙';
        }
    }

    // ===== Event Binding =====
    function bindEvents() {
        // File upload
        $('#upload-btn').addEventListener('click', () => $('#file-input').click());
        $('#file-input').addEventListener('change', handleFileSelect);
        $('#load-new-btn').addEventListener('click', () => {
            $('#file-input').value = '';
            $('#file-input').click();
        });

        // Drag and drop
        document.addEventListener('dragenter', handleDragEnter);
        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('dragleave', handleDragLeave);
        document.addEventListener('drop', handleDrop);

        // Filter tabs
        $$('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.filter;
                updateFilteredSessions();
                renderSessionList();
            });
        });

        // Search input
        $('#search-input').addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            updateFilteredSessions();
            renderSessionList();
        });

        // Session list clicks
        $('#session-list').addEventListener('click', (e) => {
            const card = e.target.closest('.session-card');
            if (card) {
                const sessionId = card.dataset.sessionId;
                loadSessionDetail(sessionId);
            }
        });

        // Theme toggle
        $('#theme-toggle').addEventListener('click', toggleTheme);

        // Tool card toggle (delegated)
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.tool-header');
            if (header) {
                const card = header.closest('.tool-card');
                card.classList.toggle('expanded');
            }
        });

        // Message copy (delegated)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.msg-action-btn');
            if (btn && btn.dataset.action === 'copy') {
                const msgIndex = parseInt(btn.dataset.index);
                copyMessage(msgIndex);
            }
        });

        // Detail action buttons
        $('#btn-export-zip').addEventListener('click', exportSessionZip);
        $('#btn-export-md').addEventListener('click', exportSessionMd);
        $('#btn-copy-all').addEventListener('click', copyAllMessages);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                const input = $('#search-input');
                if (document.activeElement !== input && $('#main-view').style.display !== 'none') {
                    e.preventDefault();
                    input.focus();
                }
            }
            if (e.key === 'Escape') {
                $('#search-input').value = '';
                currentSearch = '';
                updateFilteredSessions();
                renderSessionList();
            }
            if (e.key === 't' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
                toggleTheme();
            }
        });

        // Infinite scroll for messages
        $('#message-list').addEventListener('scroll', handleMessageScroll);
    }

    // ===== Drag & Drop =====
    function handleDragEnter(e) {
        e.preventDefault();
        $('#drop-zone-overlay').classList.add('active');
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragLeave(e) {
        if (e.target === $('#drop-zone-overlay')) {
            $('#drop-zone-overlay').classList.remove('active');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        $('#drop-zone-overlay').classList.remove('active');

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.zip')) {
            processZipFile(files[0]);
        } else {
            showToast('Please drop a .zip file');
        }
    }

    // ===== File Processing =====
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processZipFile(file);
        }
    }

    async function processZipFile(file) {
        showLoading('Extracting archive...');

        try {
            const zip = await JSZip.loadAsync(file);

            // Look for index.json or sessions data
            let indexData = null;
            const sessions = [];
            const projects = new Map();

            // Check for index.json first
            if (zip.files['index.json']) {
                const indexContent = await zip.files['index.json'].async('string');
                indexData = JSON.parse(indexContent);
            }

            // Process session directories
            const sessionDirs = new Set();
            for (const filename of Object.keys(zip.files)) {
                const parts = filename.split('/');
                if (parts.length >= 2 && parts[1]) {
                    sessionDirs.add(parts[0]);
                }
            }

            setLoadingText(`Processing ${sessionDirs.size} sessions...`);

            for (const sessionDir of sessionDirs) {
                const metadataFile = zip.files[`${sessionDir}/metadata.json`];
                const historyFile = zip.files[`${sessionDir}/history.json`];

                if (metadataFile) {
                    try {
                        const metadata = JSON.parse(await metadataFile.async('string'));
                        let history = [];

                        if (historyFile) {
                            history = JSON.parse(await historyFile.async('string'));
                        }

                        // Determine source
                        const source = metadata.modelConfig ? 'vscode' :
                                       metadata.workdirHash ? 'cli' : 'cli';

                        const projectHash = metadata.workdirHash || metadata.projectName || 'unknown';

                        sessions.push({
                            session_id: metadata.sessionId || sessionDir,
                            project_hash: projectHash,
                            source: source,
                            metadata: metadata,
                            history: history
                        });

                        if (!projects.has(projectHash)) {
                            projects.set(projectHash, {
                                hash: projectHash,
                                name: projectHash,
                                source: source
                            });
                        }
                    } catch (err) {
                        console.warn(`Failed to parse session ${sessionDir}:`, err);
                    }
                }
            }

            // Sort by last active
            sessions.sort((a, b) => {
                const dateA = a.metadata.lastActiveAt || a.metadata.createdAt || '';
                const dateB = b.metadata.lastActiveAt || b.metadata.createdAt || '';
                return dateB.localeCompare(dateA);
            });

            // Calculate stats
            allSessions = sessions;
            allProjects = Array.from(projects.values());
            stats = {
                projects: projects.size,
                sessions: sessions.length,
                messages: sessions.reduce((sum, s) => sum + (s.metadata.messageCount || s.history.length), 0),
                tokens: sessions.reduce((sum, s) => sum + (s.metadata.totalTokens || 0), 0)
            };

            hideLoading();
            showMainView();

        } catch (err) {
            hideLoading();
            showToast('Failed to process ZIP file: ' + err.message);
            console.error(err);
        }
    }

    // ===== UI State Management =====
    function showLoading(text) {
        $('#loading-text').textContent = text || 'Loading...';
        $('#loading-overlay').style.display = 'flex';
    }

    function setLoadingText(text) {
        $('#loading-text').textContent = text;
    }

    function hideLoading() {
        $('#loading-overlay').style.display = 'none';
    }

    function showMainView() {
        $('#upload-state').style.display = 'none';
        $('#main-view').style.display = 'flex';
        $('#stats-container').style.display = 'flex';

        renderStats();
        updateFilteredSessions();
        renderSessionList();
    }

    // ===== Render Functions =====
    function renderStats() {
        $('#stat-projects').textContent = stats.projects;
        $('#stat-sessions').textContent = stats.sessions;
        $('#stat-messages').textContent = formatNumber(stats.messages);
        $('#stat-tokens').textContent = formatNumber(stats.tokens);
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function updateFilteredSessions() {
        let sessions = allSessions;

        // Apply source filter
        if (currentFilter !== 'all') {
            sessions = sessions.filter(s => s.source === currentFilter);
        }

        // Apply search filter
        if (currentSearch) {
            sessions = sessions.filter(s => {
                const title = (s.metadata.title || '').toLowerCase();
                const firstMsg = (s.metadata.firstUserMessage || '').toLowerCase();
                return title.includes(currentSearch) || firstMsg.includes(currentSearch);
            });
        }

        filteredSessions = sessions;
    }

    function renderSessionList() {
        const container = $('#session-list');
        container.innerHTML = '';

        filteredSessions.forEach((session) => {
            const card = document.createElement('div');
            card.className = 'session-card';
            card.dataset.sessionId = session.session_id;

            if (session.session_id === currentSessionId) {
                card.classList.add('active');
            }

            const title = session.metadata.title || 'Untitled Session';
            const date = formatDate(session.metadata.lastActiveAt || session.metadata.createdAt);
            const msgCount = session.metadata.messageCount || session.history.length;
            const sourceClass = session.source === 'cli' ? 'cli' : 'vscode';
            const sourceLabel = session.source === 'cli' ? 'CLI' : 'VS';

            card.innerHTML = `
                <div class="session-title">${escapeHtml(title)}</div>
                <div class="session-meta">
                    <span class="source-tag ${sourceClass}">${sourceLabel}</span>
                    <span>${date}</span>
                    <span>${msgCount} msgs</span>
                </div>
            `;

            container.appendChild(card);
        });
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return diffDays + ' days ago';
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } catch {
            return isoString;
        }
    }

    // ===== Session Detail =====
    function loadSessionDetail(sessionId) {
        const session = allSessions.find(s => s.session_id === sessionId);
        if (!session) return;

        currentSessionId = sessionId;

        // Update active state in list
        $$('.session-card').forEach(card => {
            card.classList.toggle('active', card.dataset.sessionId === sessionId);
        });

        // Show detail panel
        $('#empty-state').style.display = 'none';
        $('#session-detail').classList.add('active');

        // Render header
        $('#detail-title').textContent = session.metadata.title || 'Untitled Session';
        $('#detail-date').textContent = new Date(session.metadata.createdAt).toLocaleString();
        $('#detail-messages').textContent = session.metadata.messageCount || session.history.length;
        $('#detail-tokens').textContent = formatNumber(session.metadata.totalTokens || 0);

        // Model tag
        const model = session.metadata.model || session.metadata.modelConfig?.modelName || 'unknown';
        $('#detail-model').textContent = model;

        // Source tag
        const sourceTag = $('#detail-source');
        sourceTag.textContent = session.source === 'cli' ? 'CLI' : 'VS Code';
        sourceTag.className = 'source-tag ' + (session.source === 'cli' ? 'cli' : 'vscode');

        // Prepare messages with virtual scroll
        allMessages = mergeMessages(session.history);
        currentPage = 0;

        // Render first batch
        renderMessages(true);
    }

    function mergeMessages(history) {
        const merged = [];
        let currentGemini = null;

        for (const msg of history) {
            if (msg.type === 'info') continue;

            if (msg.type === 'gemini' || msg.type === 'gemini_content') {
                if (currentGemini) {
                    currentGemini.text += '\n\n---\n\n' + (msg.text || '');
                    currentGemini.mergeCount = (currentGemini.mergeCount || 1) + 1;
                } else {
                    currentGemini = { ...msg, type: 'assistant', mergeCount: 1 };
                }
            } else {
                if (currentGemini) {
                    merged.push(currentGemini);
                    currentGemini = null;
                }
                let normalizedMsg = { ...msg };
                if (msg.type === 'assistant') {
                    normalizedMsg.type = 'assistant';
                }
                merged.push(normalizedMsg);
            }
        }

        if (currentGemini) merged.push(currentGemini);
        return merged;
    }

    function renderMessages(reset = false) {
        const container = $('#message-list');

        if (reset) {
            container.innerHTML = '';
            container.scrollTop = 0;
        }

        const startIdx = currentPage * MESSAGES_PER_PAGE;
        const endIdx = Math.min(startIdx + MESSAGES_PER_PAGE, allMessages.length);
        const fragment = document.createDocumentFragment();

        for (let i = startIdx; i < endIdx; i++) {
            const msg = allMessages[i];
            const el = createMessageElement(msg, i);
            if (el) fragment.appendChild(el);
        }

        container.appendChild(fragment);
        isLoadingMore = false;
    }

    function handleMessageScroll(e) {
        const container = e.target;
        const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        if (scrollBottom < 200 && !isLoadingMore) {
            const totalPages = Math.ceil(allMessages.length / MESSAGES_PER_PAGE);
            if (currentPage < totalPages - 1) {
                isLoadingMore = true;
                currentPage++;
                renderMessages(false);
            }
        }
    }

    function createMessageElement(msg, index) {
        const div = document.createElement('div');

        if (msg.type === 'tool_group') {
            return createToolGroupElement(msg);
        }

        if (msg.type === 'tool_use' || msg.type === 'tool_result') {
            return createToolElement(msg);
        }

        const roleInfo = getRoleInfo(msg.type);
        div.className = `message ${msg.type}`;

        const mergeTag = msg.mergeCount > 1 ?
            `<span class="merge-tag">+${msg.mergeCount - 1} merged</span>` : '';

        const content = renderMarkdown(msg.text || '');

        div.innerHTML = `
            <div class="message-header">
                <div class="message-role">
                    <span class="message-role-icon">${roleInfo.icon}</span>
                    <span>${roleInfo.name}</span>
                    ${mergeTag}
                </div>
                <div class="message-actions">
                    <button class="msg-action-btn" data-action="copy" data-index="${index}" title="Copy">📋</button>
                </div>
            </div>
            <div class="message-content">${content}</div>
        `;

        return div;
    }

    function createToolGroupElement(msg) {
        const div = document.createElement('div');
        div.className = 'message tool';

        let toolsHtml = '';
        for (const tool of (msg.tools || [])) {
            const statusClass = tool.status === 'Success' ? 'success' : 'error';
            const statusIcon = tool.status === 'Success' ? '✅' : '❌';

            toolsHtml += `
                <div class="tool-card">
                    <div class="tool-header">
                        <div class="tool-name">
                            🔧 ${escapeHtml(tool.name || tool.toolId)}
                            <span class="tool-desc">${escapeHtml(tool.description || '')}</span>
                        </div>
                        <div>
                            <span class="tool-status ${statusClass}">${statusIcon} ${tool.status}</span>
                            <span class="tool-toggle">▼</span>
                        </div>
                    </div>
                    <div class="tool-body">${escapeHtml(tool.resultDisplay || JSON.stringify(tool, null, 2))}</div>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="message-header">
                <div class="message-role">
                    <span class="message-role-icon">🔧</span>
                    <span>Tools (${msg.tools?.length || 0})</span>
                </div>
            </div>
            <div class="message-content">${toolsHtml}</div>
        `;

        return div;
    }

    function createToolElement(msg) {
        const div = document.createElement('div');
        div.className = 'message ' + (msg.type === 'tool_use' ? 'tool' : 'tool-result');

        const roleInfo = msg.type === 'tool_use' ?
            { icon: '🔧', name: 'Tool Call' } :
            { icon: '📤', name: 'Tool Result' };

        div.innerHTML = `
            <div class="message-header">
                <div class="message-role">
                    <span class="message-role-icon">${roleInfo.icon}</span>
                    <span>${roleInfo.name}</span>
                </div>
            </div>
            <div class="message-content">
                <div class="tool-card">
                    <div class="tool-header">
                        <div class="tool-name">${escapeHtml(msg.name || msg.toolId || 'Tool')}</div>
                        <span class="tool-toggle">▼</span>
                    </div>
                    <div class="tool-body">${escapeHtml(msg.text || JSON.stringify(msg, null, 2))}</div>
                </div>
            </div>
        `;

        return div;
    }

    function getRoleInfo(type) {
        switch (type) {
            case 'user':
                return { icon: '👤', name: 'User' };
            case 'assistant':
            case 'gemini':
                return { icon: '🤖', name: 'Assistant' };
            case 'tool_use':
                return { icon: '🔧', name: 'Tool' };
            case 'tool_result':
                return { icon: '📤', name: 'Result' };
            default:
                return { icon: '💬', name: 'Message' };
        }
    }

    // ===== Markdown Rendering =====
    function renderMarkdown(text) {
        if (!text) return '';

        try {
            // Configure marked for security
            marked.setOptions({
                breaks: true,
                gfm: true
            });
            return marked.parse(text);
        } catch (err) {
            // Fallback: simple HTML escape
            return escapeHtml(text).replace(/\n/g, '<br>');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== Actions =====
    function copyMessage(index) {
        const msg = allMessages[index];
        if (msg) {
            copyToClipboard(msg.text || JSON.stringify(msg, null, 2));
            showToast('Copied to clipboard!');
        }
    }

    function copyAllMessages() {
        const session = allSessions.find(s => s.session_id === currentSessionId);
        if (!session) return;

        const text = allMessages
            .filter(m => m.type === 'user' || m.type === 'assistant')
            .map(m => {
                const role = m.type === 'user' ? 'User' : 'Assistant';
                return `### ${role}\n\n${m.text || ''}`;
            })
            .join('\n\n---\n\n');

        copyToClipboard(text);
        showToast('All messages copied!');
    }

    async function exportSessionZip() {
        const session = allSessions.find(s => s.session_id === currentSessionId);
        if (!session) return;

        showLoading('Creating ZIP...');

        try {
            const zip = new JSZip();
            const folder = zip.folder(session.session_id);

            folder.file('metadata.json', JSON.stringify(session.metadata, null, 2));
            folder.file('history.json', JSON.stringify(session.history, null, 2));

            const blob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(blob, `session_${session.session_id}.zip`);

            hideLoading();
            showToast('ZIP exported!');
        } catch (err) {
            hideLoading();
            showToast('Export failed: ' + err.message);
        }
    }

    function exportSessionMd() {
        const session = allSessions.find(s => s.session_id === currentSessionId);
        if (!session) return;

        const messages = allMessages
            .filter(m => m.type === 'user' || m.type === 'assistant')
            .map(m => {
                const role = m.type === 'user' ? '👤 User' : '🤖 Assistant';
                return `### ${role}\n\n${m.text || ''}`;
            })
            .join('\n\n---\n\n');

        const md = `# ${session.metadata.title || 'Session'}

> Exported: ${new Date().toLocaleString()}
> Model: ${session.metadata.model || 'unknown'}
> Messages: ${session.metadata.messageCount || session.history.length}

---

${messages}

---

*Exported from DeepV Chat Viewer v4.0*
`;

        downloadText(md, `session_${session.session_id}.md`);
        showToast('Markdown exported!');
    }

    // ===== Theme =====
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';

        if (next === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            $('#theme-toggle').textContent = '☀️';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            $('#theme-toggle').textContent = '🌙';
        }

        localStorage.setItem('deepv-theme', next);
    }

    // ===== Utilities =====
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, filename);
    }

    function showToast(message) {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2500);
    }

    // ===== Start =====
    document.addEventListener('DOMContentLoaded', init);
})();
