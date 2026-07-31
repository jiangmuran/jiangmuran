document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. I18N 配置
    // -------------------------------------------------------------------------
    const i18nData = {
        'zh': {
            'app.name': '选择你的皮肤',
            'mobile.title': '请在电脑端访问',
            'mobile.desc': '为了获得最佳的皮肤浏览与提取体验，本工具仅支持在大屏幕设备（PC/Mac）上使用。',
            'filter.all': '全部',
            'sort.label': '排序:',
            'sort.time': '最新上传',
            'sort.likes': '最多收藏',
            'stats.total': '当前结果:',
            'search.placeholder': '搜索皮肤名称...',
            'tutorial.title': '如何使用？',
            'tutorial.fullTitle': '如何使用？',
            'tutorial.step1.newTitle': '选择皮肤',
            'tutorial.step1.newDesc': '在右侧列表中浏览并点击你喜欢的皮肤卡片。',
            'tutorial.step2.newTitle': '复制指令',
            'tutorial.step2.newDesc': '系统会自动解析皮肤 Hash，完成后点击“复制指令”按钮。',
            'tutorial.step3.newTitle': '游戏内应用',
            'tutorial.step3.newDesc': '进入 Minecraft 服务器，打开聊天框（按 T 或 /），粘贴并发送指令即可！',
            'btn.start': '开始使用',
            'empty.title': '未找到相关皮肤',
            'empty.desc': '尝试更换关键词或筛选条件',
            'result.command': '服务器指令 (Command)',
            'btn.copy': '复制指令',
            'result.tip': '复制此指令并在服务器内粘贴即可应用皮肤',
            'status.fetching': '正在从 LittleSkin 解析...',
            'status.success': '解析成功',
            'status.error': '解析失败 (可能是网络或跨域限制)',
            'btn.retry': '重试'
        },
        'en': {
            'app.name': 'Select Your Skin',
            'mobile.title': 'Desktop Only',
            'mobile.desc': 'This tool is optimized for desktop usage.',
            'filter.all': 'All',
            'sort.label': 'Sort:',
            'sort.time': 'Latest',
            'sort.likes': 'Most Likes',
            'stats.total': 'Results:',
            'search.placeholder': 'Search skins...',
            'tutorial.title': 'How to use?',
            'tutorial.fullTitle': 'How to use?',
            'tutorial.step1.newTitle': 'Select Skin',
            'tutorial.step1.newDesc': 'Browse and click on a skin card.',
            'tutorial.step2.newTitle': 'Copy Command',
            'tutorial.step2.newDesc': 'Wait for resolution, then click "Copy Command".',
            'tutorial.step3.newTitle': 'Apply in Game',
            'tutorial.step3.newDesc': 'Paste command in Minecraft chat.',
            'btn.start': 'Get Started',
            'empty.title': 'No skins found',
            'empty.desc': 'Try different keywords or filters',
            'result.command': 'Server Command',
            'btn.copy': 'Copy Command',
            'result.tip': 'Paste into server chat to apply',
            'status.fetching': 'Fetching from LittleSkin...',
            'status.success': 'Resolved',
            'status.error': 'Failed (CORS or Network)',
            'btn.retry': 'Retry'
        }
    };

    let currentLang = 'zh';
    
    function applyLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        const langBtn = document.getElementById('langBtn');
        langBtn.textContent = lang === 'zh' ? 'En' : '中';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18nData[lang][key]) el.textContent = i18nData[lang][key];
        });
        
        document.querySelectorAll('[data-placeholder]').forEach(el => {
            const key = el.getAttribute('data-placeholder');
            if (i18nData[lang][key]) el.placeholder = i18nData[lang][key];
        });
    }

    document.getElementById('langBtn').addEventListener('click', () => {
        applyLanguage(currentLang === 'zh' ? 'en' : 'zh');
    });
    
    applyLanguage('zh');

    // -------------------------------------------------------------------------
    // 2. API 与 状态管理
    // -------------------------------------------------------------------------
    const API_BASE = 'https://littleskin.cn';
    
    let state = {
        filter: 'skin', // skin, steve, alex
        sort: 'time',   // time, likes
        page: 1,
        keyword: '',
        totalPages: 1
    };

    let debounceTimer;

    const skinsGrid = document.getElementById('skinsGrid');
    const emptyState = document.getElementById('emptyState');
    const totalCountEl = document.getElementById('totalCount');
    const paginationControls = document.getElementById('paginationControls');
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    // 核心拉取函数
    async function fetchSkins() {
        skinsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-sub);">Loading...</div>';
        emptyState.style.display = 'none';
        
        // Disable pagination while loading
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;

        try {
            const url = new URL(`${API_BASE}/skinlib/list`);
            url.searchParams.append('filter', state.filter === 'all' ? 'skin' : state.filter);
            url.searchParams.append('sort', state.sort);
            url.searchParams.append('page', state.page);
            if (state.keyword) {
                url.searchParams.append('keyword', state.keyword);
            }

            console.log('Fetching:', url.toString());
            const res = await fetch(url.toString());
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const json = await res.json();
            
            // 计算总页数
            if (json.last_page) {
                state.totalPages = json.last_page;
            } else if (json.total && json.per_page) {
                state.totalPages = Math.ceil(json.total / json.per_page);
            } else {
                state.totalPages = (json.data && json.data.length > 0) ? state.page + 1 : state.page;
            }
            
            const displayData = json.data || [];

            if (displayData.length > 0) {
                renderGrid(displayData);
                emptyState.style.display = 'none';
            } else {
                skinsGrid.innerHTML = '';
                emptyState.style.display = 'block';
            }
            updatePagination();

        } catch (error) {
            console.error('Fetch error:', error);
            skinsGrid.innerHTML = '';
            emptyState.style.display = 'block';
            paginationControls.style.display = 'none';
        }
    }

    function renderGrid(skins) {
        skinsGrid.innerHTML = '';
        totalCountEl.textContent = `${skins.length} (Page ${state.page})`;

        skins.forEach(skin => {
            const card = document.createElement('div');
            card.className = 'skin-card';
            card.onclick = () => openDetail(skin);
            
            const previewUrl = `${API_BASE}/preview/${skin.tid}?height=150`;

            const displayName = escapeHtml(skin.name);

            // 处理类型显示
            let typeDisplay;
            if (skin.type === 'steve') typeDisplay = 'Steve';
            else if (skin.type === 'alex') typeDisplay = 'Alex';
            else typeDisplay = skin.type; // 直接显示 'Unknown' 或其他

            card.innerHTML = `
                <div class="card-preview">
                    <img src="${previewUrl}" loading="lazy" alt="Skin">
                </div>
                <div class="card-info">
                    <div class="card-title">${displayName}</div>
                    <div class="card-meta">
                        <span>${typeDisplay}</span>
                        <span>♥ ${skin.likes || 0}</span>
                    </div>
                </div>
            `;
            skinsGrid.appendChild(card);
        });
        
        paginationControls.style.display = 'flex';
    }

    function updatePagination() {
        currentPageEl.textContent = state.page;
        totalPagesEl.textContent = state.totalPages || '?';
        
        prevPageBtn.disabled = state.page <= 1;
        // 如果我们知道 totalPages，就用它判断；否则只要没报错就允许下一页
        nextPageBtn.disabled = (state.totalPages && state.page >= state.totalPages);
    }

    // 事件监听
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.keyword = e.target.value.trim();
            state.page = 1;
            fetchSkins();
        }, 500); 
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        fetchSkins();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filter = btn.getAttribute('data-type');
            state.page = 1;
            fetchSkins();
        });
    });

    prevPageBtn.addEventListener('click', () => {
        if (state.page > 1) {
            state.page--;
            fetchSkins();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        // 允许翻页
        state.page++;
        fetchSkins();
    });

    // -------------------------------------------------------------------------
    // 3. 详情与 Hash 解析
    // -------------------------------------------------------------------------
    const detailModal = document.getElementById('detailModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const detailImage = document.getElementById('detailImage');
    const detailName = document.getElementById('detailName');
    const detailType = document.getElementById('detailType');
    const detailAuthor = document.getElementById('detailAuthor');
    const detailCommand = document.getElementById('detailCommand');
    const copyTrigger = document.querySelector('.copy-trigger');
    const btnText = copyTrigger.querySelector('.btn-text');
    const errorBox = document.getElementById('errorBox');
    
    let secretInterval = null; // 用于存储乱码定时器

    async function openDetail(skin) {
        detailModal.classList.add('show');
        detailModal.style.display = 'flex';
        
        detailName.textContent = skin.name;

        detailType.textContent = skin.type;
        detailAuthor.textContent = skin.nickname || skin.uploader; 
        detailImage.src = `${API_BASE}/preview/${skin.tid}?height=300`;
        
        // Reset
        detailCommand.textContent = i18nData[currentLang]['status.fetching'];
        detailCommand.style.color = ""; 
        copyTrigger.disabled = true;
        copyTrigger.style.background = '#334155'; // disabled style
        copyTrigger.style.animation = 'none'; 
        
        errorBox.style.display = 'none';
        btnText.textContent = i18nData[currentLang]['btn.copy']; // Reset btn text

        // Fetch Hash
        try {
            const res = await fetch(`${API_BASE}/texture/${skin.tid}`);
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            
            if (data.hash) {
                const command = `/skin set ${API_BASE}/textures/${data.hash}`;
                detailCommand.textContent = command;
                enableCopy();
            } else {
                throw new Error('No hash in response');
            }
        } catch (error) {
            console.error(error);
            detailCommand.textContent = i18nData[currentLang]['status.error'];
            errorBox.style.display = 'block';
            errorBox.textContent = `Error: ${error.message}`;
        }
    }

    function enableCopy() {
        copyTrigger.disabled = false;
        copyTrigger.style.background = ''; // reset to css default
        btnText.textContent = i18nData[currentLang]['btn.copy'];
    }

    copyTrigger.addEventListener('click', () => {
        const text = detailCommand.textContent;
        if (!text.startsWith('/')) return; 

        navigator.clipboard.writeText(text).then(() => {
            const original = btnText.textContent;
            btnText.textContent = currentLang === 'zh' ? '已复制!' : 'Copied!';
            copyTrigger.style.background = '#10b981';
            
            setTimeout(() => {
                btnText.textContent = original;
                copyTrigger.style.background = '';
            }, 2000);
        });
    });

    closeDetailBtn.addEventListener('click', () => {
        if (secretInterval) clearInterval(secretInterval);
        detailModal.classList.remove('show');
        setTimeout(() => detailModal.style.display = 'none', 300);
    });

    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            if (secretInterval) clearInterval(secretInterval);
            detailModal.classList.remove('show');
            setTimeout(() => detailModal.style.display = 'none', 300);
        }
    });

    // -------------------------------------------------------------------------
    // 4. Tutorial
    // -------------------------------------------------------------------------
    const tutorialModal = document.getElementById('tutorialModal');
    const closeTutorialBtn = document.getElementById('closeTutorialBtn');
    const closeTutorialMainBtn = document.getElementById('closeTutorialMainBtn');
    const toggleTutorialBtn = document.getElementById('toggleTutorialBtn');

    function toggleTutorial(show) {
        if (show) {
            tutorialModal.style.display = 'flex';
            setTimeout(() => tutorialModal.classList.add('show'), 10);
        } else {
            tutorialModal.classList.remove('show');
            setTimeout(() => tutorialModal.style.display = 'none', 300);
        }
    }

    toggleTutorialBtn.addEventListener('click', () => toggleTutorial(true));
    closeTutorialBtn.addEventListener('click', () => toggleTutorial(false));
    closeTutorialMainBtn.addEventListener('click', () => toggleTutorial(false));

    // Auto open
    setTimeout(() => toggleTutorial(true), 500);

    // Initial Fetch
    fetchSkins();
});

function escapeHtml(text) {
  if (!text) return text;
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
