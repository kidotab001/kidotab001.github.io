let randomNumber = Math.floor(Math.random() * 100) + 1;

const guesses = document.querySelector('.guesses');
const lastResult = document.querySelector('.lastResult');

const guessSubmit = document.querySelector('.guessSubmit');
const guessField = document.querySelector('.guessField');
const restartGameBtn = document.querySelector('#restartGame');

let guessesLeft = 5;

function checkGuess() {
  const userGuess = Number(guessField.value);

  if (userGuess === randomNumber) {
    lastResult.textContent = 'Congratulations! You got it right!';
    setGameOver();
  } else if (guessesLeft === 1) {
    lastResult.textContent = '!!!GAME OVER!!! The correct number was ' + randomNumber;
    setGameOver();
  } else {
    lastResult.textContent = 'Wrong! Your guess was ' + (userGuess < randomNumber ? 'too low.' : 'too high.');
  }

  guessesLeft = guessesLeft - 1;
  // Make sure guessesLeft doesn't go below 0 for display purposes
  if (guessesLeft < 0) {
      guessesLeft = 0;
  }
  guesses.textContent = guessesLeft;

  guessField.value = '';
  guessField.focus();
}

guessSubmit.addEventListener('click', checkGuess);

function setGameOver() {
  guessField.disabled = true;
  guessSubmit.disabled = true;
  restartGameBtn.style.display = 'inline-block';
  restartGameBtn.addEventListener('click', restartGame);
}

function restartGame() {
  guessesLeft = 5;

  lastResult.textContent = '';
  guesses.textContent = guessesLeft;

  guessField.disabled = false;
  guessSubmit.disabled = false;
  guessField.value = '';
  guessField.focus();

  restartGameBtn.style.display = 'none';

  randomNumber = Math.floor(Math.random() * 100) + 1;
}

// Hide the restart button on initial load
restartGameBtn.style.display = 'none';
