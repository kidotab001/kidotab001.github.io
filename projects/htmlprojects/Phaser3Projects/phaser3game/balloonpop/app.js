// -------- GAME SCENES --------

class TitleScene extends Phaser.Scene {
    
    // This function is called when the scene is created.
    constructor() {
        super('TitleScene'); // Same as the class name
    }

    // This is where we load the assets
    preload(){
        this.load.image("background", "assets/background.png");
        
        // Loading the balloons with for loop 
        const balloonColors = ["red", "blue", "green", "yellow", "black"];
        for (let color of balloonColors){
        	let key = `balloon-${color}`;
        	let link = `assets/balloon_${color}.png`;
        	this.load.image(key, link);
        }

    }

    // This is where game objects and logic are set up.
    create() {
        // Add the background image
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background");
        // Add the title and start game button
        let titleText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 80, "Balloon Pop", { font: "48px Arial", fill: "#ffffff" });
        titleText.setOrigin(0.5);
        let startButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 80, "Start Game", { font: "32px Arial", fill: "#ffffff" });
        startButton.setOrigin(0.5);
        // Add Interactivity
        startButton.setInteractive();
        startButton.setAlpha(0.8);
        startButton.on("pointerdown", () => {
            this.scene.start("GameScene");
        });
        // When the mouse hovers over the button
        startButton.on('pointerover', () => {
            startButton.setAlpha(1);
            startButton.setStyle({ fill: '#ffff00' }); //Yellow
        });
        // When the mouse leaves the button
        startButton.on('pointerout', () => {
            startButton.setAlpha(0.8);
            startButton.setStyle({ fill: '#ffffff' }); //White
        });
        // Add High Score display
        let highScore = parseInt(localStorage.getItem('balloonPopHighScore')) || 0;
        let highScoreText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `High score: ${highScore}`, { font: "24px Arial", fill: "#ffffff" });
        highScoreText.setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    
    // This function is called when the scene is created.
    constructor() {
        super('GameScene'); // Same as the class name
    }

    // This is where game objects and logic are set up.
    create() {
        // Initialize game data
        this.score = 0;
        this.lives = 3;
        // Add the background image
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background");
        // Draw the UI labels
        const textStyle = {
            font: "24px Arial",
            fill: "#ffffff"
        }
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, textStyle);
        this.livesText = this.add.text(this.cameras.main.width - 20, 20, `Lives: ${this.lives}`, textStyle);
        this.livesText.setOrigin(1, 0);
        // Set Depth for UI Labels
        this.scoreText.setDepth(100);
        this.livesText.setDepth(100);
        // Create balloon group
        this.balloons = this.add.group();
        // Add spawn timer
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnBalloon,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnBalloon() {
        // List of balloon colors
        const balloonColors = ['balloon-red', 'balloon-blue', 'balloon-green', 'balloon-yellow','balloon-black'];
        // Create new balloon
        const newBalloon = this.add.sprite(0, 0, Phaser.Math.RND.pick(balloonColors));
        newBalloon.x = Phaser.Math.Between(newBalloon.width / 2, this.cameras.main.width - newBalloon.width / 2);
        newBalloon.y = this.cameras.main.height + newBalloon.height / 2;
        newBalloon.setData('speed', Phaser.Math.Between(30, 240));
        // Handle interaction
        const hitbox = new Phaser.Geom.Ellipse(40, 50, 80, 100);
        newBalloon.setInteractive({
            hitArea: hitbox,
            hitAreaCallback: Phaser.Geom.Ellipse.Contains,
            useHandCursor: true
        });
        newBalloon.on("pointerdown", () => {
            if (newBalloon.texture.key === 'balloon-black') {
                this.loseLife(); // Lose a life for popping the black one
            } else {
                this.gainScore(); // Gain a score for any other color
            }
            newBalloon.destroy();
        })
        // Add the new balloon to our balloons group
        this.balloons.add(newBalloon);
    }

    // Helper methods for updating game labels
    gainScore() {
        this.score += 1; // Increase the score variable by 1
        this.scoreText.setText(`Score: ${this.score}`); // Update the text on screen
    }

    loseLife() {
        this.lives -= 1; // Decrease the lives variable by 1
        this.livesText.setText(`Lives: ${this.lives}`); // Update the text on screen
                // Game Over logic
        if (this.lives <= 0){
            this.scene.start("GameOverScene", { score: this.score });
        }
    }

    // This method repeats itself until the scene stops
    update(timestamp, delta){
        for (let balloon of this.balloons.getChildren()) {
            // Make the balloon float up. We subtract from its y-position.
            // A smaller 'y' value is higher on the screen.
            balloon.y -= balloon.getData('speed') * delta / 1000;
            // Remove the balloon if it is off screen
            if (balloon.y < -(balloon.height / 2)){
                 // Check if the escaping balloon is NOT black
                if (balloon.texture.key !== 'balloon-black') {
                    this.loseLife(); // Lose life if good balloon escaped
                }
                // Destroy the balloon
                balloon.destroy();
            }
        }
    }
}

class GameOverScene extends Phaser.Scene {

    // This function is called when the scene is created.
    constructor() {
        super('GameOverScene'); // Same as the class name
    }

    // Receive data from the previous scene
    init(data){
        this.score = data.score;
        // Load high score 
        this.highScore = parseInt(localStorage.getItem('balloonPopHighScore')) || 0;
        // Save high score
        if (this.score > this.highScore){
            this.highScore = this.score;
            localStorage.setItem('balloonPopHighScore', this.highScore);
        }
    }

    // This is where game objects and logic are set up.
    create() {
        // Add the background image
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background");
        // Add the Game Over text
        let gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "Game Over", { font: "48px Arial", fill: "#ffffff" });
        gameOverText.setOrigin(0.5);
        let scoreText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 20, `Your score: ${this.score}`, { font: "24px Arial", fill: "#ffffff" });
        scoreText.setOrigin(0.5);
        let highScoreText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 20, `High score: ${this.highScore}`, { font: "24px Arial", fill: "#ffffff" });
        highScoreText.setOrigin(0.5);
        // Add the Restart button
        let restartButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 120, "Play Again", { font: "32px Arial", fill: "#ffffff" });
        restartButton.setOrigin(0.5);
        // Add Interactivity
        restartButton.setInteractive();
        restartButton.setAlpha(0.8);
        restartButton.on("pointerdown", () => {
            this.scene.start("GameScene");
        });
        // When the mouse hovers over the button
        restartButton.on('pointerover', () => {
            restartButton.setAlpha(1);
            restartButton.setStyle({ fill: '#ffff00' }); //Yellow
        });
        // When the mouse leaves the button
        restartButton.on('pointerout', () => {
            restartButton.setAlpha(0.8);
            restartButton.setStyle({ fill: '#ffffff' }); //White
        });
    }
}

// -------- GAME CONFIG --------

// The config object contains all the settings for our game.
const config = {
    // The type of renderer to use. AUTO lets Phaser decide (WebGL or Canvas).
    type: Phaser.AUTO,
    
    // The native (internal) resolution of your game.
    width: 480,
    height: 640,

    // The initial background color.
    backgroundColor: '#151B54', // night blue
    
    // This tells Phaser where to put the game canvas in the HTML.
    parent: 'game-container', // element with id of game-container

    // This is the modern way to handle scaling. We let our CSS file do the work.
    scale: {
        mode: Phaser.Scale.NONE, // Disable Phaser's automatic scaling.
        autoCenter: Phaser.Scale.NO_CENTER // Disable Phaser's automatic centering.
    },
    
    // An array containing all the scenes in our game.
    scene: [TitleScene, GameScene, GameOverScene]
};

// -------- CREATE GAME --------

// Create the actual Phaser game object, starting the whole process.
const game = new Phaser.Game(config);
