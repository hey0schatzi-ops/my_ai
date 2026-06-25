/**
 * 머지 레스토랑 - Merge Cooking Game
 * 같은 재료를 합쳐서 요리를 완성하는 퍼즐 게임
 */

// ===== DOM 요소 =====
const gridEl = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const levelEl = document.getElementById('level');
const ordersEl = document.getElementById('orders');
const nextEl = document.getElementById('nextIngredient');
const recipeListEl = document.getElementById('recipeList');
const overlayEl = document.getElementById('overlay');
const gameOverMsgEl = document.getElementById('gameOverMsg');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restart');
const restartOverlayBtn = document.getElementById('restartOverlay');
const timerFillEl = document.getElementById('timerFill');

// ===== 게임 설정 =====
const GRID_COLS = 5;
const GRID_ROWS = 4;
const GRID_SIZE = GRID_COLS * GRID_ROWS;

// ===== 요리/재료 데이터 =====
// 레벨별 요리 정보 (이모지, 이름, 점수)
const ingredients = [
  // 기본 재료 (레벨 0-4)
  { emoji: '🥬', name: '양상추', score: 1, tier: '재료' },
  { emoji: '🍅', name: '토마토', score: 2, tier: '재료' },
  { emoji: '🧅', name: '양파', score: 3, tier: '재료' },
  { emoji: '🥕', name: '당근', score: 4, tier: '재료' },
  { emoji: '🧀', name: '치즈', score: 5, tier: '재료' },
  
  // 중간 재료 (레벨 5-9)
  { emoji: '🥗', name: '샐러드', score: 10, tier: '요리' },
  { emoji: '🍝', name: '파스타', score: 20, tier: '요리' },
  { emoji: '🥩', name: '스테이크', score: 30, tier: '요리' },
  { emoji: '🍞', name: '빵', score: 6, tier: '재료' },
  { emoji: '🥚', name: '달걀', score: 7, tier: '재료' },
  
  // 고급 요리 (레벨 10-14)
  { emoji: '🍔', name: '햄버거', score: 50, tier: '특선' },
  { emoji: '🌮', name: '타코', score: 60, tier: '특선' },
  { emoji: '🥪', name: '샌드위치', score: 40, tier: '요리' },
  { emoji: '🍕', name: '피자', score: 80, tier: '특선' },
  { emoji: '🍱', name: '도시락', score: 70, tier: '특선' },
  
  // 최고급 요리 (레벨 15+)
  { emoji: '🍣', name: '스시', score: 100, tier: '코스' },
  { emoji: '🥘', name: '스튜', score: 90, tier: '특선' },
  { emoji: '🍛', name: '카레라이스', score: 110, tier: '코스' },
  { emoji: '🍲', name: '샤브샤브', score: 120, tier: '코스' },
  { emoji: '🎂', name: '케이크', score: 200, tier: '디저트' },
];

// ===== 게임 상태 =====
let grid = [];           // 그리드 배열 (인덱스: 아이템 레벨 또는 null)
let score = 0;
let best = parseInt(localStorage.getItem('merge-restaurant-best') || '0');
let level = 1;
let selectedCell = null; // 선택된 셀 인덱스
let orders = [];         // 현재 주문 목록
let nextIngredient = 0;  // 다음에 나올 재료 레벨
let combo = 0;           // 연속 머지 콤보
let gameOver = false;
let orderTimer = null;
let orderSpawnTimer = null;

// ===== 초기화 =====
function init() {
  grid = new Array(GRID_SIZE).fill(null);
  score = 0;
  level = 1;
  selectedCell = null;
  orders = [];
  combo = 0;
  gameOver = false;
  
  // 초기 재료 배치 (3개)
  for (let i = 0; i < 3; i++) {
    placeRandomIngredient();
  }
  
  // 다음 재료 설정
  nextIngredient = getRandomIngredientLevel();
  
  // 주문 생성
  generateOrder();
  generateOrder();
  
  // UI 업데이트
  updateScore();
  updateLevel();
  renderGrid();
  renderNextIngredient();
  renderOrders();
  renderRecipes();
  
  // 오버레이 숨기기
  overlayEl.classList.add('hidden');
  
  // 주문 타이머 시작
  startOrderTimer();
}

// ===== 유틸리티 =====
function getRandomIngredientLevel() {
  // 레벨 1~4의 기본 재료 중 랜덤 (레벨에 따라 높은 재료 확률 증가)
  const maxLevel = Math.min(4, 1 + Math.floor(level / 3));
  return Math.floor(Math.random() * maxLevel);
}

function placeRandomIngredient() {
  const emptyCells = [];
  grid.forEach((cell, idx) => {
    if (cell === null) emptyCells.push(idx);
  });
  
  if (emptyCells.length === 0) return false;
  
  const randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[randomIdx] = getRandomIngredientLevel();
  return true;
}

// ===== 렌더링 =====
function renderGrid() {
  gridEl.innerHTML = '';
  
  grid.forEach((itemLevel, idx) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = idx;
    
    if (itemLevel !== null) {
      const ingredient = ingredients[itemLevel];
      
      const emoji = document.createElement('span');
      emoji.className = 'cell-emoji';
      emoji.textContent = ingredient.emoji;
      cell.appendChild(emoji);
      
      const levelBadge = document.createElement('span');
      levelBadge.className = 'cell-level';
      levelBadge.textContent = `Lv.${itemLevel + 1}`;
      cell.appendChild(levelBadge);
    }
    
    // 선택 상태
    if (selectedCell === idx) {
      cell.classList.add('selected');
    }
    
    // 클릭 이벤트
    cell.addEventListener('click', () => handleCellClick(idx));
    
    // 드래그 이벤트
    cell.draggable = itemLevel !== null;
    cell.addEventListener('dragstart', (e) => handleDragStart(e, idx));
    cell.addEventListener('dragover', (e) => e.preventDefault());
    cell.addEventListener('drop', (e) => handleDrop(e, idx));
    
    gridEl.appendChild(cell);
  });
  
  // 합치기 가능한 셀 하이라이트
  highlightMergeable();
}

function highlightMergeable() {
  if (selectedCell === null || grid[selectedCell] === null) return;
  
  const selectedLevel = grid[selectedCell];
  const cells = gridEl.querySelectorAll('.cell');
  
  cells.forEach((cell, idx) => {
    if (idx === selectedCell) return;
    
    // 같은 레벨이거나 빈칸이면 하이라이트
    if (grid[idx] === selectedLevel || grid[idx] === null) {
      cell.classList.add('hint');
    }
  });
}

function renderNextIngredient() {
  const ingredient = ingredients[nextIngredient];
  nextEl.innerHTML = `
    <span class="next-emoji">${ingredient.emoji}</span>
    <span class="next-name">${ingredient.name}</span>
  `;
  
  // 드래그 가능하게
  nextEl.draggable = true;
  nextEl.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'next');
    e.dataTransfer.effectAllowed = 'move';
  });
  
  // 클릭으로 배치
  nextEl.onclick = () => placeNextIngredient();
}

function renderOrders() {
  ordersEl.innerHTML = '';
  
  orders.forEach((order, idx) => {
    const ingredient = ingredients[order.targetLevel];
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <span class="order-emoji">${ingredient.emoji}</span>
      <span class="order-name">${ingredient.name}</span>
      <span class="order-reward">+${order.reward}점</span>
    `;
    ordersEl.appendChild(card);
  });
  
  // 주문이 없으면 메시지
  if (orders.length === 0) {
    ordersEl.innerHTML = '<p style="color: var(--muted); text-align: center; font-size: 0.8rem;">주문 대기 중...</p>';
  }
}

function renderRecipes() {
  recipeListEl.innerHTML = '';
  
  // 첫 10개 레시피만 표시
  for (let i = 0; i < Math.min(10, ingredients.length - 1); i++) {
    const from = ingredients[i];
    const to = ingredients[i + 1];
    
    const item = document.createElement('div');
    item.className = 'recipe-item';
    item.innerHTML = `
      <span class="recipe-emoji">${from.emoji}</span>
      <span class="recipe-arrow">+</span>
      <span class="recipe-emoji">${from.emoji}</span>
      <span class="recipe-arrow">→</span>
      <span class="recipe-emoji">${to.emoji}</span>
    `;
    recipeListEl.appendChild(item);
  }
}

function updateScore() {
  scoreEl.textContent = score;
  best = Math.max(best, score);
  bestEl.textContent = best;
  localStorage.setItem('merge-restaurant-best', best.toString());
}

function updateLevel() {
  levelEl.textContent = level;
}

// ===== 게임 로직 =====
function handleCellClick(idx) {
  if (gameOver) return;
  
  if (selectedCell === null) {
    // 첫 선택
    if (grid[idx] !== null) {
      selectedCell = idx;
      renderGrid();
    }
  } else if (selectedCell === idx) {
    // 같은 셀 클릭 - 선택 해제
    selectedCell = null;
    renderGrid();
  } else {
    // 두 번째 선택
    const fromLevel = grid[selectedCell];
    const toLevel = grid[idx];
    
    if (fromLevel === null) {
      // 빈 셀에서 시작 - 선택만 변경
      if (toLevel !== null) {
        selectedCell = idx;
        renderGrid();
      }
    } else if (toLevel === null) {
      // 빈 칸으로 이동
      moveItem(selectedCell, idx);
    } else if (fromLevel === toLevel && fromLevel < ingredients.length - 1) {
      // 같은 레벨 아이템 머지
      mergeItems(selectedCell, idx);
    } else {
      // 다른 레벨 - 선택 변경
      selectedCell = idx;
      renderGrid();
    }
  }
}

function moveItem(fromIdx, toIdx) {
  grid[toIdx] = grid[fromIdx];
  grid[fromIdx] = null;
  selectedCell = null;
  
  // 새 위치에 애니메이션
  renderGrid();
  const cells = gridEl.querySelectorAll('.cell');
  cells[toIdx].classList.add('new-item');
  
  // 머지 체크 (인접한 같은 레벨)
  setTimeout(() => checkAutoMerge(toIdx), 100);
}

function mergeItems(fromIdx, toIdx) {
  const newLevel = grid[fromIdx] + 1;
  
  grid[fromIdx] = null;
  grid[toIdx] = newLevel;
  selectedCell = null;
  
  // 점수 추가
  const points = ingredients[newLevel].score;
  score += points;
  combo++;
  
  // 콤보 보너스
  if (combo > 1) {
    const comboBonus = combo * 5;
    score += comboBonus;
    showComboPopup(combo);
  }
  
  updateScore();
  checkLevelUp();
  
  // 머지 애니메이션
  renderGrid();
  const cells = gridEl.querySelectorAll('.cell');
  cells[toIdx].classList.add('merging');
  
  // 떠다니는 점수 표시
  showFloatingScore(cells[toIdx], points);
  
  // 주문 완료 체크
  checkOrders(newLevel, toIdx);
  
  // 새 재료 생성
  setTimeout(() => {
    placeRandomIngredient();
    renderGrid();
    checkGameOver();
  }, 300);
}

function checkAutoMerge(idx) {
  if (grid[idx] === null) return;
  
  const level = grid[idx];
  const row = Math.floor(idx / GRID_COLS);
  const col = idx % GRID_COLS;
  
  // 인접 셀 체크
  const neighbors = [];
  if (row > 0) neighbors.push(idx - GRID_COLS); // 위
  if (row < GRID_ROWS - 1) neighbors.push(idx + GRID_COLS); // 아래
  if (col > 0) neighbors.push(idx - 1); // 왼쪽
  if (col < GRID_COLS - 1) neighbors.push(idx + 1); // 오른쪽
  
  for (const nIdx of neighbors) {
    if (grid[nIdx] === level && level < ingredients.length - 1) {
      mergeItems(idx, nIdx);
      return;
    }
  }
}

function checkOrders(completedLevel, cellIdx) {
  const completedOrders = [];
  
  orders.forEach((order, idx) => {
    if (order.targetLevel === completedLevel) {
      // 주문 완료!
      score += order.reward;
      completedOrders.push(idx);
      
      // 완료 애니메이션
      const cells = gridEl.querySelectorAll('.cell');
      if (cells[cellIdx]) {
        showFloatingScore(cells[cellIdx], order.reward, true);
      }
    }
  });
  
  // 완료된 주문 제거 (역순으로)
  completedOrders.sort((a, b) => b - a).forEach(idx => {
    orders.splice(idx, 1);
  });
  
  if (completedOrders.length > 0) {
    updateScore();
    renderOrders();
    
    // 새 주문 생성
    setTimeout(() => generateOrder(), 1000);
  }
}

function generateOrder() {
  if (orders.length >= 3) return; // 최대 3개 주문
  
  // 현재 레벨에 맞는 목표 설정
  const maxTarget = Math.min(ingredients.length - 1, level + 5);
  const minTarget = Math.max(0, level - 2);
  const targetLevel = minTarget + Math.floor(Math.random() * (maxTarget - minTarget + 1));
  
  const ingredient = ingredients[targetLevel];
  const reward = ingredient.score * 3; // 주문 보너스
  
  orders.push({
    targetLevel,
    reward,
    timeLeft: 60 // 60초
  });
  
  renderOrders();
}

function startOrderTimer() {
  if (orderTimer) clearInterval(orderTimer);
  
  orderTimer = setInterval(() => {
    if (gameOver) return;
    
    let hasExpired = false;
    
    orders.forEach(order => {
      order.timeLeft--;
      if (order.timeLeft <= 0) {
        hasExpired = true;
      }
    });
    
    // 만료된 주문 제거
    const prevLength = orders.length;
    orders = orders.filter(o => o.timeLeft > 0);
    
    if (orders.length < prevLength) {
      // 주문 실패 시 콤보 리셋
      combo = 0;
      renderOrders();
    }
    
    // 타이머 바 업데이트
    if (orders.length > 0) {
      const maxTime = 60;
      const minTime = Math.min(...orders.map(o => o.timeLeft));
      const pct = (minTime / maxTime) * 100;
      timerFillEl.style.width = pct + '%';
      
      // 위험 상태
      if (pct < 30) {
        timerFillEl.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
      } else {
        timerFillEl.style.background = 'linear-gradient(90deg, var(--accent) 0%, #ffab76 100%)';
      }
    }
    
    // 새 주문 생성 (일정 주기마다)
    if (orders.length < 2) {
      generateOrder();
    }
    
    renderOrders();
  }, 1000);
}

function placeNextIngredient() {
  if (gameOver) return;
  
  const emptyCells = [];
  grid.forEach((cell, idx) => {
    if (cell === null) emptyCells.push(idx);
  });
  
  if (emptyCells.length === 0) {
    checkGameOver();
    return;
  }
  
  // 랜덤 빈 셀에 배치
  const targetIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[targetIdx] = nextIngredient;
  
  // 새 재료 설정
  nextIngredient = getRandomIngredientLevel();
  
  // 콤보 리셋 (새 재료 배치 시)
  combo = 0;
  
  renderGrid();
  renderNextIngredient();
  
  const cells = gridEl.querySelectorAll('.cell');
  cells[targetIdx].classList.add('new-item');
  
  // 배치 후 자동 머지 체크
  setTimeout(() => checkAutoMerge(targetIdx), 100);
  
  setTimeout(() => checkGameOver(), 200);
}

// ===== 드래그 앤 드롭 =====
let dragFromIdx = null;

function handleDragStart(e, idx) {
  dragFromIdx = idx;
  e.dataTransfer.setData('text/plain', idx.toString());
  e.dataTransfer.effectAllowed = 'move';
}

function handleDrop(e, toIdx) {
  e.preventDefault();
  
  const data = e.dataTransfer.getData('text/plain');
  
  if (data === 'next') {
    // 다음 재료를 특정 위치에 배치
    if (grid[toIdx] === null && !gameOver) {
      grid[toIdx] = nextIngredient;
      nextIngredient = getRandomIngredientLevel();
      combo = 0;
      renderGrid();
      renderNextIngredient();
      
      const cells = gridEl.querySelectorAll('.cell');
      cells[toIdx].classList.add('new-item');
      
      setTimeout(() => checkAutoMerge(toIdx), 100);
      setTimeout(() => checkGameOver(), 200);
    }
    return;
  }
  
  const fromIdx = parseInt(data);
  if (isNaN(fromIdx)) return;
  
  const fromLevel = grid[fromIdx];
  const toLevel = grid[toIdx];
  
  if (fromLevel === null) return;
  
  if (toLevel === null) {
    // 빈 칸으로 이동
    moveItem(fromIdx, toIdx);
  } else if (fromLevel === toLevel && fromLevel < ingredients.length - 1) {
    // 머지
    mergeItems(fromIdx, toIdx);
  }
}

// ===== 게임 상태 =====
function checkLevelUp() {
  // 점수에 따라 레벨업
  const newLevel = Math.floor(score / 200) + 1;
  if (newLevel > level) {
    level = newLevel;
    updateLevel();
    showComboPopup(0, `레벨 ${level}!`);
  }
}

function checkGameOver() {
  const emptyCells = grid.filter(cell => cell === null).length;
  
  if (emptyCells === 0) {
    // 이동 가능한 머지가 있는지 체크
    let canMerge = false;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      if (grid[i] === null) continue;
      
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      
      // 인접 셀 체크
      const neighbors = [];
      if (row > 0) neighbors.push(i - GRID_COLS);
      if (row < GRID_ROWS - 1) neighbors.push(i + GRID_COLS);
      if (col > 0) neighbors.push(i - 1);
      if (col < GRID_COLS - 1) neighbors.push(i + 1);
      
      for (const nIdx of neighbors) {
        if (grid[nIdx] === grid[i] && grid[i] < ingredients.length - 1) {
          canMerge = true;
          break;
        }
      }
      if (canMerge) break;
    }
    
    if (!canMerge) {
      gameOver = true;
      clearInterval(orderTimer);
      showGameOver();
    }
  }
}

function showGameOver() {
  gameOverMsgEl.textContent = `레벨 ${level}에 도달했어요!`;
  finalScoreEl.textContent = score;
  overlayEl.classList.remove('hidden');
}

// ===== 시각 효과 =====
function showFloatingScore(element, points, isOrder = false) {
  const rect = element.getBoundingClientRect();
  
  const popup = document.createElement('div');
  popup.className = 'float-score';
  popup.textContent = (isOrder ? '🎉 ' : '+') + points;
  
  if (isOrder) {
    popup.style.color = 'var(--accent-green)';
    popup.style.fontSize = '1.5rem';
  }
  
  popup.style.left = rect.left + rect.width / 2 + 'px';
  popup.style.top = rect.top + 'px';
  
  document.body.appendChild(popup);
  
  setTimeout(() => popup.remove(), 1000);
}

function showComboPopup(comboCount, customText = null) {
  const popup = document.createElement('div');
  popup.className = 'combo-popup';
  popup.textContent = customText || `🔥 ${comboCount} COMBO!`;
  
  document.body.appendChild(popup);
  
  setTimeout(() => popup.remove(), 1000);
}

// ===== 이벤트 리스너 =====
restartBtn.addEventListener('click', init);
restartOverlayBtn.addEventListener('click', init);

// 키보드 단축키
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    init();
  }
  if (e.key === ' ') {
    e.preventDefault();
    placeNextIngredient();
  }
});

// 게임 시작
init();