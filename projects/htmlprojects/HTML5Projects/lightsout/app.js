const gameBoard = document.querySelector(".board");
const movesSpan = document.getElementById('moves');
const timeSpan = document.getElementById('time');
const winModal = document.getElementById('win-modal');
const resultMovesSpan = document.getElementById('result-moves');
const resultTimeSpan = document.getElementById('result-time');
const playAgainBtn = document.getElementById('play-again-btn');
const restartBtn = document.getElementById('restart-btn');
const hintModal = document.getElementById('hint-modal');
const hintBtn = document.getElementById('hint-btn');
const closeHintBtn = document.getElementById('close-hint-btn');

const sounds = {
    switch: "audio/switch-1.mp3",
    win: "audio/bell-ring.mp3",
};

function playSound(soundKey){
    const audio = new Audio(sounds[soundKey]);
    audio.play();
    return audio;
};


let boardState = [];
let moves = 0;
let time = 0;
let timer = null;   

function createBoard() {
    // Create a solved board (all zeros)
    let board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

    // Simulate a number of random presses to create the puzzle
    const presses = Math.floor(Math.random() * 10) + 5; // 5 to 14 presses
    for (let i = 0; i < presses; i++) {
        const randomRow = Math.floor(Math.random() * GRID_SIZE);
        const randomCol = Math.floor(Math.random() * GRID_SIZE);
        // Use a temporary board for toggling to avoid modifying the one we are iterating over
        const tempBoardState = board.map(row => [...row]);
        boardState = tempBoardState; // Temporarily set global state for toggleLights
        toggleLights(randomRow, randomCol);
        board = boardState;
    }
    boardState = board;
}

// Game Constants
const GRID_SIZE = 5;

// Toggles a cell and its neighbors in the state array
function toggleLights(row, col) {
    playSound('switch');
    const deltas = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]; // self, right, left, down, up
    deltas.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            boardState[newRow][newCol] = 1 - boardState[newRow][newCol]; // Flip 0 to 1 or 1 to 0
        }
    });
}

function handleCellClick(event){
    moves++;
    movesSpan.innerText = moves;
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    toggleLights(row, col);
    renderBoard();
    checkWinCondition();
}

function checkWinCondition(){
    const isWin = boardState.every(row => row.every(cell => cell === 0));
    if (isWin){
        playSound('win');
        stopTimer();
        resultMovesSpan.innerText = moves;
        resultTimeSpan.innerText = time;
        winModal.classList.add('show');
    }
}

function renderBoard(){
    gameBoard.innerHTML = '';
    boardState.forEach((row, rowIndex) => {
        row.forEach((cellState, colIndex) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (cellState === 1){
                cell.classList.add('light-on');
                cell.innerText = '💡';
            }else{
                cell.classList.add('light-off');
                cell.innerText = '';
            }
            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        });
    });
}

function startGame(){
    moves = 0;
    movesSpan.innerText = moves;
    time = 0;
    timeSpan.innerText = time;
    createBoard();
    renderBoard();
    startTimer();
    winModal.classList.remove('show');
}

function startTimer(){
    stopTimer();
    setInterval(() => {
        time++;
        timeSpan.innerText = time;
    }, 1000);
}

function stopTimer(){
    if (timer)
        clearInterval(timer);
    timer = null;
}

playAgainBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
hintBtn.addEventListener('click', () => hintModal.classList.add('show'));
closeHintBtn.addEventListener('click', () => hintModal.classList.remove('show'));

startGame();