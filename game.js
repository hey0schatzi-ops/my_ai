const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.querySelector("#next");
const nextCtx = nextCanvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const restartBtn = document.querySelector("#restart");
const restartOverlayBtn = document.querySelector("#restartOverlay");
const dropBtn = document.querySelector("#drop");


const W = canvas.width;
const H = canvas.height;
const wall = 18;
const floor = H - 18;
const dangerLine = 92;
const gravity = 0.42;
const bounce = 0.32;
const friction = 0.986;

const fruits = [
  { name: "체리", radius: 16, color: "#ff4d69", accent: "#ffc0cb", score: 2, sprite: 0 },
  { name: "딸기", radius: 22, color: "#ff3151", accent: "#ffe06d", score: 4, sprite: 1 },
  { name: "포도", radius: 28, color: "#8b5cf6", accent: "#d9c3ff", score: 8, sprite: 2 },
  { name: "귤", radius: 35, color: "#ff9f1c", accent: "#ffe08a", score: 16, sprite: 3 },
  { name: "감", radius: 43, color: "#ff6b35", accent: "#ffd166", score: 32, sprite: 4 },
  { name: "사과", radius: 52, color: "#e63946", accent: "#ffb3ba", score: 64, sprite: 5 },
  { name: "배", radius: 62, color: "#c5d86d", accent: "#f6ffb5", score: 128, sprite: 6 },
  { name: "복숭아", radius: 73, color: "#ffb4a2", accent: "#fff0c7", score: 256, sprite: 7 },
  { name: "멜론", radius: 86, color: "#6bc46d", accent: "#cfffc8", score: 512, sprite: 8 },
  { name: "수박", radius: 102, color: "#2eaf5f", accent: "#b6f3a4", score: 1024, sprite: 9 },
];

let pieces;
let nextType;
let previewX;
let score;
let best = Number(localStorage.getItem("suika-best") || 0);
let gameOver;
let canDrop;
let lastTime;
let idSeed;
let particles = [];
let screenShake = 0;
let scorePopups = [];

function randomStartType() {
  return Math.floor(Math.random() * 5);
}

function reset() {
  pieces = [];
  nextType = randomStartType();
  previewX = W / 2;
  score = 0;
  gameOver = false;
  canDrop = true;
  lastTime = performance.now();
  idSeed = 1;
  particles = [];
  screenShake = 0;
  scorePopups = [];
  overlay.classList.add("hidden");
  updateScore();
  drawNext();
}

function updateScore() {
  scoreEl.textContent = score;
  best = Math.max(best, score);
  bestEl.textContent = best;
  localStorage.setItem("suika-best", String(best));
}

function createPiece(type, x, y) {
  return {
    id: idSeed++,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: fruits[type].radius,
    merging: false,
    born: performance.now(),
  };
}

function dropPiece() {
  if (!canDrop || gameOver) return;
  const fruit = fruits[nextType];
  pieces.push(createPiece(nextType, previewX, dangerLine - fruit.radius - 8));
  nextType = randomStartType();
  canDrop = false;
  window.setTimeout(() => {
    canDrop = true;
  }, 520);
  drawNext();
}

function pointerX(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  return ((clientX - rect.left) / rect.width) * W;
}

function movePreview(event) {
  if (gameOver) return;
  const radius = fruits[nextType].radius;
  previewX = Math.max(wall + radius, Math.min(W - wall - radius, pointerX(event)));
}

canvas.addEventListener("pointermove", movePreview);
canvas.addEventListener("pointerdown", (event) => {
  movePreview(event);
  dropPiece();
});

dropBtn.addEventListener("click", dropPiece);
restartBtn.addEventListener("click", reset);
restartOverlayBtn.addEventListener("click", reset);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    previewX -= 18;
  }
  if (event.key === "ArrowRight") {
    previewX += 18;
  }
  if (event.key === " " || event.key === "Enter") {
    dropPiece();
  }
  const radius = fruits[nextType].radius;
  previewX = Math.max(wall + radius, Math.min(W - wall - radius, previewX));
});

function physicsStep() {
  for (const p of pieces) {
    p.vy += gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= friction;

    if (p.x - p.radius < wall) {
      p.x = wall + p.radius;
      p.vx = Math.abs(p.vx) * bounce;
    }
    if (p.x + p.radius > W - wall) {
      p.x = W - wall - p.radius;
      p.vx = -Math.abs(p.vx) * bounce;
    }
    if (p.y + p.radius > floor) {
      p.y = floor - p.radius;
      p.vy = -Math.abs(p.vy) * bounce;
      p.vx *= 0.93;
    }
  }

  for (let i = 0; i < pieces.length; i += 1) {
    for (let j = i + 1; j < pieces.length; j += 1) {
      const a = pieces[i];
      const b = pieces[j];
      if (a.merging || b.merging) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minDistance = a.radius + b.radius;

      if (distance >= minDistance) continue;

      if (a.type === b.type && a.type < fruits.length - 1) {
        mergePieces(a, b);
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      const push = overlap / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;

      const tx = -ny;
      const ty = nx;
      const va = a.vx * nx + a.vy * ny;
      const vb = b.vx * nx + b.vy * ny;
      const tangentA = a.vx * tx + a.vy * ty;
      const tangentB = b.vx * tx + b.vy * ty;
      a.vx = vb * nx + tangentA * tx;
      a.vy = vb * ny + tangentA * ty;
      b.vx = va * nx + tangentB * tx;
      b.vy = va * ny + tangentB * ty;
    }
  }

  pieces = pieces.filter((p) => !p.merging);
  checkGameOver();
}

function spawnParticles(x, y, color, count, sizeBase) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      size: sizeBase * (0.5 + Math.random() * 0.8),
      color,
      type: Math.random() > 0.5 ? "circle" : "star",
    });
  }
}

function spawnScorePopup(x, y, points) {
  scorePopups.push({
    x,
    y,
    text: "+" + points,
    life: 1,
    decay: 0.018,
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.vx *= 0.98;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const s = scorePopups[i];
    s.y -= 1.2;
    s.life -= s.decay;
    if (s.life <= 0) {
      scorePopups.splice(i, 1);
    }
  }
  if (screenShake > 0) {
    screenShake *= 0.88;
    if (screenShake < 0.3) screenShake = 0;
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    if (p.type === "star") {
      ctx.rotate(p.life * Math.PI * 2);
      const s = p.size * p.life;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * s;
        const y = Math.sin(angle) * s;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        const innerAngle = angle + Math.PI / 5;
        ctx.lineTo(Math.cos(innerAngle) * s * 0.4, Math.sin(innerAngle) * s * 0.4);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const s of scorePopups) {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#26311f";
    ctx.lineWidth = 4;
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText(s.text, s.x, s.y);
    ctx.fillText(s.text, s.x, s.y);
    ctx.restore();
  }
}

function mergePieces(a, b) {
  a.merging = true;
  b.merging = true;
  const type = a.type + 1;
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const merged = createPiece(type, midX, midY);
  merged.vx = (a.vx + b.vx) * 0.25;
  merged.vy = Math.min((a.vy + b.vy) * 0.25, -3);
  pieces.push(merged);
  score += fruits[type].score;
  updateScore();

  const fruit = fruits[type];
  const particleCount = 8 + type * 3;
  spawnParticles(midX, midY, fruit.color, particleCount, 3 + type * 0.5);
  spawnParticles(midX, midY, fruit.accent, Math.floor(particleCount / 2), 2 + type * 0.3);
  spawnScorePopup(midX, midY - fruit.radius - 10, fruit.score);
  screenShake = 3 + type * 1.5;
}

function checkGameOver() {
  if (gameOver) return;
  const now = performance.now();
  const blocked = pieces.some((p) => {
    const settled = Math.abs(p.vx) + Math.abs(p.vy) < 1.1;
    return p.y - p.radius < dangerLine && settled && now - p.born > 1800;
  });
  if (blocked) {
    gameOver = true;
    overlay.classList.remove("hidden");
  }
}

function drawFruit(context, piece, scale = 1) {
  const fruit = fruits[piece.type];
  const r = piece.radius * scale;
  const x = piece.x;
  const y = piece.y;

  context.save();
  context.translate(x, y);

  // 그림자
  context.shadowColor = "rgba(58, 39, 16, 0.25)";
  context.shadowBlur = Math.max(6, r * 0.15);
  context.shadowOffsetY = Math.max(3, r * 0.08);

  // 메인 그라데이션
  const grad = context.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, fruit.accent);
  grad.addColorStop(0.5, fruit.color);
  grad.addColorStop(1, shade(fruit.color, -30));
  context.fillStyle = grad;
  context.beginPath();
  context.arc(0, 0, r, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = "transparent";

  // 테두리
  context.lineWidth = Math.max(2, r * 0.06);
  context.strokeStyle = shade(fruit.color, -40);
  context.stroke();

  // 하이라이트 (빛 반사)
  context.fillStyle = "rgba(255, 255, 255, 0.6)";
  context.beginPath();
  context.ellipse(-r * 0.28, -r * 0.32, r * 0.28, r * 0.18, -0.5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.3)";
  context.beginPath();
  context.arc(-r * 0.15, -r * 0.55, r * 0.1, 0, Math.PI * 2);
  context.fill();

  // 과일별 장식
  drawFruitDetail(context, piece.type, r);

  context.restore();
}

function drawFruitDetail(context, type, r) {
  // 간단한 번호 라벨로 과일 구분
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.strokeStyle = "rgba(0, 0, 0, 0.3)";
  context.lineWidth = Math.max(1, r * 0.04);
  context.font = `bold ${Math.max(12, r * 0.5)}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  
  const labels = ["🍒", "🍓", "🍇", "🍊", "🍅", "🍎", "🍐", "🍑", "🍈", "🍉"];
  const emoji = labels[type];
  
  // 이모지 렌더링
  context.fillText(emoji, 0, 0);
}

function shade(hex, amount) {
  const raw = hex.replace("#", "");
  const num = Number.parseInt(raw, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawBoard() {
  ctx.save();
  
  if (screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * screenShake * 2;
    const shakeY = (Math.random() - 0.5) * screenShake * 2;
    ctx.translate(shakeX, shakeY);
  }

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff4bf";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#8a6b32";
  ctx.fillRect(0, 0, wall, H);
  ctx.fillRect(W - wall, 0, wall, H);
  ctx.fillRect(0, floor, W, H - floor);

  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = "rgba(228, 85, 85, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wall, dangerLine);
  ctx.lineTo(W - wall, dangerLine);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!gameOver) {
    const fruit = fruits[nextType];
    ctx.globalAlpha = canDrop ? 0.62 : 0.28;
    drawFruit(ctx, { type: nextType, x: previewX, y: dangerLine - fruit.radius - 8, radius: fruit.radius });
    ctx.globalAlpha = 1;
  }

  pieces
    .slice()
    .sort((a, b) => a.radius - b.radius)
    .forEach((piece) => drawFruit(ctx, piece));

  drawParticles();
  
  ctx.restore();
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const fruit = fruits[nextType];
  const scale = Math.min(1, 28 / fruit.radius);
  drawFruit(nextCtx, {
    type: nextType,
    x: nextCanvas.width / 2,
    y: nextCanvas.height / 2,
    radius: fruit.radius,
  }, scale);
}

function tick(now) {
  const delta = Math.min(3, (now - lastTime) / 16.67);
  lastTime = now;
  const steps = Math.ceil(delta);
  for (let i = 0; i < steps; i += 1) {
    if (!gameOver) physicsStep();
  }
  updateParticles();
  drawBoard();
  requestAnimationFrame(tick);
}

reset();
requestAnimationFrame(tick);
