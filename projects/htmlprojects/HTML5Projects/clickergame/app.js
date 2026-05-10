let lastTime = 0;

// This object holds the PLAYER'S PROGRESS. This is what we will save.
let gameState = {
  score: 0,
  // We start with an EMPTY object. We'll add levels here only when
  // the player buys an upgrade for the first time.
  upgradeLevels: {}
};

// This object now holds the GAME'S RULES. It will not be saved.
// We use 'const' because this data should not change during gameplay.
const gameData = {
  upgrades: [
    {
      name: 'Stronger Clicks',
      id: 'strongerClicks',
      baseCost: 10,
      creep: 1.15,
      addBonus: 1,
      multBonus: 0,
      cpsAddBonus: 0,
      cpsMultBonus: 0,
    },
    {
      name: 'Click Multiplier',
      id: 'clickMultiplier',
      baseCost: 100,
      creep: 1.5,
      addBonus: 0,
      multBonus: 0.1,
      cpsAddBonus: 0,
      cpsMultBonus: 0,
    },
    {
      name: 'Grandma',
      id: 'grandma',
      baseCost: 50,
      creep: 1.2,
      addBonus: 0,
      multBonus: 0,
      cpsAddBonus: 1,
      cpsMultBonus: 0,
    },
    {
      name: 'Factory',
      id: 'factory',
      baseCost: 500,
      creep: 1.6,
      addBonus: 0,
      multBonus: 0,
      cpsAddBonus: 0,
      cpsMultBonus: 0.05,
    }
  ]
};

// --- Element Selectors ---
const notification = document.querySelector('#notification');
const saveNotification = document.querySelector('#save-notification');
const cpcDisplay = document.querySelector('#cpc-display');
const cpsDisplay = document.querySelector('#cps-display');
const scoreDisplay = document.querySelector('#score-display');
const clickerButton = document.querySelector('#clicker-button');
const storeContainer = document.querySelector('#upgrade-store');
const exportButton = document.querySelector('#export-button');
const importButton = document.querySelector('#import-button');


// --- Game State Variables ---
let totalCPC = 0;
let totalCPS = 0;

// --- Core Game Functions ---

function increaseScore() {
  gameState.score += totalCPC;
  scoreDisplay.textContent = Math.floor(gameState.score);
}

function renderUpgrades() {
  storeContainer.innerHTML = '';
  for (const upgrade of gameData.upgrades) {
    let currentLevel = gameState.upgradeLevels[upgrade.id] ?? 0;
    let currentCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.creep, currentLevel));
    const disabledStatus = gameState.score < currentCost ? 'disabled' : '';

    const upgradeButton = `
      <button class="upgrade-button" data-id="${upgrade.id}" ${disabledStatus}>
        ${upgrade.name} (Level ${currentLevel}) <br>
        Cost: ${currentCost}
      </button>
    `;
    storeContainer.innerHTML += upgradeButton;
  }
}

function showNotification(message) {
  notification.textContent = message;
  notification.classList.remove('hidden');
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 2000);
}

function showSaveNotification(message) {
  saveNotification.textContent = message;
  saveNotification.classList.remove('hidden');
  setTimeout(() => {
    saveNotification.classList.add('hidden');
  }, 2500);
}

function updateUpgradeButtons() {
  const upgradeButtons = document.querySelectorAll('.upgrade-button');
  for (const button of upgradeButtons) {
    const upgradeId = button.dataset.id;
    const upgradeData = gameData.upgrades.find(u => u.id === upgradeId);
    const currentLevel = gameState.upgradeLevels[upgradeData.id] ?? 0;
    const currentCost = Math.floor(upgradeData.baseCost * Math.pow(upgradeData.creep, currentLevel));

    if (gameState.score < currentCost) {
      button.disabled = true;
    } else {
      button.disabled = false;
    }
  }
}

// --- Save and Load Functions ---

function saveGame() {
  localStorage.setItem('myIdleGameSave', JSON.stringify(gameState));
  showSaveNotification('Game Saved!');
}

function loadGame() {
  const savedGame = localStorage.getItem('myIdleGameSave');
  if (savedGame) {
    gameState = JSON.parse(savedGame);
  }
}

function exportGame() {
  const jsonString = JSON.stringify(gameState);
  const base64String = btoa(jsonString);

  navigator.clipboard.writeText(base64String).then(() => {
    showSaveNotification("Save code copied to clipboard!");
  }).catch(err => {
    console.error('Could not copy text: ', err);
    showSaveNotification("Failed to copy save code.");
  });
}

function importGame() {
  const saveCode = prompt("Please paste your save code below:");

  if (saveCode) {
    try {
      const jsonString = atob(saveCode);
      const loadedState = JSON.parse(jsonString);
      
      gameState = loadedState;

      renderUpgrades();
      scoreDisplay.textContent = Math.floor(gameState.score);
      
      showSaveNotification("Game loaded successfully!");
    } catch (error) {
      console.error("Failed to import save:", error);
      showSaveNotification("Error: Invalid or corrupt save code!");
    }
  }
}

// --- Event Listeners ---

clickerButton.addEventListener('click', increaseScore);

storeContainer.addEventListener('click', function(event) {
  const clickedButton = event.target.closest('.upgrade-button');
  if (!clickedButton) {
    return;
  }

  const upgradeId = clickedButton.dataset.id;
  const upgrade = gameData.upgrades.find(u => u.id === upgradeId);
  let currentLevel = gameState.upgradeLevels[upgradeId] ?? 0;
  let currentCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.creep, currentLevel));

  if (gameState.score >= currentCost) {
    gameState.score -= currentCost;
    gameState.upgradeLevels[upgradeId] = currentLevel + 1;
    showNotification(`${upgrade.name} is now Level ${gameState.upgradeLevels[upgradeId]}!`);
    scoreDisplay.textContent = Math.floor(gameState.score);
    renderUpgrades();
  }
});

exportButton.addEventListener('click', exportGame);
importButton.addEventListener('click', importGame);

// --- Game Initialization and Loops ---

// Load saved data as soon as the script starts
loadGame();
// Initial render of the store on page load
renderUpgrades();

// The main game logic loop (the "brain"), running 10x per second
setInterval(() => {
  let totalAdditiveBonus = 0;
  let totalMultiplicativeBonus = 1;
  let totalCpsAddBonus = 0;
  let totalCpsMultBonus = 1;

  for (const upgrade of gameData.upgrades) {
    const currentLevel = gameState.upgradeLevels[upgrade.id] ?? 0;
    totalAdditiveBonus += upgrade.addBonus * currentLevel;
    totalMultiplicativeBonus += upgrade.multBonus * currentLevel;
    totalCpsAddBonus += upgrade.cpsAddBonus * currentLevel;
    totalCpsMultBonus += upgrade.cpsMultBonus * currentLevel;
  }

  totalCPC = (1 + totalAdditiveBonus) * totalMultiplicativeBonus;
  totalCPS = totalCpsAddBonus * totalCpsMultBonus;
}, 100);

// The main rendering loop (the "face")
function gameLoop(currentTime) {
  if (lastTime === 0) {
    lastTime = currentTime;
  }
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  gameState.score += totalCPS * deltaTime;

  scoreDisplay.textContent = Math.floor(gameState.score);
  cpcDisplay.textContent = totalCPC.toFixed(2);
  cpsDisplay.textContent = totalCPS.toFixed(2);
  
  updateUpgradeButtons();
  
  requestAnimationFrame(gameLoop);
}

// --- Start the game loops ---

// Autosave every 30 seconds (30000 milliseconds)
setInterval(saveGame, 30000);

// Start the rendering loop!
requestAnimationFrame(gameLoop);
