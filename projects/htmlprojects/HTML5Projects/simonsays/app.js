const buttons = {
    green: document.getElementById('green'),
    red: document.getElementById('red'),
    yellow: document.getElementById('yellow'),
    blue: document.getElementById('blue')
}
const levelDisplaySpan = document.getElementById('level-display');
const successMessage = document.getElementById('success-message');

const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const menuModal = document.getElementById('menu-modal');
const highScoreSpan = document.getElementById('high-score');
const highScoreSpanHard = document.getElementById('high-score-hard');
const playBtn = document.getElementById('play-btn');
const playBtnHard = document.getElementById('play-btn-hard');

const sounds = {
    color_green: "audio/piano.mp3",
    color_red: "audio/guitar.mp3",
    color_yellow: "audio/trumpet.mp3",
    color_blue: "audio/drum.mp3",
    fail: "audio/fail.mp3"
};

function playSound(soundKey){
    const audio = new Audio(sounds[soundKey]);
    audio.play();
    return audio;
};

let sequence = [];
let playerSequence = [];
let level = 0;
let isPlayerTurn = false;
let gameMode = '';
let highScore = localStorage.getItem('simonSaysHighScore') || 0;
let highScoreHard = localStorage.getItem('simonSaysHighScoreHard') || 0;

function startGame(){
    level = 0;
    sequence = [];
    nextRound();
}

function nextRound(){
    isPlayerTurn = false;
    playerSequence = [];
    level++;
    levelDisplaySpan.innerText = level;
    const colors = Object.keys(buttons);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    sequence.push(randomColor);
    playSequence();
}

function playSequence(){
    const sequenceToPlay = gameMode === 'normal' ? sequence : [sequence[sequence.length - 1]];
    sequenceToPlay.forEach((color, index) => {
        setTimeout(() => lightUpButton(color), (index + 1) * 600);
    });
    setTimeout(() => isPlayerTurn = true, (sequenceToPlay.length + 1) * 600);
}

function handlePlayerInput(color){
    if (isPlayerTurn)
        clickButton(color);
    playerSequence.push(color);

    const currentIndex = playerSequence.length - 1;
    if (playerSequence[currentIndex] !== sequence[currentIndex]){
        isPlayerTurn = false;
        setTimeout(endGame, 500);
        return;
    }

    if (playerSequence.length === sequence.length){
        isPlayerTurn = false;
        setTimeout(nextRound, 1000);
        showSuccessMessage();
    }
}

function showSuccessMessage(){
    successMessage.classList.remove('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 600);
}

function endGame(){
    playSound('fail');
    modalTitle.innerText = "Game Over!";
    modalMessage.innerText = `You reached level ${level}.`;

    if (gameMode === 'normal'){
        if (level > highScore){
            highScore = level;
            localStorage.setItem('simonSaysHighScore', highScore);
        }
    }else{
        if (level > highScoreHard){
            highScoreHard = level;
            localStorage.setItem('simonSaysHighScoreHard', highScoreHard);
        }
    }

    highScoreSpan.innerText = highScore;
    highScoreSpanHard.innerText = highScoreHard;
    menuModal.classList.add('show');
}

function clickButton(color){
    const button = buttons[color];
    button.classList.add("lit-click");
    setTimeout(() => button.classList.remove("lit-click"), 100);
    playSound(`color_${color}`);
}

function lightUpButton(color){
    const button = buttons[color];
    button.classList.add("lit");
    setTimeout(() => button.classList.remove("lit"), 400);
    playSound(`color_${color}`);
}

Object.keys(buttons).forEach(color => {
    buttons[color].addEventListener('click', () => handlePlayerInput(color));
});

playBtn.addEventListener('click', () => {
    gameMode = 'normal';
    document.body.classList.remove('hard-bg');
    startGame();
    menuModal.classList.remove('show');
})
playBtnHard.addEventListener('click', () => {
    gameMode = 'hard';
    document.body.classList.add('hard-bg');
    startGame();
    menuModal.classList.remove('show');
})

highScoreSpan.innerText = highScore;
highScoreSpanHard.innerText = highScoreHard;