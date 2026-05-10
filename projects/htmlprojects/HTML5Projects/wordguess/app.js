const keyboardContainer = document.querySelector('.keyboard');
const wordDisplay = document.querySelector('.word-display');
const heartsContainer = document.querySelector('.hearts-container');
const themeText = document.querySelector('#word-theme');
const modal = document.querySelector('#result-modal');
const modalTitle = document.querySelector('#modal-title');
const modalMessage = document.querySelector('#modal-message');
const playAgainBtn = document.querySelector('#play-again-btn');
const hintBtn = document.querySelector('#hint-btn');

const sounds = {
    correct: 'audio/button-3.mp3',
    wrong: 'audio/button-10.mp3',
    win: 'audio/applause-2.mp3',
    lose: 'audio/fail-trombone-01.mp3'
};

function playSound(soundKey){
    const audio = new Audio(sounds[soundKey]);
    audio.play();
    return audio;
};

let currentWord = '';
let correctLetters = [];
let wrongGuessCount = 0;
const maxGuesses = 6;
const wordPacks = {
    Animal: ["elephant", "giraffe", "dolphin", "penguin", "cheetah"],
    Space: ["galaxy", "planet", "comet", "nebula", "asteroid"],
    Food: ["pizza", "sushi", "taco", "waffle", "burger"]
};
let fanfareSound = null;

function generateKeyboard(){
    for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++){
        const button = document.createElement("button");
        button.innerText = String.fromCharCode(i);
        keyboardContainer.appendChild(button);
        button.addEventListener("click", (e) => handleGuess(e.target.innerText));
    }
}

function handleGuess(letter){
    const buttons = keyboardContainer.querySelectorAll('button');
    for (let button of buttons){
        if (button.innerText === letter)
            button.disabled = true;
    }
    const word = currentWord.toLowerCase();
    letter = letter.toLowerCase();
    if (word.includes(letter)){
        playSound('correct');
        const chars = word.split('');
        chars.forEach((char, index) => {
            if (char === letter) {
                correctLetters.push(letter);
                const letterContainer = wordDisplay.querySelectorAll('.letter-container')[index];
                letterContainer.querySelector('.letter').innerText = letter;
                letterContainer.classList.add('revealed');
            }
        });
    }else{
        handleIncorrectGuess();
    }
    setTimeout(checkGameState, 500);
    updateHintButtonState();
}

function handleIncorrectGuess(){
    playSound('wrong');
    wrongGuessCount++;
    const hearts = document.querySelectorAll(".heart");
    if (hearts.length - wrongGuessCount >= 0) {
        hearts[hearts.length - wrongGuessCount].classList.add('grey');
    }
}

function checkGameState(){
    if (wrongGuessCount === maxGuesses){
        fanfareSound = playSound('lose');
        modalTitle.innerText = '🥀 Game Over! 🥀';
        modalMessage.innerHTML = `The correct word was: <br><b>${currentWord}</b>`;
        modal.classList.add('show');
    }
    if (correctLetters.length === currentWord.length){
        fanfareSound = playSound('win');
        modalTitle.innerText = '🎉 Congratulations! 🎉';
        modalMessage.innerHTML = `You guessed the word: <br><b>${currentWord}</b>`;
        modal.classList.add('show');
    }
}

function getRandomWord(){
    const themes = Object.keys(wordPacks);
    const randomTheme = themes[Math.floor(Math.random()*themes.length)];
    const wordsInTheme = wordPacks[randomTheme];
    const randomWord = wordsInTheme[Math.floor(Math.random()*wordsInTheme.length)];
    currentWord = randomWord;
    themeText.innerText = randomTheme;
    resetGame();
}

function resetGame(){
    correctLetters = [];
    wrongGuessCount = 0;
    wordDisplay.innerHTML = currentWord.split("").map(() => `
    <div class="letter-container">
        <span class="letter"></span>
        <div class="underline"></div>
    </div>
    `).join("");
    heartsContainer.innerHTML = '';
    for (let i = 0; i < maxGuesses; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.innerHTML = '&#x2764;'; // Heart character
        heartsContainer.appendChild(heart);
    }
    const buttons = keyboardContainer.querySelectorAll("button")
    for (let button of buttons){
        button.disabled = false;
    }
    modal.classList.remove('show');
    updateHintButtonState();
}

function giveHint() {
    handleIncorrectGuess(); // Using a hint costs one life

    const unrevealedLetters = [];
    currentWord.split('').forEach((letter, index) => {
        if (!correctLetters.includes(letter)) {
            unrevealedLetters.push({ letter, index });
        }
    });

    // Prioritize vowels
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    let hintLetters = unrevealedLetters.filter(item => vowels.includes(item.letter));

    if (hintLetters.length === 0) {
        // If no vowels are left, use any unrevealed letter
        hintLetters = unrevealedLetters;
    }

    if (hintLetters.length > 0) {
        const randomHint = hintLetters[Math.floor(Math.random() * hintLetters.length)];
        console.log(randomHint);

        const letter = randomHint.letter;
        for (let i = 0; i < currentWord.length; i++){
            if (currentWord[i] == letter){
                correctLetters.push(letter);
                const letterContainer = wordDisplay.querySelectorAll('.letter-container')[i];
                const letterSpan = letterContainer.querySelector('.letter');
                letterSpan.innerText = letter;
                letterSpan.classList.add('hint-revealed');
                letterContainer.classList.add('revealed');
            }
        }

        // Disable the keyboard button for the hinted letter
        const buttons = keyboardContainer.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.innerText.toLowerCase() === letter) {
                button.disabled = true;
            }
        });
    }

    updateHintButtonState();
};

function updateHintButtonState(){
    unrevealedCount = currentWord.length - correctLetters.length;
    if (wrongGuessCount >= maxGuesses - 1 || unrevealedCount <= 1){
        hintBtn.disabled = true;
    }else{
        hintBtn.disabled = false;
    }
}

playAgainBtn.addEventListener("click", () => {
    if (fanfareSound){
        fanfareSound.pause();
        fanfareSound.currentTime = 0;
        fanfareSound = null;
    }
    getRandomWord();
});

hintBtn.addEventListener("click", giveHint);

generateKeyboard();
getRandomWord();