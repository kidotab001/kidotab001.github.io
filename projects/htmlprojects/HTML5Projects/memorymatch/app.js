const gameBoard = document.querySelector('.game-board');
const scoreCountSpan = document.getElementById('score-count');
const timeLeftSpan = document.getElementById('time-left');

const startModal = document.getElementById('start-modal');
const endModal = document.getElementById('end-modal');
const startGameBtn = document.getElementById('start-game-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const highScoreStartSpan = document.getElementById('high-score-start');
const finalScoreSpan = document.getElementById('final-score');
const highScoreEndSpan = document.getElementById('high-score-end');

const sounds = {
    correct: "audio/correct.mp3",
    incorrect: "audio/incorrect.mp3",
    flip: "audio/flip.mp3",
    timeup: "audio/timeup.mp3",
    reveal: "audio/reveal.mp3"
};

function playSound(soundKey){
    const audio = new Audio(sounds[soundKey]);
    audio.play();
    return audio;
};

const emojiSets = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
    fruits: ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝'],
    food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧇', '🍩', '🍪'],
    plants: ['🌵', '🎄', '🍁', '🌴', '🌱', '🌷', '🌼', '🍀'],
    smileys: ['😀', '😂', '😍', '😎', '😢', '😡', '😱', '🥳']
};

let lockBoard = false;
let hasFlippedCard = false;
let firstCard, secondCard;
let score = 0;
let timeLeft = 60;
let totalPairs = 0;
let foundPairs = 0;
let timerId = null;
let highScore = localStorage.getItem('memoryMatchHighScore') || 0;

// Fisher-Yates Shuffle Algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateCards(cardValues) {
    shuffle(cardValues);
    gameBoard.innerHTML = ''; // Clear previous board

    cardValues.forEach(emoji => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('is-hidden');

        card.dataset.emoji = emoji; // Use data-* attribute to store emoji

        card.innerHTML = `
            <div class="card-face front">${emoji}</div>
            <div class="card-face back"></div>
        `;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

// Reset variables after a turn
function turnEnd() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function flipCard(){
    if (lockBoard) return;
    if (this === firstCard) return; // Prevent double-clicking the same card
    this.classList.remove('is-hidden');
    if (!hasFlippedCard) {
        // First card flipped
        hasFlippedCard = true;
        firstCard = this;
    } else {
        // Second card flipped
        secondCard = this;
        checkForMatch(); // Unflip the two cards
    }
    playSound("flip");
}

// Check if the two flipped cards match
function checkForMatch() {
    const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;
    isMatch ? keepCards() : unflipCards();
}

function unflipCards() {
    playSound("incorrect");
    firstCard.classList.add('shake');
    secondCard.classList.add('shake');
    lockBoard = true; // Prevent other cards from being flipped
    setTimeout(() => {
        firstCard.classList.add('is-hidden');
        secondCard.classList.add('is-hidden');
        firstCard.classList.remove('shake');
        secondCard.classList.remove('shake');
        turnEnd();
    }, 500); // Wait 0.5s before flipping back
}

// Handle matching cards
function keepCards() {
    playSound("correct");
    score++;
    scoreCountSpan.innerText = score;
    firstCard.classList.add('leap');
    secondCard.classList.add('leap');
    firstCard.classList.add('match');
    secondCard.classList.add('match');
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    turnEnd();

    foundPairs++;
    // Check for reset condition
    if (foundPairs === totalPairs) {
        setTimeout(() => {
            newBoard();
        }, 500);
    }
}

// Main game start/reset function
function startGame() {
    // Reset game state
    score = 0;
    timeLeft = 60;
    scoreCountSpan.textContent = score;
    timeLeftSpan.textContent = timeLeft;
    // Create new board
    newBoard();
}

function newBoard(){
    lockBoard = true;
    //  Randomly select an emoji set
    const setKeys = Object.keys(emojiSets);
    const randomSetKey = setKeys[Math.floor(Math.random() * setKeys.length)];
    const emojis = emojiSets[randomSetKey];
    const cardValues = [...emojis, ...emojis];

    totalPairs = emojis.length;
    foundPairs = 0;

    generateCards(cardValues);

    // Initial reveal of all cards
    const cards = document.querySelectorAll('.card');
    setTimeout(() => {
        cards.forEach(card => { 
            card.classList.remove('is-hidden');
            card.classList.remove('leap');
            card.classList.remove('match');
        });
    });
    playSound("reveal");
    // Hide the card after some time
    setTimeout(() => {
        cards.forEach(card => card.classList.add('is-hidden'));
        lockBoard = false;
        // Start the timer after cards are hidden
        if (!timerId)
            timerId = setInterval(updateTimer, 1000);
    }, 2000);
}

// Timer function
function updateTimer() {
    timeLeft--;
    timeLeftSpan.textContent = timeLeft;
    if (timeLeft === 0){
        endGame();
    }
}

// Game over function
function endGame() {
    playSound("timeup");
    clearInterval(timerId);
    timerId = null;
    lockBoard = true;

    if (score > highScore){
        highScore = score;
        localStorage.setItem('memoryMatchHighScore', highScore);
    }

    // Display result
    finalScoreSpan.innerText = score;
    highScoreEndSpan.innerText = highScore;
    endModal.classList.add('show');
}

startGameBtn.addEventListener('click', () => {
    startModal.classList.remove('show');
    startGame();
});

playAgainBtn.addEventListener('click', () => {
    endModal.classList.remove('show');
    startGame();
});

// Initial Setup
function init() {
    generateCards(Array(16).fill(''));
    lockBoard = true;
    highScoreStartSpan.innerText = highScore;
}
init();