const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let llipsia = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = generateFood();
let score = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Esperar a que el jugador presione dirección
  if (direction.x === 0 && direction.y === 0) {
    drawInitialFrame();
    return;
  }

  // Dibujar comida
  ctx.font = "20px Arial";
  ctx.fillText("❤️👻", food.x * gridSize, food.y * gridSize + 18);

  // Dibujar cuerpo de Llipsia
  for (let part of llipsia) {
    ctx.fillStyle = "#4444aa";
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
  }

  const head = { x: llipsia[0].x + direction.x, y: llipsia[0].y + direction.y };

  // Colisión
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

  // Comer comida
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('score').innerText = "Puntuación: " + score;
    food = generateFood();
  } else {
    llipsia.pop();
  }
}

function drawInitialFrame() {
  // Dibujar comida
  ctx.font = "20px Arial";
  ctx.fillText("❤️👻", food.x * gridSize, food.y * gridSize + 18);

  // Dibujar cuerpo de Llipsia
  for (let part of llipsia) {
    ctx.fillStyle = "#4444aa";
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
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

function changeDirection(dir) {
  switch (dir) {
    case 'up':
      if (direction.y === 0) direction = { x: 0, y: -1 };
      break;
    case 'down':
      if (direction.y === 0) direction = { x: 0, y: 1 };
      break;
    case 'left':
      if (direction.x === 0) direction = { x: -1, y: 0 };
      break;
    case 'right':
      if (direction.x === 0) direction = { x: 1, y: 0 };
      break;
  }
}

setInterval(draw, 150);