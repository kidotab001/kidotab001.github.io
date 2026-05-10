const gameBoard = document.querySelector('.game-board');
const movesSpan = document.querySelector('#moves');
const timeSpan = document.querySelector('#time');
const winModal = document.querySelector('#win-modal');
const resultMovesSpan = document.querySelector('#result-moves');
const resultTimeSpan = document.querySelector('#result-time');
const playAgainButton = document.querySelector('#play-again-btn');
const solvedPuzzleImg = document.querySelector('.solved-puzzle-preview');
const menuModal = document.querySelector('#menu-modal');
const sizeSelect = document.querySelector('#size-select');
const themeSelect = document.querySelector('#theme-select');
const startGameBtn = document.querySelector('#start-game-btn');
const shuffleBtn = document.querySelector('#shuffle-btn');
const giveUpBtn = document.querySelector('#give-up-btn');
const confirmModal = document.querySelector('#confirm-modal');
const confirmBtn = document.querySelector('#confirm-btn');
const cancelBtn = document.querySelector('#cancel-btn');
const returnBtn = document.querySelector('#return-btn');

const sounds = {
    slide: "audio/page-flip.mp3",
    win: "audio/bell-ring.mp3",
};

function playSound(soundKey){
    const audio = new Audio(sounds[soundKey]);
    audio.play();
    return audio;
};

const imageSources = {
    nature: [
        'img/zebra.jpg',
        'img/lion.jpg',
        'img/lotus.jpg',
        'img/sunset.jpg',
    ],
    painting: [
        'img/tsunami.jpg',
        'img/starrynight.jpg',
        'img/monalisa.jpg',
        'img/memory.jpg',
    ],
    places: [
        'img/eiffel.jpg',
        'img/london.jpg',
        'img/castle.jpg',
        'img/liberty.jpg',
    ]
};

// --- GAME STATE ---
let settings = {
    rows: 3,
    cols: 3,
    theme: 'nature'
};
let boardState = [];
let emptyTile = {};
let currentImageUrl = '';
let moves = 0;
let time = 0;
let timer = null;

function createBoardState(){
    boardState = [];
    let counter = 1;
    for (let r = 0; r < settings.rows; r++) {
        const row = [];
        for (let c = 0; c < settings.cols; c++) {
            row.push(counter++);
        }
        boardState.push(row);
    }
    // Set the last tile as the empty one (0)
    boardState[settings.rows - 1][settings.cols - 1] = 0;
    emptyTile = { row: settings.rows - 1, col: settings.cols - 1 };
}

function shuffleBoard() {
    // Start with a solved board and make a large number of random valid moves
    for (let i = 0; i < 1000; i++) {
        const neighbors = [];
        const { row, col } = emptyTile;
        if (row > 0) neighbors.push({ row: row - 1, col });
        if (row < settings.rows - 1) neighbors.push({ row: row + 1, col });
        if (col > 0) neighbors.push({ row, col: col - 1 });
        if (col < settings.cols - 1) neighbors.push({ row, col: col + 1 });

        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        swapTiles(randomNeighbor.row, randomNeighbor.col, false); // Don't animate shuffle
    }
}

function renderBoard(){
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${settings.rows}, 1fr)`;
    const tileWidth = 100 / (settings.cols - 1);
    const tileHeight = 100 / (settings.rows - 1);
    for (let r = 0; r < settings.rows; r++) {
        for (let c = 0; c < settings.cols; c++) {
            const tileValue = boardState[r][c];
            if (tileValue === 0) continue;
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.style.width = `${100 / settings.cols}%`;
            tile.style.height = `${100 / settings.rows}%`;
            tile.style.top = `${r * (100 / settings.rows)}%`;
            tile.style.left = `${c * (100 / settings.cols)}%`;
            tile.dataset.value = tileValue;
            gameBoard.appendChild(tile);
            tile.style.backgroundImage = `url(${currentImageUrl})`;
            tile.style.backgroundSize = `${settings.cols * 100}% ${settings.rows * 100}%`;
            const originalRow = Math.floor((tileValue - 1) / settings.cols);
            const originalCol = (tileValue - 1) % settings.cols;
            tile.style.backgroundPosition = `${originalCol * tileWidth}% ${originalRow * tileHeight}%`;
            const number = document.createElement('span');
            number.classList.add('tile-number');
            number.textContent = tileValue;
            tile.appendChild(number);
            tile.addEventListener('click', handleTileClick);
        }
    }
}

function handleTileClick(event){
    moves++;
    movesSpan.innerText = moves;
    const clickedValue = parseInt(event.currentTarget.dataset.value);
    let clickedTilePos;
    for (let r = 0; r < settings.rows; r++) {
        const c = boardState[r].indexOf(clickedValue);
        if (c > -1) {
            clickedTilePos = { row: r, col: c };
            break;
        }
    }
    const { row: r1, col: c1 } = clickedTilePos;
    const { row: r2, col: c2 } = emptyTile;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
        playSound('slide');
        swapTiles(r1, c1, true);
    }
}

function swapTiles(row, col, animate) {
    const tileValue = boardState[row][col];
    // Update state array
    boardState[emptyTile.row][emptyTile.col] = tileValue;
    boardState[row][col] = 0;
    if (animate) {
        // Animate the tile on the DOM
        const tileElement = document.querySelector(`[data-value='${tileValue}']`);
        tileElement.style.top = `${emptyTile.row * (100 / settings.rows)}%`;
        tileElement.style.left = `${emptyTile.col * (100 / settings.cols)}%`;
    }
    // Update empty tile coordinates
    emptyTile = { row, col };
    if (animate) {
        // Debounce win check until after animation
        setTimeout(checkWin, 400);
    }
}

function checkWin() {
    let counter = 1;
    for (let r = 0; r < settings.rows; r++) {
        for (let c = 0; c < settings.cols; c++) {
            if (r === settings.rows - 1 && c === settings.cols - 1) {
                if (boardState[r][c] !== 0) return; // Last tile must be empty
            } else {
                if (boardState[r][c] !== counter++) return;
            }
        }
    }
    playSound('win');
    stopTimer();
    resultMovesSpan.innerText = moves;
    resultTimeSpan.innerText = time;
    solvedPuzzleImg.src = currentImageUrl;
    winModal.classList.add('show');
    showConfetti();
}

function showConfetti() {
    const confettiContainer = document.body;
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = Math.random() * 2 + 3 + 's';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confettiContainer.appendChild(confetti);

        // Remove confetti after animation
        confetti.addEventListener('animationend', () => {
            confetti.remove();
        });
    }
}

function startTimer(){
    stopTimer();
    timer = setInterval(() => {
        time++;
        timeSpan.innerText = time;
    }, 1000);
}

function stopTimer(){
    if (timer)
        clearInterval(timer);
    timer = null;
}

function initGame(){
    moves = 0;
    movesSpan.innerText = moves;
    time = 0;
    timeSpan.innerText = time;

    // Select random image
    const themeImages = imageSources[settings.theme];
    currentImageUrl = themeImages[Math.floor(Math.random() * themeImages.length)];
    createBoardState();
    shuffleBoard();
    renderBoard();
    startTimer();
}

function returnToMenu(){
    stopTimer();
    moves = 0;
    movesSpan.innerText = moves;
    time = 0;
    timeSpan.innerText = time;
    gameBoard.innerHTML = '';
    winModal.classList.remove('show');
    confirmModal.classList.remove('show');
    menuModal.classList.add('show');
}

playAgainButton.addEventListener('click', () => {
    winModal.classList.remove('show');
    initGame();
});
startGameBtn.addEventListener('click', () => {
    const [rows, cols] = sizeSelect.value.split('x').map(Number);
    settings.rows = rows;
    settings.cols = cols;
    settings.theme = themeSelect.value;
    menuModal.classList.remove('show');
    initGame();
});
shuffleBtn.addEventListener('click', () => {
    for(let i = 0; i < 5; i++){
        playSound('slide');
    }
    setTimeout(() => {
        shuffleBoard();
        renderBoard();
    }, 500);
});
giveUpBtn.addEventListener('click', () => {
    confirmModal.classList.add('show');
});
cancelBtn.addEventListener('click', () => {
    confirmModal.classList.remove('show');
});
confirmBtn.addEventListener('click', returnToMenu);
returnBtn.addEventListener('click', returnToMenu);

//initGame();
