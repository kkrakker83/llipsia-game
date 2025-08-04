const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adaptar canvas al tamaño visual
function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.9, 400);
  canvas.width = size;
  canvas.height = size;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Grid dinámico
let gridSize = 20;
let tileCount = canvas.width / gridSize;

let llipsia = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = generateFood();
let score = 0;

function draw() {
  tileCount = canvas.width / gridSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (direction.x === 0 && direction.y === 0) {
    drawInitialFrame();
    return;
  }

  ctx.font = `${canvas.width / 20}px Arial`;
  ctx.fillText("👻", food.x * gridSize, food.y * gridSize + gridSize * 0.9);

  for (let i = 0; i < llipsia.length; i++) {
    const part = llipsia[i];
    if (i === 0) {
      ctx.fillText("🐧", part.x * gridSize, part.y * gridSize + gridSize * 0.9);
    } else {
      ctx.fillStyle = "#4444aa";
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    }
  }

  const head = { x: llipsia[0].x + direction.x, y: llipsia[0].y + direction.y };

  if (
    head.x < 0 || head.y < 0 ||
    head.x >= tileCount || head.y >= tileCount ||
    llipsia.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    alert("¡Llipsia chocó! Puntuación: " + score);
    resetGame();
    return;
  }

  llipsia.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('score').innerText = "Puntuación: " + score;
    food = generateFood();
  } else {
    llipsia.pop();
  }
}

function drawInitialFrame() {
  tileCount = canvas.width / gridSize;
  ctx.font = `${canvas.width / 20}px Arial`;
  ctx.fillText("👻", food.x * gridSize, food.y * gridSize + gridSize * 0.9);

  for (let i = 0; i < llipsia.length; i++) {
    const part = llipsia[i];
    if (i === 0) {
      ctx.fillText("🐧", part.x * gridSize, part.y * gridSize + gridSize * 0.9);
    } else {
      ctx.fillStyle = "#4444aa";
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    }
  }
}

function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (llipsia.some(part => part.x === newFood.x && part.y === newFood.y));
  return newFood;
}

function resetGame() {
  llipsia = [{ x: 10, y: 10 }];
  direction = { x: 0, y: 0 };
  score = 0;
  document.getElementById('score').innerText = "Puntuación: 0";
  food = generateFood();
}

canvas.addEventListener("touchstart", function (e) {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const tapX = touch.clientX - rect.left;
  const tapY = touch.clientY - rect.top;

  const head = llipsia[0];
  const headX = head.x * gridSize + gridSize / 2;
  const headY = head.y * gridSize + gridSize / 2;

  const dx = tapX - headX;
  const dy = tapY - headY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0 && direction.x === 0) direction = { x: -1, y: 0 };
    else if (dx > 0 && direction.x === 0) direction = { x: 1, y: 0 };
  } else {
    if (dy < 0 && direction.y === 0) direction = { x: 0, y: -1 };
    else if (dy > 0 && direction.y === 0) direction = { x: 0, y: 1 };
  }
});

setInterval(draw, 350);