// --- Elements ---
const scoreDisplay = document.querySelector('#score');
const timeLeftDisplay = document.querySelector('#time-left');
const holes = document.querySelectorAll('.hole');

// --- Prompts and Buttons ---
const startPrompt = document.querySelector('#start-prompt');
const gameOverPrompt = document.querySelector('#game-over-prompt');
const playButton = document.querySelector('#play-button');
const restartButton = document.querySelector('#restart-button');
const finalScoreDisplay = document.querySelector('#final-score');
const highScoreDisplay = document.querySelector('#high-score');

// --- Game State Variables ---
let score = 0;
let timeLeft = 30;
let highScore = 0;

let molePosition = null; // This will hold the id of the mole's square
let gameTimerId = null;  // This will hold the ID for the main game countdown
let moleTimerId = null;  // This will hold the ID for the mole's appearance timer

// --- Functions ---
// --- Load High Score From Storage ---
function loadHighScore() {
    const savedScore = localStorage.getItem('highScore');
    if (savedScore) {
        highScore = parseInt(savedScore);
        highScoreDisplay.textContent = highScore;
    }
}

loadHighScore(); // Run this function when the script loads

function spawnMole() {
    // Clear any existing mole
    holes.forEach(hole => hole.classList.remove('mole'));

    // Cancel any previous mole timer
    clearTimeout(moleTimerId);

    const randomIndex = Math.floor(Math.random() * 16);
    const randomHole = holes[randomIndex];

    randomHole.classList.add('mole');
    molePosition = randomHole.id;

    // Set a timer to make the mole disappear
    moleTimerId = setTimeout(() => {
        randomHole.classList.remove('mole');
        molePosition = null; // Mole is gone, so reset the position
        spawnMole(); //Call the function again!
    }, 800);
}

holes.forEach(hole => {
    hole.addEventListener('click', () => {
        if (hole.id === molePosition) {
            score++;
            scoreDisplay.textContent = score;

            // A successful whack! Spawn the next mole immediately.
            spawnMole();
        }
    });
});

function countdown() {
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;

    if (timeLeft === 0) {
        clearInterval(gameTimerId);
        clearTimeout(moleTimerId);
        holes.forEach(hole => hole.classList.remove('mole'));
        gameOverPrompt.classList.add('visible');
        finalScoreDisplay.textContent = score;

        // Check for and set a new high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        highScoreDisplay.textContent = highScore;
    }
}

function startGame() {
    // Reset the game state
    score = 0;
    timeLeft = 30;
    scoreDisplay.textContent = score;
    timeLeftDisplay.textContent = timeLeft;

    // Hide the prompts
    startPrompt.classList.remove('visible');
    gameOverPrompt.classList.remove('visible');

    // Start the game loops
    spawnMole();
    gameTimerId = setInterval(countdown, 1000);
}

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
startPrompt.classList.add('visible');
