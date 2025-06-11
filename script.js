// --- Sudoku logic and helpers ---
const sample = [[8, 3, 5, 4, 1, 6, 9, 2, 7],
[2, 9, 6, 8, 5, 7, 4, 3, 1],
[4, 1, 7, 2, 9, 3, 6, 5, 8],
[5, 6, 9, 1, 3, 4, 7, 8, 2],
[1, 2, 3, 6, 7, 8, 5, 4, 9],
[7, 4, 8, 5, 2, 9, 1, 6, 3],
[6, 5, 2, 7, 8, 1, 3, 9, 4],
[9, 8, 1, 3, 4, 5, 2, 7, 6],
[3, 7, 4, 9, 6, 2, 8, 1, 5]];

// Deep copy 2D array
function deepCopy(board) {
  return board.map(row => row.slice());
}

// Shuffle rows and columns within bands/stacks for randomization
function rand(n) { return Math.floor(Math.random() * n); }
function swapRow(board, i, j) { [board[i], board[j]] = [board[j], board[i]]; }
function swapCol(board, i, j) {
  for (let k = 0; k < 9; k++) [board[k][i], board[k][j]] = [board[k][j], board[k][i]];
}
function shuffleSudoku(board) {
  for (let n = 0; n < 3; n++) {
    for (let k = 0; k < 5; k++) {
      let a = n * 3;
      let i = rand(3), j = rand(3);
      swapRow(board, a + i, a + j);
      i = rand(3); j = rand(3);
      swapCol(board, a + i, a + j);
    }
  }
  for (let k = 0; k < 5; k++) {
    let i = rand(3), j = rand(3);
    swapRow(board, i, j);
    i = rand(3); j = rand(3);
    swapCol(board, i, j);
  }
}

// Remove 'count' random digits
function removeRandomDigits(board, count) {
  let newBoard = deepCopy(board);
  let positions = [];
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      positions.push([i, j]);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let k = 0; k < count && k < positions.length; k++) {
    let [i, j] = positions[k];
    newBoard[i][j] = 0;
  }
  return newBoard;
}

// --- Game State ---
let solution = deepCopy(sample);
shuffleSudoku(solution);
let puzzle = removeRandomDigits(solution, 35);
let userBoard = deepCopy(puzzle);
let hintsLeft = 5;
let timer = 0, timerInterval = null;
let gameOver = false;

// --- DOM Elements ---
const grid = document.getElementById('sudoku-grid');
const hintBtn = document.getElementById('hint-btn');
const hintCount = document.getElementById('hint-count');
const showSolutionBtn = document.getElementById('show-solution-btn');
const restartBtn = document.getElementById('restart-btn');
const resultDiv = document.getElementById('result');
const stopwatch = document.getElementById('stopwatch');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.getElementById('game-container');

startBtn.onclick = function () {
  startScreen.style.display = 'none';
  gameContainer.style.display = '';
  startGame();
};

function startGame() {
  // New puzzle
  solution = deepCopy(sample);
  shuffleSudoku(solution);
  puzzle = removeRandomDigits(solution, 35);
  userBoard = deepCopy(puzzle);
  hintsLeft = 5;
  hintCount.textContent = hintsLeft;
  resultDiv.textContent = '';
  gameOver = false;
  renderGrid();
  clearInterval(timerInterval);
  startTimer();
  restartBtn.style.display = 'none';
}

// --- Render Sudoku Grid ---
function renderGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      // Borders for 3x3 blocks
      if (i % 3 === 0) input.classList.add('thick-top');
      if (j % 3 === 0) input.classList.add('thick-left');
      if (i === 8) input.classList.add('thick-bottom');
      if (j === 8) input.classList.add('thick-right');
      if (puzzle[i][j] !== 0) {
        input.value = puzzle[i][j];
        input.disabled = true;
      } else {
        input.value = userBoard[i][j] ? userBoard[i][j] : '';
      }
      input.addEventListener('input', onInput);
      input.addEventListener('focus', () => input.select());
      grid.appendChild(input);
    }
  }
}
renderGrid();

// --- Input Handler ---
function onInput(e) {
  if (gameOver) return;
  const input = e.target;
  let val = input.value.replace(/[^1-9]/g, '');
  input.value = val;
  const row = +input.dataset.row, col = +input.dataset.col;
  if (val === '') {
    userBoard[row][col] = 0;
    input.classList.remove('wrong');
    return;
  }
  userBoard[row][col] = +val;
  if (+val !== solution[row][col]) {
    input.classList.add('wrong');
  } else {
    input.classList.remove('wrong');
    // Check win
    if (checkWin()) {
      endGame(true);
    }
  }
}

// --- Check Win ---
function checkWin() {
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (userBoard[i][j] !== solution[i][j]) return false;
  return true;
}

// --- End Game ---
function endGame(won) {
  gameOver = true;
  clearInterval(timerInterval);
  if (won) {
    resultDiv.innerHTML = `🎉 Congratulations! You solved it in ${formatTime(timer)}.`;
    restartBtn.style.display = 'inline-block';
  }
}

// --- Stopwatch ---
function formatTime(sec) {
  let m = Math.floor(sec / 60), s = sec % 60;
  return `<span class="tm" >${m.toString().padStart(2, '0')}</span> : <span class="tm" >${s.toString().padStart(2, '0')}</span>`;
}
function startTimer() {
  timer = 0;
  stopwatch.innerHTML = formatTime(timer);
  timerInterval = setInterval(() => {
    timer++;
    stopwatch.innerHTML = formatTime(timer);
  }, 1000);
}
startTimer();

// --- Hint System ---
hintBtn.onclick = function () {
  if (gameOver || hintsLeft <= 0) return;
  // Find all empty or wrong cells
  let candidates = [];
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++)
      if (puzzle[i][j] === 0 && userBoard[i][j] !== solution[i][j])
        candidates.push([i, j]);
  if (candidates.length === 0) return;
  let [i, j] = candidates[Math.floor(Math.random() * candidates.length)];
  userBoard[i][j] = solution[i][j];
  renderGrid();
  hintsLeft--;
  hintCount.textContent = hintsLeft;
  if (checkWin()) endGame(true);
};

// --- Show Solution ---
showSolutionBtn.onclick = function () {
  userBoard = deepCopy(solution);
  renderGrid();
  endGame(false);
  resultDiv.textContent = "Solution shown. Try again!";
  restartBtn.style.display = 'inline-block';
};

// --- Restart ---
restartBtn.onclick = function () {
  // New puzzle
  solution = deepCopy(sample);
  shuffleSudoku(solution);
  puzzle = removeRandomDigits(solution, 35);
  userBoard = deepCopy(puzzle);
  hintsLeft = 5;
  hintCount.textContent = hintsLeft;
  resultDiv.textContent = '';
  gameOver = false;
  renderGrid();
  clearInterval(timerInterval);
  startTimer();
  restartBtn.style.display = 'none';
};

// --- Responsive: re-render on resize for focus/blur fixes (optional) ---
window.addEventListener('resize', renderGrid);
