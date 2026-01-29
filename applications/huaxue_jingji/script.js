// 游戏状态管理
const GameState = {
    PRELOADER: 'preloader',
    START: 'start',
    GAME: 'game',
    END: 'end',
    LEADERBOARD: 'leaderboard'
};

// 游戏配置
const GAME_CONFIG = {
    GAME_TIME: 60, // 60秒
    CORRECT_SCORE: 10,
    WRONG_SCORE: -5,
    WRONG_PENALTY: 2, // 秒
    CORRECT_REWARD: 1, // 秒
    COMBO_THRESHOLD: 3,
    PERFECT_COMBO_THRESHOLD: 5,
    COMBO_BONUS: 5,
    PERFECT_COMBO_BONUS: 20,
    INITIAL_CARDS: 5,
    CARDS_INCREMENT: 1,
    LEVEL_UP_THRESHOLD: 5
};

// DOM元素缓存
const elements = {
    preloader: null,
    startScreen: null,
    gameScreen: null,
    endScreen: null,
    leaderboardScreen: null,
    player1IdInput: null,
    player2IdInput: null,
    startBtn: null,
    leaderboardBtn: null,
    pauseBtn: null,
    restartBtn: null,
    backBtn: null
};

// 游戏状态
let gameState = {
    currentScreen: GameState.PRELOADER,
    players: {
        1: {
            id: 'Player_李宗伟',
            score: 0,
            time: GAME_CONFIG.GAME_TIME,
            correctCount: 0,
            wrongCount: 0,
            combo: 0,
            selectedCard: null,
            currentCategory: null,
            cards: [],
            level: 1,
            completedQuestions: 0,
            errorStreak: 0,
            isBlocked: false, // 玩家是否被阻塞（知识点弹窗）
            correctAnswers: [], // 当前题目的所有正确答案
            selectedCorrect: [] // 已选中的正确答案索引
        },
        2: {
            id: 'Player_林丹',
            score: 0,
            time: GAME_CONFIG.GAME_TIME,
            correctCount: 0,
            wrongCount: 0,
            combo: 0,
            selectedCard: null,
            currentCategory: null,
            cards: [],
            level: 1,
            completedQuestions: 0,
            errorStreak: 0,
            isBlocked: false, // 玩家是否被阻塞（知识点弹窗）
            correctAnswers: [], // 当前题目的所有正确答案
            selectedCorrect: [] // 已选中的正确答案索引
        }
    },
    gameTimer: null,
    isPaused: false
};

// 排行榜数据
let leaderboard = [];

// 初始化
function init() {
    cacheElements();
    loadLeaderboard();
    setupEventListeners();
    startPreloader();
}

// 缓存DOM元素
function cacheElements() {
    elements.preloader = document.getElementById('preloader');
    elements.startScreen = document.getElementById('start-screen');
    elements.gameScreen = document.getElementById('game-screen');
    elements.endScreen = document.getElementById('end-screen');
    elements.leaderboardScreen = document.getElementById('leaderboard-screen');
    elements.player1IdInput = document.getElementById('player1-id');
    elements.player2IdInput = document.getElementById('player2-id');
    elements.startBtn = document.getElementById('start-btn');
    elements.leaderboardBtn = document.getElementById('leaderboard-btn');
    elements.pauseBtn = document.getElementById('pause-btn');
    elements.restartBtn = document.getElementById('restart-btn');
    elements.backBtn = document.getElementById('back-btn');
    
    // 排行榜按钮（多个）
    const leaderboardBtns = document.querySelectorAll('[id^="leaderboard-btn"]');
    leaderboardBtns.forEach(btn => {
        btn.addEventListener('click', showLeaderboard);
    });
}

// 设置事件监听器
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.restartBtn.addEventListener('click', resetGame);
    elements.backBtn.addEventListener('click', () => showScreen(GameState.START));
}

// 预加载系统
function startPreloader() {
    showScreen(GameState.PRELOADER);
    
    // 5秒后切换到开始界面
    setTimeout(() => {
        showScreen(GameState.START);
        generatePlayerIds();
    }, 5000);
}

// 生成玩家ID
function generatePlayerIds() {
    const timestamp = Date.now();
    const id1 = `JMR${(timestamp + '').slice(-5)}`;
    const id2 = `JMR${((timestamp + 1) + '').slice(-5)}`;
    
    elements.player1IdInput.value = id1;
    elements.player2IdInput.value = id2;
}

// 显示屏幕
function showScreen(screen) {
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
    });
    
    // 显示目标屏幕
    let targetScreen = null;
    switch(screen) {
        case GameState.PRELOADER:
            targetScreen = elements.preloader;
            break;
        case GameState.START:
            targetScreen = elements.startScreen;
            break;
        case GameState.GAME:
            targetScreen = elements.gameScreen;
            break;
        case GameState.END:
            targetScreen = elements.endScreen;
            break;
        case GameState.LEADERBOARD:
            targetScreen = elements.leaderboardScreen;
            break;
    }
    
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('fade-in');
        gameState.currentScreen = screen;
    }
}

// 开始游戏
function startGame() {
    const player1Id = elements.player1IdInput.value.trim() || 'Player1';
    const player2Id = elements.player2IdInput.value.trim() || 'Player2';
    
    // 重置游戏状态
    resetGameState();
    gameState.players[1].id = player1Id;
    gameState.players[2].id = player2Id;
    
    // 更新显示
    updatePlayerDisplay();
    
    // 显示游戏界面
    showScreen(GameState.GAME);
    
    // 播放背景音乐
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.play().catch(e => {
            console.warn('无法播放背景音乐:', e);
        });
    }
    
    // 开始游戏循环
    startGameLoop();
    startTimer();
}

// 重置游戏状态
function resetGameState() {
    // 清理事件监听器
    for (let playerNum = 1; playerNum <= 2; playerNum++) {
        const targetArea = document.getElementById(`player${playerNum}-target`);
        if (targetClickHandlers[playerNum] && targetArea) {
            targetArea.removeEventListener('click', targetClickHandlers[playerNum]);
            targetClickHandlers[playerNum] = null;
        }
    }
    
    gameState.players[1] = {
        id: 'Player1',
        score: 0,
        time: GAME_CONFIG.GAME_TIME,
        correctCount: 0,
        wrongCount: 0,
        combo: 0,
        selectedCard: null,
        currentCategory: null,
        cards: [],
        level: 1,
        completedQuestions: 0,
        errorStreak: 0,
        isBlocked: false,
        correctAnswers: [],
        selectedCorrect: []
    };
    gameState.players[2] = {
        id: 'Player2',
        score: 0,
        time: GAME_CONFIG.GAME_TIME,
        correctCount: 0,
        wrongCount: 0,
        combo: 0,
        selectedCard: null,
        currentCategory: null,
        cards: [],
        level: 1,
        completedQuestions: 0,
        errorStreak: 0,
        isBlocked: false,
        correctAnswers: [],
        selectedCorrect: []
    };
    gameState.isPaused = false;
}

// 更新玩家显示
function updatePlayerDisplay() {
    document.getElementById('player1-display-id').textContent = gameState.players[1].id;
    document.getElementById('player2-display-id').textContent = gameState.players[2].id;
    updatePlayerStats(1);
    updatePlayerStats(2);
}

// 开始游戏循环
function startGameLoop() {
    generateQuestion(1);
    generateQuestion(2);
}

// 生成题目
function generateQuestion(playerNum) {
    const player = gameState.players[playerNum];
    
    // 随机选择分类
    const categories = ALL_CATEGORIES.filter(c => c !== '纯净物' && c !== '混合物');
    const category = categories[Math.floor(Math.random() * categories.length)];
    player.currentCategory = category;
    
    // 计算卡片数量（根据等级）
    const cardCount = GAME_CONFIG.INITIAL_CARDS + (player.level - 1) * GAME_CONFIG.CARDS_INCREMENT;
    
    // 获取物质
    const { correct, wrong } = getRandomChemicals(category, cardCount);
    
    // 合并并打乱
    const allCards = [...correct, ...wrong].sort(() => Math.random() - 0.5);
    player.cards = allCards;
    
    // 记录所有正确答案的索引（在打乱后的数组中）
    player.correctAnswers = [];
    allCards.forEach((card, index) => {
        if (card.category === category) {
            player.correctAnswers.push(index);
        }
    });
    player.selectedCorrect = [];
    
    // 更新显示
    updateCategoryDisplay(playerNum, category);
    renderCards(playerNum);
    
    // 重置选中状态
    player.selectedCard = null;
}

// 更新分类显示
function updateCategoryDisplay(playerNum, category) {
    const element = document.getElementById(`player${playerNum}-category`);
    element.textContent = category;
}

// 渲染卡片
function renderCards(playerNum) {
    const player = gameState.players[playerNum];
    const cardsArea = document.getElementById(`player${playerNum}-cards`);
    cardsArea.innerHTML = '';
    
    player.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'chemical-card';
        cardElement.textContent = card.name;
        cardElement.dataset.index = index;
        cardElement.dataset.player = playerNum;
        
        // 使用事件委托
        cardElement.addEventListener('click', handleCardClick);
        
        cardsArea.appendChild(cardElement);
    });
}

// 处理卡片点击
function handleCardClick(e) {
    if (gameState.isPaused) return;
    
    const cardElement = e.currentTarget;
    const playerNum = parseInt(cardElement.dataset.player);
    const index = parseInt(cardElement.dataset.index);
    const player = gameState.players[playerNum];
    
    // 如果该玩家被知识点弹窗阻塞，禁止操作
    if (player.isBlocked) return;
    
    // 防误触：检查是否在冷却期
    if (cardElement.classList.contains('cooldown')) return;
    
    // 如果点击的是已选中的卡片，取消选择
    if (player.selectedCard === index) {
        player.selectedCard = null;
        updateCardSelection(playerNum);
        return;
    }
    
    // 选中卡片
    player.selectedCard = index;
    updateCardSelection(playerNum);
    
    // 添加冷却期
    cardElement.classList.add('cooldown');
    setTimeout(() => {
        cardElement.classList.remove('cooldown');
    }, 300);
}

// 目标区域点击处理函数引用（用于移除事件监听器）
const targetClickHandlers = {
    1: null,
    2: null
};

// 更新卡片选中状态
function updateCardSelection(playerNum) {
    const player = gameState.players[playerNum];
    const cards = document.querySelectorAll(`#player${playerNum}-cards .chemical-card`);
    
    cards.forEach((card, index) => {
        if (index === player.selectedCard) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // 更新目标区域
    const targetArea = document.getElementById(`player${playerNum}-target`);
    
    // 移除旧的事件监听器
    if (targetClickHandlers[playerNum]) {
        targetArea.removeEventListener('click', targetClickHandlers[playerNum]);
        targetClickHandlers[playerNum] = null;
    }
    
    if (player.selectedCard !== null) {
        targetArea.classList.add('active');
        // 创建新的事件处理函数
        const handler = () => handleTargetClick(playerNum);
        targetClickHandlers[playerNum] = handler;
        targetArea.addEventListener('click', handler, { once: true });
    } else {
        targetArea.classList.remove('active');
    }
}

// 处理目标区域点击
function handleTargetClick(playerNum) {
    if (gameState.isPaused) return;
    
    const player = gameState.players[playerNum];
    
    // 如果该玩家被知识点弹窗阻塞，禁止操作
    if (player.isBlocked) return;
    
    if (player.selectedCard === null) return;
    
    const selectedCard = player.cards[player.selectedCard];
    
    // 判断是否正确：检查选中卡片的category是否等于当前分类
    const isCorrect = selectedCard.category === player.currentCategory;
    
    if (isCorrect) {
        handleCorrect(playerNum);
    } else {
        handleWrong(playerNum, selectedCard);
    }
}

// 处理正确答案
function handleCorrect(playerNum) {
    const player = gameState.players[playerNum];
    
    // 记录已选中的正确答案
    if (!player.selectedCorrect.includes(player.selectedCard)) {
        player.selectedCorrect.push(player.selectedCard);
    }
    
    // 更新统计
    player.correctCount++;
    player.combo++;
    player.errorStreak = 0;
    
    // 计算得分
    let scoreGain = GAME_CONFIG.CORRECT_SCORE;
    
    // 连击奖励：只加5分
    if (player.combo >= GAME_CONFIG.PERFECT_COMBO_THRESHOLD) {
        scoreGain += 5; // 完美连击也只加5分
        showFeedback(playerNum, `完美连击！+${scoreGain}分 +${GAME_CONFIG.CORRECT_REWARD}秒`, 'combo');
    } else if (player.combo >= GAME_CONFIG.COMBO_THRESHOLD) {
        scoreGain += 5; // 连击加5分
        showFeedback(playerNum, `连击x${player.combo}！+${scoreGain}分 +${GAME_CONFIG.CORRECT_REWARD}秒`, 'combo');
    } else {
        showFeedback(playerNum, `正确！+${scoreGain}分 +${GAME_CONFIG.CORRECT_REWARD}秒`, 'correct');
    }
    
    player.score += scoreGain;
    
    // 时间奖励：答对加时间
    player.time += GAME_CONFIG.CORRECT_REWARD;
    
    // 动画效果
    const cardElement = document.querySelector(`#player${playerNum}-cards .chemical-card.selected`);
    if (cardElement) {
        cardElement.classList.add('correct');
        
        // 移除已选中的正确答案卡片
        setTimeout(() => {
            cardElement.remove();
            // 从cards数组中移除已选中的卡片
            const removedIndex = player.selectedCard;
            player.cards = player.cards.filter((_, index) => index !== removedIndex);
            
            // 更新所有索引（移除的索引之后的索引都要减1）
            player.correctAnswers = player.correctAnswers
                .map(idx => idx > removedIndex ? idx - 1 : idx)
                .filter(idx => idx !== removedIndex);
            player.selectedCorrect = player.selectedCorrect
                .map(idx => idx > removedIndex ? idx - 1 : idx)
                .filter(idx => idx !== removedIndex);
            
            // 检查是否所有正确答案都已选中
            const allSelected = player.correctAnswers.length === 0;
            
            if (allSelected) {
                // 所有正确答案都已选中，进入下一题
                player.completedQuestions++;
                // 检查升级
                if (player.completedQuestions % GAME_CONFIG.LEVEL_UP_THRESHOLD === 0) {
                    player.level++;
                }
                generateQuestion(playerNum);
            } else {
                // 还有正确答案未选中，继续选择
                player.selectedCard = null;
                renderCards(playerNum);
                updateCardSelection(playerNum);
            }
        }, 600);
    }
    
    updatePlayerStats(playerNum);
    updateComparison();
}

// 处理错误答案
function handleWrong(playerNum, selectedCard) {
    const player = gameState.players[playerNum];
    
    // 更新统计
    player.wrongCount++;
    player.combo = 0;
    player.errorStreak++;
    
    // 扣分
    player.score += GAME_CONFIG.WRONG_SCORE;
    if (player.score < 0) player.score = 0;
    
    // 不直接减时间，显示知识点弹窗，禁止操作3秒
    showKnowledgeModal(selectedCard, playerNum);
    
    // 显示反馈
    const message = `错误！-${Math.abs(GAME_CONFIG.WRONG_SCORE)}分`;
    showFeedback(playerNum, message, 'wrong');
    
    // 动画效果
    const cardElement = document.querySelector(`#player${playerNum}-cards .chemical-card.selected`);
    if (cardElement) {
        cardElement.classList.add('wrong');
        setTimeout(() => {
            cardElement.classList.remove('wrong', 'selected');
            player.selectedCard = null;
            updateCardSelection(playerNum);
        }, 600);
    }
    
    updatePlayerStats(playerNum);
    updateComparison();
}

// 显示知识点弹窗（只阻塞出错的玩家）
function showKnowledgeModal(selectedCard, playerNum) {
    const player = gameState.players[playerNum];
    
    // 阻塞该玩家的操作
    player.isBlocked = true;
    
    // 在对应玩家区域显示知识点提示
    const playerArea = document.querySelector(`.player-area[data-player="${playerNum}"]`);
    const knowledgeModal = document.createElement('div');
    knowledgeModal.className = 'player-knowledge-modal';
    knowledgeModal.innerHTML = `
        <div class="player-knowledge-content">
            <div class="player-knowledge-header">知识点提示</div>
            <div class="player-knowledge-text">${selectedCard.name}（${selectedCard.fullName}）：${selectedCard.description}</div>
            <div class="player-knowledge-countdown">3</div>
        </div>
    `;
    playerArea.appendChild(knowledgeModal);
    
    // 倒计时
    let countdown = 3;
    const countdownElement = knowledgeModal.querySelector('.player-knowledge-countdown');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownElement.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            // 移除弹窗
            knowledgeModal.remove();
            // 解除阻塞
            player.isBlocked = false;
        }
    }, 1000);
}

// 显示反馈
function showFeedback(playerNum, message, type) {
    const feedbackArea = document.getElementById(`player${playerNum}-feedback`);
    feedbackArea.innerHTML = `<div class="feedback-message feedback-${type}">${message}</div>`;
    
    setTimeout(() => {
        feedbackArea.innerHTML = '';
    }, 2000);
}

// 更新玩家统计
function updatePlayerStats(playerNum) {
    const player = gameState.players[playerNum];
    
    document.getElementById(`player${playerNum}-score`).textContent = player.score;
    document.getElementById(`player${playerNum}-time`).textContent = Math.max(0, Math.ceil(player.time));
    document.getElementById(`player${playerNum}-progress`).textContent = player.completedQuestions;
}

// 更新对比显示
function updateComparison() {
    const player1 = gameState.players[1];
    const player2 = gameState.players[2];
    
    const maxScore = Math.max(player1.score, player2.score, 1);
    const player1Percent = (player1.score / maxScore) * 100;
    const player2Percent = (player2.score / maxScore) * 100;
    
    document.getElementById('player1-progress-bar').style.width = player1Percent + '%';
    document.getElementById('player2-progress-bar').style.width = player2Percent + '%';
}

// 开始计时器
function startTimer() {
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    
    gameState.gameTimer = setInterval(() => {
        if (gameState.isPaused) return;
        
        // 确保两边同时结束：检查两个玩家的时间都<=0
        let allTimeUp = true;
        
        for (let playerNum = 1; playerNum <= 2; playerNum++) {
            const player = gameState.players[playerNum];
            if (player.time > 0) {
                player.time -= 0.1;
                allTimeUp = false;
                updatePlayerStats(playerNum);
            } else {
                player.time = 0;
                updatePlayerStats(playerNum);
            }
        }
        
        // 只有当两个玩家的时间都<=0时才结束游戏
        if (allTimeUp && gameState.players[1].time <= 0 && gameState.players[2].time <= 0) {
            endGame();
        }
    }, 100);
}

// 暂停/继续
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    elements.pauseBtn.textContent = gameState.isPaused ? '继续' : '暂停';
    
    // 控制背景音乐
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        if (gameState.isPaused) {
            bgMusic.pause();
        } else {
            bgMusic.play().catch(e => {
                console.warn('无法播放背景音乐:', e);
            });
        }
    }
}

// 结束游戏
function endGame() {
    clearInterval(gameState.gameTimer);
    
    // 停止背景音乐
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
    
    // 计算正确率
    for (let playerNum = 1; playerNum <= 2; playerNum++) {
        const player = gameState.players[playerNum];
        const total = player.correctCount + player.wrongCount;
        player.accuracy = total > 0 ? (player.correctCount / total * 100).toFixed(1) : 0;
    }
    
    // 确定获胜者
    const player1 = gameState.players[1];
    const player2 = gameState.players[2];
    let winner = null;
    
    if (player1.score > player2.score) {
        winner = 1;
    } else if (player2.score > player1.score) {
        winner = 2;
    } else {
        // 平局，比较正确率
        if (player1.accuracy > player2.accuracy) {
            winner = 1;
        } else if (player2.accuracy > player1.accuracy) {
            winner = 2;
        }
    }
    
    // 显示结束界面
    showEndScreen(winner);
    
    // 保存到排行榜
    saveToLeaderboard(winner);
}

// 显示结束界面
function showEndScreen(winner) {
    const player1 = gameState.players[1];
    const player2 = gameState.players[2];
    
    // 重置获胜者显示
    document.getElementById('player1-result').classList.remove('winner');
    document.getElementById('player1-winner').classList.add('hidden');
    document.getElementById('player2-result').classList.remove('winner');
    document.getElementById('player2-winner').classList.add('hidden');
    
    // 更新玩家1结果
    document.getElementById('end-player1-id').textContent = player1.id;
    document.getElementById('end-player1-score').textContent = player1.score;
    document.getElementById('end-player1-accuracy').textContent = player1.accuracy + '%';
    document.getElementById('end-player1-completed').textContent = player1.completedQuestions;
    
    // 更新玩家2结果
    document.getElementById('end-player2-id').textContent = player2.id;
    document.getElementById('end-player2-score').textContent = player2.score;
    document.getElementById('end-player2-accuracy').textContent = player2.accuracy + '%';
    document.getElementById('end-player2-completed').textContent = player2.completedQuestions;
    
    // 显示获胜者
    if (winner === 1) {
        document.getElementById('player1-result').classList.add('winner');
        document.getElementById('player1-winner').classList.remove('hidden');
        document.getElementById('end-message').textContent = `🎉 ${player1.id} 获胜！`;
    } else if (winner === 2) {
        document.getElementById('player2-result').classList.add('winner');
        document.getElementById('player2-winner').classList.remove('hidden');
        document.getElementById('end-message').textContent = `🎉 ${player2.id} 获胜！`;
    } else {
        document.getElementById('end-message').textContent = '平局！';
    }
    
    showScreen(GameState.END);
}

// 保存到排行榜
function saveToLeaderboard(winner) {
    const player1 = gameState.players[1];
    const player2 = gameState.players[2];
    
    const record = {
        playerId: winner ? gameState.players[winner].id : player1.id,
        score: winner ? gameState.players[winner].score : player1.score,
        accuracy: winner ? gameState.players[winner].accuracy : player1.accuracy,
        opponentId: winner === 1 ? player2.id : player1.id,
        date: new Date().toLocaleString('zh-CN'),
        timestamp: Date.now()
    };
    
    leaderboard.push(record);
    
    // 按得分排序，保留前10名
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    // 保存到localStorage
    try {
        localStorage.setItem('chemicalGameLeaderboard', JSON.stringify(leaderboard));
    } catch (e) {
        console.warn('无法保存排行榜数据:', e);
    }
}

// 加载排行榜
function loadLeaderboard() {
    try {
        const data = localStorage.getItem('chemicalGameLeaderboard');
        if (data) {
            leaderboard = JSON.parse(data);
        }
    } catch (e) {
        console.warn('无法加载排行榜数据:', e);
        leaderboard = [];
    }
}

// 显示排行榜
function showLeaderboard() {
    const listElement = document.getElementById('leaderboard-list');
    listElement.innerHTML = '';
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<div style="text-align: center; padding: 40px; font-size: 24px; color: #999;">暂无记录</div>';
    } else {
        leaderboard.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item' + (index < 3 ? ' top3' : '');
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-id">${record.playerId}</div>
                <div class="leaderboard-score">${record.score}</div>
                <div class="leaderboard-accuracy">${record.accuracy}%</div>
                <div class="leaderboard-date">${record.date}</div>
            `;
            listElement.appendChild(item);
        });
    }
    
    showScreen(GameState.LEADERBOARD);
}

// 重置游戏
function resetGame() {
    clearInterval(gameState.gameTimer);
    
    // 停止背景音乐
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
    
    showScreen(GameState.START);
    generatePlayerIds();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

