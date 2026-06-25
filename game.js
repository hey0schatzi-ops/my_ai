/**
 * 머지 레스토랑 - Merge Cooking Game (v2.0)
 * 생성기, 조리대, 손님 주문 시스템 추가
 */

// ===== DOM 요소 =====
const gridEl = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const levelEl = document.getElementById('level');
const goldEl = document.getElementById('gold');
const ordersEl = document.getElementById('orders');
const generatorsEl = document.getElementById('generators');
const recipeListEl = document.getElementById('recipeList');
const overlayEl = document.getElementById('overlay');
const gameOverMsgEl = document.getElementById('gameOverMsg');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restart');
const restartOverlayBtn = document.getElementById('restartOverlay');
const timerFillEl = document.getElementById('timerFill');
const cookBtn = document.getElementById('cookBtn');
const cookingSlots = document.querySelectorAll('.cooking-slot');

// ===== 게임 설정 =====
const GRID_COLS = 5;
const GRID_ROWS = 4;
const GRID_SIZE = GRID_COLS * GRID_ROWS;
const COOKING_SLOTS_COUNT = 3;

// ===== 생성기 데이터 =====
const generators = [
  { id: 'veggie', emoji: '🧺', name: '채소', cost: 5, items: ['lettuce', 'tomato', 'onion', 'carrot', 'potato'] },
  { id: 'fruit', emoji: '🍎', name: '과일', cost: 8, items: ['apple', 'grape', 'orange', 'watermelon'] },
  { id: 'meat', emoji: '🥩', name: '고기', cost: 15, items: ['chicken', 'beef', 'pork'] },
  { id: 'dairy', emoji: '🧈', name: '유제품', cost: 10, items: ['milk', 'cheese', 'butter', 'egg'] },
  { id: 'bakery', emoji: '🍞', name: '빵', cost: 7, items: ['bread', 'rice', 'flour'] },
];

// ===== 재료 데이터 =====
const ingredients = {
  // 채소
  lettuce: { emoji: '🥬', name: '양상추', category: 'veggie', tier: 1 },
  tomato: { emoji: '🍅', name: '토마토', category: 'veggie', tier: 1 },
  onion: { emoji: '🧅', name: '양파', category: 'veggie', tier: 1 },
  carrot: { emoji: '🥕', name: '당근', category: 'veggie', tier: 1 },
  
  // 과일
  apple: { emoji: '🍎', name: '사과', category: 'fruit', tier: 1 },
  grape: { emoji: '🍇', name: '포도', category: 'fruit', tier: 1 },
  orange: { emoji: '🍊', name: '귤', category: 'fruit', tier: 1 },
  watermelon: { emoji: '🍉', name: '수박', category: 'fruit', tier: 2 },
  
  // 고기
  chicken: { emoji: '🍗', name: '닭고기', category: 'meat', tier: 1 },
  beef: { emoji: '🥩', name: '소고기', category: 'meat', tier: 2 },
  pork: { emoji: '🥓', name: '돼지고기', category: 'meat', tier: 1 },
  
  // 유제품
  milk: { emoji: '🥛', name: '우유', category: 'dairy', tier: 1 },
  cheese: { emoji: '🧀', name: '치즈', category: 'dairy', tier: 1 },
  butter: { emoji: '🧈', name: '버터', category: 'dairy', tier: 1 },
  
  // 빵/곡물
  bread: { emoji: '🍞', name: '빵', category: 'bakery', tier: 1 },
  rice: { emoji: '🍚', name: '쌀', category: 'bakery', tier: 1 },
  flour: { emoji: '🌾', name: '밀', category: 'bakery', tier: 1 },
  
  // 기타
  potato: { emoji: '🥔', name: '감자', category: 'veggie', tier: 1 },
  egg: { emoji: '🥚', name: '달걀', category: 'dairy', tier: 1 },
};

// ===== 요리 레시피 =====
// 재료 조합 → 요리 (순서 무관)
const recipes = [
  // 간단한 요리
  { ingredients: ['lettuce', 'tomato'], result: 'salad', resultEmoji: '🥗', resultName: '샐러드', score: 20, gold: 15 },
  { ingredients: ['tomato', 'onion'], result: 'sauce', resultEmoji: '🍝', resultName: '토마토소스', score: 25, gold: 18 },
  { ingredients: ['lettuce', 'cheese'], result: 'cheeseSalad', resultEmoji: '🥗', resultName: '치즈샐러드', score: 30, gold: 22 },
  { ingredients: ['bread', 'cheese'], result: 'cheeseToast', resultEmoji: '🧀', resultName: '치즈토스트', score: 28, gold: 20 },
  { ingredients: ['bread', 'butter'], result: 'butterToast', resultEmoji: '🍞', resultName: '버터토스트', score: 22, gold: 16 },
  { ingredients: ['apple', 'grape'], result: 'fruitSalad', resultEmoji: '🍓', resultName: '과일샐러드', score: 35, gold: 25 },
  { ingredients: ['orange', 'watermelon'], result: 'fruitPlatter', resultEmoji: '🍹', resultName: '과일플래터', score: 45, gold: 35 },
  { ingredients: ['milk', 'flour'], result: 'dough', resultEmoji: '🫓', resultName: '반죽', score: 15, gold: 12 },
  { ingredients: ['rice', 'chicken'], result: 'chickenRice', resultEmoji: '🍛', resultName: '닭고기밥', score: 40, gold: 30 },
  
  // 중간 요리
  { ingredients: ['bread', 'chicken', 'lettuce'], result: 'chickenSandwich', resultEmoji: '🥪', resultName: '닭고기샌드위치', score: 60, gold: 45 },
  { ingredients: ['bread', 'beef', 'cheese'], result: 'burger', resultEmoji: '🍔', resultName: '햄버거', score: 80, gold: 60 },
  { ingredients: ['bread', 'pork', 'cheese'], result: 'porkSandwich', resultEmoji: '🥪', resultName: '돼지고기샌드위치', score: 65, gold: 50 },
  { ingredients: ['tomato', 'cheese', 'flour'], result: 'pizza', resultEmoji: '🍕', resultName: '피자', score: 90, gold: 70 },
  { ingredients: ['flour', 'butter', 'milk'], result: 'cake', resultEmoji: '🎂', resultName: '케이크', score: 100, gold: 80 },
  { ingredients: ['rice', 'beef', 'carrot'], result: 'beefBowl', resultEmoji: '🥘', resultName: '소고기덮밥', score: 75, gold: 55 },
  { ingredients: ['chicken', 'onion', 'carrot'], result: 'chickenStew', resultEmoji: '🍲', resultName: '닭고기스튜', score: 70, gold: 52 },
  
  // 고급 요리
  { ingredients: ['beef', 'potato', 'onion'], result: 'beefStew', resultEmoji: '🥘', resultName: '소고기스튜', score: 120, gold: 90 },
  { ingredients: ['watermelon', 'grape', 'apple'], result: 'fruitBasket', resultEmoji: '🧺', resultName: '과일바구니', score: 150, gold: 120 },
  { ingredients: ['bread', 'beef', 'cheese', 'lettuce'], result: 'deluxeBurger', resultEmoji: '🍔', resultName: '디럭스햄버거', score: 180, gold: 140 },
  { ingredients: ['flour', 'butter', 'milk', 'cheese'], result: 'cheeseCake', resultEmoji: '🍰', resultName: '치즈케이크', score: 200, gold: 160 },
];

// ===== 손님 이름 =====
const customerNames = ['김철수', '이영희', '박민수', '정수진', '홍길동', '최유리', '장현우', '강민지', '윤서준', '임하늘'];

// ===== 게임 상태 =====
let grid = [];
let score = 0;
let best = parseInt(localStorage.getItem('merge-restaurant-best-v2') || '0');
let level = 1;
let gold = 100;
let selectedCell = null;
let orders = [];
let cookingSlotsItems = [null, null, null];
let combo = 0;
let gameOver = false;
let orderTimer = null;
let customersServed = 0;

// ===== 초기화 =====
function init() {
  grid = new Array(GRID_SIZE).fill(null);
  score = 0;
  level = 1;
  gold = 100;
  selectedCell = null;
  orders = [];
  cookingSlotsItems = [null, null, null];
  combo = 0;
  gameOver = false;
  customersServed = 0;
  
  // 초기 재료 2개 배치 (무료)
  placeRandomIngredient();
  placeRandomIngredient();
  
  // 초기 주문 생성
  generateOrder();
  
  // UI 업데이트
  updateScore();
  updateLevel();
  updateGold();
  renderGrid();
  renderGenerators();
  renderCookingSlots();
  renderOrders();
  renderRecipes();
  
  overlayEl.classList.add('hidden');
  
  startOrderTimer();
}

// ===== 유틸리티 =====
function placeRandomIngredient() {
  const emptyCells = [];
  grid.forEach((cell, idx) => {
    if (cell === null) emptyCells.push(idx);
  });
  
  if (emptyCells.length === 0) return false;
  
  const randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const randomGenerator = generators[Math.floor(Math.random() * generators.length)];
  const randomItem = randomGenerator.items[Math.floor(Math.random() * randomGenerator.items.length)];
  
  grid[randomIdx] = randomItem;
  return true;
}

// ===== 렌더링 =====
function renderGrid() {
  gridEl.innerHTML = '';
  
  grid.forEach((itemId, idx) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = idx;
    
    if (itemId !== null) {
      const ingredient = ingredients[itemId];
      
      const emoji = document.createElement('span');
      emoji.className = 'cell-emoji';
      emoji.textContent = ingredient.emoji;
      cell.appendChild(emoji);
    }
    
    if (selectedCell === idx) {
      cell.classList.add('selected');
    }
    
    cell.addEventListener('click', () => handleCellClick(idx));
    
    gridEl.appendChild(cell);
  });
}

function renderGenerators() {
  generatorsEl.innerHTML = '';
  
  generators.forEach(gen => {
    const el = document.createElement('div');
    el.className = 'generator';
    if (gold < gen.cost) el.classList.add('disabled');
    
    el.innerHTML = `
      <span class="generator-emoji">${gen.emoji}</span>
      <span class="generator-name">${gen.name}</span>
      <span class="generator-cost">💰${gen.cost}</span>
    `;
    
    el.addEventListener('click', () => buyFromGenerator(gen));
    generatorsEl.appendChild(el);
  });
}

function renderCookingSlots() {
  cookingSlots.forEach((slot, idx) => {
    const itemId = cookingSlotsItems[idx];
    if (itemId) {
      slot.textContent = ingredients[itemId].emoji;
      slot.classList.add('filled');
    } else {
      slot.textContent = '';
      slot.classList.remove('filled');
    }
  });
  
  // 요리 버튼 활성화 체크
  const canCook = checkCookingRecipe();
  cookBtn.disabled = !canCook;
}

function renderOrders() {
  ordersEl.innerHTML = '';
  
  orders.forEach((order, idx) => {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    // 주문 요리를 만들 수 있는지 체크
    const canServe = canServeOrder(order);
    if (canServe) card.classList.add('can-serve');
    
    card.innerHTML = `
      <span class="order-emoji">${order.emoji}</span>
      <span class="order-name">${order.name}</span>
      <span class="order-reward">💰${order.reward} +${order.score}점</span>
      <span class="order-customer">${order.customer}</span>
    `;
    
    if (canServe) {
      card.addEventListener('click', () => serveOrder(idx));
    }
    
    ordersEl.appendChild(card);
  });
  
  if (orders.length === 0) {
    ordersEl.innerHTML = '<p style="color: var(--muted); text-align: center; font-size: 0.8rem;">손님 대기 중...</p>';
  }
}

function renderRecipes() {
  recipeListEl.innerHTML = '';
  
  recipes.forEach(recipe => {
    const item = document.createElement('div');
    item.className = 'recipe-item';
    
    const ingredientEmojis = recipe.ingredients.map(id => ingredients[id].emoji).join(' + ');
    
    item.innerHTML = `
      <span>${ingredientEmojis}</span>
      <span class="recipe-arrow">→</span>
      <span class="recipe-emoji">${recipe.resultEmoji}</span>
      <span class="recipe-name">${recipe.resultName}</span>
    `;
    
    recipeListEl.appendChild(item);
  });
}

function updateScore() {
  scoreEl.textContent = score;
  best = Math.max(best, score);
  bestEl.textContent = best;
  localStorage.setItem('merge-restaurant-best-v2', best.toString());
}

function updateLevel() {
  levelEl.textContent = level;
}

function updateGold() {
  goldEl.textContent = gold;
  renderGenerators();
}

// ===== 생성기 =====
function buyFromGenerator(generator) {
  if (gameOver) return;
  if (gold < generator.cost) return;
  
  const emptyCells = [];
  grid.forEach((cell, idx) => {
    if (cell === null) emptyCells.push(idx);
  });
  
  if (emptyCells.length === 0) {
    alert('그리드가 가득 찼습니다!');
    return;
  }
  
  gold -= generator.cost;
  updateGold();
  
  const randomItem = generator.items[Math.floor(Math.random() * generator.items.length)];
  const targetIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[targetIdx] = randomItem;
  
  renderGrid();
  
  const cells = gridEl.querySelectorAll('.cell');
  cells[targetIdx].classList.add('new-item');
  
  showFloatingScore(cells[targetIdx], `-${generator.cost}💰`, true);
}

// ===== 그리드 조작 =====
function handleCellClick(idx) {
  if (gameOver) return;
  
  const itemId = grid[idx];
  
  if (selectedCell === null) {
    if (itemId !== null) {
      selectedCell = idx;
      renderGrid();
    }
  } else if (selectedCell === idx) {
    selectedCell = null;
    renderGrid();
  } else {
    const selectedItemId = grid[selectedCell];
    
    if (selectedItemId === null) {
      if (itemId !== null) {
        selectedCell = idx;
        renderGrid();
      }
    } else if (itemId === null) {
      // 빈 칸으로 이동
      moveItem(selectedCell, idx);
    } else if (selectedItemId === itemId) {
      // 같은 재료 머지
      mergeItems(selectedCell, idx);
    } else {
      // 다른 재료 - 선택 변경
      selectedCell = idx;
      renderGrid();
    }
  }
}

function moveItem(fromIdx, toIdx) {
  grid[toIdx] = grid[fromIdx];
  grid[fromIdx] = null;
  selectedCell = null;
  
  renderGrid();
  const cells = gridEl.querySelectorAll('.cell');
  cells[toIdx].classList.add('new-item');
}

function mergeItems(fromIdx, toIdx) {
  const itemId = grid[fromIdx];
  const ingredient = ingredients[itemId];
  
  // 같은 카테고리이고 tier가 같으면 머지
  // 간단하게: 같은 재료면 상위 티어로 업그레이드
  grid[fromIdx] = null;
  grid[toIdx] = itemId; // 같은 재료 유지 (티어 업그레이드는 추후)
  selectedCell = null;
  
  // 점수 추가
  const points = ingredient.tier * 5;
  score += points;
  combo++;
  
  if (combo > 1) {
    const comboBonus = combo * 3;
    score += comboBonus;
    showComboPopup(combo);
  }
  
  updateScore();
  checkLevelUp();
  
  renderGrid();
  const cells = gridEl.querySelectorAll('.cell');
  cells[toIdx].classList.add('merging');
  
  showFloatingScore(cells[toIdx], `+${points}`);
  
  setTimeout(() => checkGameOver(), 200);
}

// ===== 조리대 =====
function addToCookingSlot(itemId) {
  const emptySlotIdx = cookingSlotsItems.indexOf(null);
  if (emptySlotIdx === -1) return false;
  
  cookingSlotsItems[emptySlotIdx] = itemId;
  renderCookingSlots();
  return true;
}

function removeFromCookingSlot(idx) {
  if (cookingSlotsItems[idx] === null) return;
  
  const itemId = cookingSlotsItems[idx];
  cookingSlotsItems[idx] = null;
  
  // 그리드에 다시 배치
  const emptyCells = [];
  grid.forEach((cell, i) => {
    if (cell === null) emptyCells.push(i);
  });
  
  if (emptyCells.length > 0) {
    const targetIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[targetIdx] = itemId;
    renderGrid();
  }
  
  renderCookingSlots();
}

function checkCookingRecipe() {
  const items = cookingSlotsItems.filter(i => i !== null);
  if (items.length < 2) return null;
  
  for (const recipe of recipes) {
    const recipeIngredients = [...recipe.ingredients].sort();
    const slotIngredients = [...items].sort();
    
    if (recipeIngredients.length === slotIngredients.length &&
        recipeIngredients.every((ing, idx) => ing === slotIngredients[idx])) {
      return recipe;
    }
  }
  
  return null;
}

function cook() {
  if (gameOver) return;
  
  const recipe = checkCookingRecipe();
  if (!recipe) return;
  
  // 요리 완성!
  score += recipe.score;
  gold += recipe.gold;
  
  updateScore();
  updateGold();
  checkLevelUp();
  
  // 조리대 비우기
  cookingSlotsItems = [null, null, null];
  renderCookingSlots();
  
  showComboPopup(0, `🍳 ${recipe.resultName} 완성!`);
  
  // 주문 체크
  checkOrdersForDish(recipe.result);
}

// 조리대 슬롯 클릭 이벤트
cookingSlots.forEach((slot, idx) => {
  slot.addEventListener('click', () => {
    if (cookingSlotsItems[idx] !== null) {
      removeFromCookingSlot(idx);
    } else if (selectedCell !== null && grid[selectedCell] !== null) {
      // 선택된 재료를 조리대로
      const itemId = grid[selectedCell];
      if (addToCookingSlot(itemId)) {
        grid[selectedCell] = null;
        selectedCell = null;
        renderGrid();
        renderCookingSlots();
      }
    }
  });
});

cookBtn.addEventListener('click', cook);

// ===== 주문 시스템 =====
function generateOrder() {
  if (orders.length >= 3) return;
  
  // 가능한 요리 중 랜덤 선택
  const availableRecipes = recipes.filter(r => {
    // 플레이어 레벨에 맞는 요리만
    const totalTier = r.ingredients.reduce((sum, id) => sum + ingredients[id].tier, 0);
    return totalTier <= level + 2;
  });
  
  if (availableRecipes.length === 0) return;
  
  const recipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
  const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
  
  orders.push({
    dishId: recipe.result,
    emoji: recipe.resultEmoji,
    name: recipe.resultName,
    reward: recipe.gold + 10,
    score: recipe.score,
    customer: customer,
    timeLeft: 90
  });
  
  renderOrders();
}

function canServeOrder(order) {
  // 그리드에 주문 요리를 만들 재료가 있는지 체크 (간단 버전)
  // 실제로는 조리대에서 요리를 만들어야 함
  return false; // 조리대에서 요리해야 하므로 항상 false
}

function serveOrder(idx) {
  // 이 함수는 이제 사용 안 함 (조리대 시스템 사용)
}

function checkOrdersForDish(dishId) {
  const completedOrders = [];
  
  orders.forEach((order, idx) => {
    if (order.dishId === dishId) {
      // 주문 완료!
      score += order.score;
      gold += order.reward;
      completedOrders.push(idx);
      customersServed++;
    }
  });
  
  completedOrders.sort((a, b) => b - a).forEach(idx => {
    orders.splice(idx, 1);
  });
  
  if (completedOrders.length > 0) {
    updateScore();
    updateGold();
    renderOrders();
    
    showComboPopup(0, `🎉 주문 완료! +${completedOrders.length}명`);
    
    setTimeout(() => generateOrder(), 1000);
  }
}

function startOrderTimer() {
  if (orderTimer) clearInterval(orderTimer);
  
  orderTimer = setInterval(() => {
    if (gameOver) return;
    
    orders.forEach(order => {
      order.timeLeft--;
    });
    
    const prevLength = orders.length;
    orders = orders.filter(o => o.timeLeft > 0);
    
    if (orders.length < prevLength) {
      combo = 0;
      renderOrders();
    }
    
    if (orders.length > 0) {
      const maxTime = 90;
      const minTime = Math.min(...orders.map(o => o.timeLeft));
      const pct = (minTime / maxTime) * 100;
      timerFillEl.style.width = pct + '%';
      
      if (pct < 30) {
        timerFillEl.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
      } else {
        timerFillEl.style.background = 'linear-gradient(90deg, var(--accent) 0%, #ffab76 100%)';
      }
    } else {
      timerFillEl.style.width = '100%';
    }
    
    if (orders.length < 2) {
      generateOrder();
    }
    
    renderOrders();
  }, 1000);
}

// ===== 게임 상태 =====
function checkLevelUp() {
  const newLevel = Math.floor(score / 200) + 1;
  if (newLevel > level) {
    level = newLevel;
    updateLevel();
    showComboPopup(0, `⭐ 레벨 ${level}!`);
  }
}

function checkGameOver() {
  const emptyCells = grid.filter(cell => cell === null).length;
  
  if (emptyCells === 0) {
    let canMerge = false;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      if (grid[i] === null) continue;
      
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      
      const neighbors = [];
      if (row > 0) neighbors.push(i - GRID_COLS);
      if (row < GRID_ROWS - 1) neighbors.push(i + GRID_COLS);
      if (col > 0) neighbors.push(i - 1);
      if (col < GRID_COLS - 1) neighbors.push(i + 1);
      
      for (const nIdx of neighbors) {
        if (grid[nIdx] === grid[i]) {
          canMerge = true;
          break;
        }
      }
      if (canMerge) break;
    }
    
    if (!canMerge && cookingSlotsItems.every(i => i === null)) {
      gameOver = true;
      clearInterval(orderTimer);
      showGameOver();
    }
  }
}

function showGameOver() {
  gameOverMsgEl.textContent = `레벨 ${level}, ${customersServed}명 손님 응대 완료!`;
  finalScoreEl.textContent = score;
  overlayEl.classList.remove('hidden');
}

// ===== 시각 효과 =====
function showFloatingScore(element, text, isGold = false) {
  const rect = element.getBoundingClientRect();
  
  const popup = document.createElement('div');
  popup.className = 'float-score';
  if (isGold) popup.classList.add('gold');
  popup.textContent = text;
  
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    init();
  }
});

// 게임 시작
init();