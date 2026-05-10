// -------- GAME SCENES --------

class BootScene extends Phaser.Scene {

    constructor() {
        super('BootScene');
    }

    preload(){
        // Load the background image that the LoadScene will use.
        // We give it a new key: "background-load"
        this.load.image("background-load", "assets/img/bg_load.png");
    }

	create() {
	    // Immediately start the next scene
        this.scene.start("LoadScene");
	}
}

class LoadScene extends Phaser.Scene {
    
    constructor() {
        super('LoadScene');
    }

    preload(){
        // Display the background image loaded in BootScene
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background-load");

        // Add the "Loading..." text to the center of the screen
        let loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "Loading...", { font: "48px Arial", fill: "#ffffff" });
        loadingText.setOrigin(0.5);

        // --- CREATE THE LOADING BAR ---
        // Define bar dimensions and position
        const barWidth = 400;
        const barHeight = 30;
        const barX = this.cameras.main.centerX - (barWidth / 2);
        const barY = this.cameras.main.height - 80;

        // Create the bar background/border
        let barBackground = this.add.rectangle(barX, barY, barWidth, barHeight, 0x111111);
        barBackground.setOrigin(0, 0.5); // Anchor to the left-center

        // Create the progress bar itself (the fill)
        let progressBar = this.add.rectangle(barX, barY, 0, barHeight, 0xffffff); // Start with 0 width
        progressBar.setOrigin(0, 0.5); // Anchor to the left-center

        // --- LISTEN FOR 'PROGRESS' EVENT ---
        // This event fires for each file loaded. 'value' is a number from 0 to 1.
        this.load.on('progress', (value) => {
            // Convert the value to a whole number percentage
            let percentage = Math.floor(value * 100);
            // Update the text
            loadingText.setText(`Loading... (${percentage}%)`);
            // Update the progress bar
            progressBar.width = barWidth * value;
        });

        // Load the background images
        const bgNames = ["title", "game", "gameover"];
        for (let name of bgNames){
        	this.load.image(`background-${name}`, `assets/img/bg_${name}.png`);
        }
        // Load the Ball
        this.load.image("ball", "assets/img/ball.png");
		// Load the Paddle
		this.load.image("paddle", "assets/img/paddle.png");
		// Load the Bricks
		const brickTypes = ["red", "yellow", "green", "cyan", "blue", "purple", "white", "black"]
		for (let i = 0; i < brickTypes.length; i++){
			this.load.image(`brick-${brickTypes[i]}`, `assets/img/brick${i}.png`);	
		}
		// Load game audio
		const bgmNames = ["music", "title-music", "game-over-music"]
		const sfxNames = ["brick", "game-over", "launch", "lose-life", "paddle", "wall", "boost", "pickup"];
		for (let name of bgmNames){
			this.load.audio(`bgm-${name}`, `assets/audio/${name}.mp3`);
		}
		for (let name of sfxNames){
			this.load.audio(`sfx-${name}`, `assets/audio/${name}.mp3`);
		}
        // Load the Brick Data
        this.load.json('brickData', 'assets/brick_data.json');

        // Load the Level Data
        this.load.json('levelData', 'assets/level_data.json');

        // Load the Power-Up images
        const powerupTypes = ["barrier", "length", "life", "multi", "point", "power", "slow"];
        for (let type of powerupTypes) {
            // The key will be 'powerup-barrier', 'powerup-length', etc.
            // The file name will be 'powerup_barrier.png', 'powerup_length.png', etc.
            this.load.image(`powerup-${type}`, `assets/img/powerup_${type}.png`);
        }

        // --- SET UP 'COMPLETE' EVENT ---
        // Listen for the 'complete' event, which fires when all assets are loaded
        this.load.on('complete', () => {
            // Update the Loading text
            loadingText.text = "Load Complete!";

            // --- REMOVE THE LOADING BAR ---
            progressBar.destroy();
            barBackground.destroy();

            // Create the "Run Game" button
            let runButton = this.add.text(this.cameras.main.centerX, this.cameras.main.height - 80, "Run Game", { font: "32px Arial", fill: "#ffffff" });
            runButton.setOrigin(0.5);

            // Add interactivity to the button
            runButton.setInteractive();
            runButton.setAlpha(0.8);

            runButton.on("pointerdown", () => {
                this.scene.start("TitleScene");
            });

            runButton.on('pointerover', () => {
                runButton.setAlpha(1);
                runButton.setStyle({ fill: '#ffff00' }); // Yellow
            });

            runButton.on('pointerout', () => {
                runButton.setAlpha(0.8);
                runButton.setStyle({ fill: '#ffffff' }); // White
            });
        });
    }

	create() {
	    
	}
}

class TitleScene extends Phaser.Scene {
    
    // This function is called when the scene is created.
    constructor() {
        super('TitleScene'); // Same as the class name
    }

    // This is where game objects and logic are set up.
	create() {
	    // Stop all sounds from the previous scene (like the BGM)
        this.sound.stopAll();
        // Create and configure the background music
        this.music = this.sound.add('bgm-title-music', {
            loop: true,  // This will make the music repeat
            volume: 0.8 // This sets the volume to 80%
        });

        // Play the music
        this.music.play();
		// Add the background image
		this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background-title");
		// Add the title and start game button
		let titleText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 80, "Brick Breaker", { font: "48px Arial", fill: "#ffffff" });
		titleText.setOrigin(0.5);
		let startButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 80, "Click to Start", { font: "32px Arial", fill: "#ffffff" });
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
		let highScore = parseInt(localStorage.getItem('brickBreakerHighScore')) || 0;
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
        this.gameState = {
            score: 0,
            lives: 3,
            stage: 1,
            activePowerup: null,         // What power-up is active? (e.g., 'slow')
            powerupBounceCounter: 0      // How many bounces are left for the effect?
        };
        // Stop all sounds from the previous scene (like the BGM)
        this.sound.stopAll();

        // Create and configure the background music
        this.music = this.sound.add('bgm-music', {
            loop: true,  // This will make the music repeat
            volume: 0.6  // This sets the volume to 60%
        });

        // Play the music
        this.music.play();

        // Add game background
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background-game");
        // Add UI labels
        const textStyle = {
            font: "24px Arial",
            fill: "#ffffff"
        }
        this.scoreText = this.add.text(20, 20, `Score: ${this.gameState.score}`, textStyle);
        this.livesText = this.add.text(this.cameras.main.width - 20, 20, `Lives: ${this.gameState.lives}`, textStyle);
        this.livesText.setOrigin(1, 0); // Pins the text to the top-right
        // Set Depth of UI Labels
        this.scoreText.setDepth(100);
        this.livesText.setDepth(100);

        this.stageText = this.add.text(this.cameras.main.centerX, 20, `Stage ${this.gameState.stage}`, textStyle);
        this.stageText.setOrigin(0.5, 0); // Anchor the text to its top-center
        this.stageText.setDepth(100);     // Make sure it's on top of everything
                
        // Add an invisible gutter at the bottom of the screen
        this.gutter = this.physics.add.staticImage(this.cameras.main.centerX, this.cameras.main.height + 10, 'paddle');
        // Make the gutter invisible so the player doesn't see it
        this.gutter.setVisible(false);
        // Make its physics body wide enough to cover the whole screen width
        this.gutter.setSize(this.cameras.main.width, 20);

        // Add the barrier at the bottom of the screen
        this.barrier = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.height - 5, this.cameras.main.width, 10, 0x00ffff);
        this.physics.add.existing(this.barrier);
        this.barrier.body.setImmovable();
        // Hide and disable the barrier at start
        this.barrier.setVisible(false);
        this.barrier.body.setEnable(false);

        // Create a static group to hold all our bricks
        this.bricks = this.physics.add.staticGroup();
        // Create a group to hold all our power-ups
        this.powerups = this.physics.add.group();
        // A list of all available power-up types we can spawn
        this.powerupTypes = ["barrier", "length", "life", "multi", "point", "power", "slow"];

        // Create a group to hold all our balls
        this.balls = this.physics.add.group();
        // Create the very first ball and add it to the group
        const firstBall = new Ball(this, this.cameras.main.centerX, this.cameras.main.height / 4 * 3);
        this.balls.add(firstBall);
        firstBall.activate();

        // Create the Paddle using our new blueprint!
        this.paddle = new Paddle(this, this.cameras.main.centerX, this.cameras.main.height - 50);
        this.paddle.activate(); // Activate the physics properties

        // Make Paddle Movable by telling our smart paddle to update itself
        this.input.on('pointermove', (pointer) => {
            this.paddle.updatePosition(pointer, this.balls.getFirstAlive());
        });
        
        // Listen for a click or tap release to launch the ball
        // There is a 0.2 second delay
        this.time.delayedCall(200, () => {
            this.input.on('pointerup', () => {
                this.balls.getFirstAlive().launch();
            });
        }, null, this);
        
        // This sets collision for each wall: (left, right, top, bottom)
        // We set the bottom wall to 'false' so the ball can fall through.
        this.physics.world.setBoundsCollision(true, true, true, false);

        // --- Add Bricks using the Level Map ---
        this.buildLevel();
        // Set the ball's initial state
        this.balls.getFirstAlive().reset();
        // Collider for when power-ups are missed and hit the bottom gutter
        this.physics.add.collider(this.gutter, this.powerups, (gutter, powerup) => {
            powerup.destroy();
        }, null, this);
    }

    // Helper methods for updating game labels
    gainScore(points) {
        this.gameState.score += points;
        this.scoreText.setText(`Score: ${this.gameState.score}`);
    }

    loseLife() {
        this.deactivatePowerup();
        this.gameState.lives -= 1;
        this.livesText.setText(`Lives: ${this.gameState.lives}`);
        
        // Game Over logic
        if (this.gameState.lives <= 0) {
            this.scene.start("GameOverScene", { score: this.gameState.score });
        } else {
            // If the game is not over, create a new ball to launch
            const newBall = new Ball(this, this.paddle.x, this.paddle.y - this.paddle.height)
            this.balls.add(newBall);
            newBall.activate();
            newBall.reset();
        }
    }
    
    checkLevel() {
        const brickData = this.cache.json.get('brickData');
        // Get an array of all bricks that are still active in the group
        const activeBricks = this.bricks.getMatching('active', true);

        // Filter the active bricks to find only the ones that are destructible.
        // A brick is destructible if its original health was not 0.
        const destructibleBricks = activeBricks.filter(brick => {
            return brickData[brick.brickId].health !== 0;
        });

        // If the number of destructible bricks left is 0, the level is clear!
        if (destructibleBricks.length === 0) {
            // Level is clear! Let's progress.
            this.gameState.stage++; // Increase the stage number
            this.stageText.setText(`Stage ${this.gameState.stage}`);
            if (this.balls.countActive(true) === 1) {
                const lastBall = this.balls.getFirstAlive();
                lastBall.reset();
            }
            this.buildLevel();      // Build the next level!
        }
    }

    // Build Level
    buildLevel(){
        this.bricks.clear(true, true);
        const brickWidth = 75; // Width of a single brick
        const brickHeight = 30; // Height of a single brick

        // Calculate the starting x and y position to center the whole grid
        const startX = brickWidth / 2 + (this.cameras.main.width - (brickWidth * 10)) / 2;
        const startY = brickHeight / 2 + brickHeight * 2; // Right below the UI labels

        // Loop through each ROW in our levelData
        const levelData = this.cache.json.get('levelData');
        const numberOfLevels = levelData.length;
        const stageLap = Math.floor((this.gameState.stage - 1) / numberOfLevels) + 1;
        // Use the stage from our gameState object!
        // We subtract 1 because stages are 1, 2, 3 but array indexes are 0, 1, 2.
        const levelIndex = (this.gameState.stage - 1) % levelData.length;
        const currentLevel = levelData[levelIndex];
        
        for (let j = 0; j < currentLevel.length; j++){
            let row = currentLevel[j];
            // Loop through each BRICK ID in the current row
            for (let i = 0; i < row.length; i++){
                let brickId = row[i];
                // Check if the brickId is not -1 (our code for an empty space)
                if (brickId !== -1) {
                    // Calculate the x and y position for this brick
                    const x = startX + i * brickWidth;
                    const y = startY + j * brickHeight;

                    // Create a new brick using its ID from the map
                    const brick = new Brick(this, x, y, brickId, stageLap);

                    // Add the new brick to our physics group
                    this.bricks.add(brick);
                }
            }
        }
    }

    spawnPowerup(x, y){
        // 1. Pick a random power-up type from the list
        const randomType = Phaser.Math.RND.pick(this.powerupTypes);
        // 2. Create a new power-up instance at the brick's position
        const powerup = new Powerup(this, x, y, randomType);
        // 3. Add the new power-up to our group
        this.powerups.add(powerup);
        // 4. Activate it to make it fall!
        powerup.activate();
    }

    gainLife() {
        this.gameState.lives += 1;
        this.livesText.setText(`Lives: ${this.gameState.lives}`);
    }

    activateSlowdown() {
        this.deactivatePowerup();
        // Set the active power-up type and its duration
        this.gameState.activePowerup = 'slow';
        this.gameState.powerupBounceCounter = 20;
    
        // Tint the ball blue to show the power-up is active
        // 0x00aaff is a hex code for a nice light blue color
        this.balls.children.iterate((ball) => {
            ball.setTint(0x00aaff);
        });
    }

    deactivatePowerup() {
        // Use a switch to handle deactivating any active power-up
        switch (this.gameState.activePowerup) {
            case 'slow':
                // Clear the tint from the ball
                this.balls.children.iterate((ball) => {
                    ball.clearTint();
                });
                break;
            case 'length':
                // Reset the paddle's scale back to its original size
                this.paddle.setScale(1);
                break;
            case 'power':    
                // Reset the ball's scale back to its original size
                this.balls.children.iterate((ball) => {
                    ball.setScale(1);
                });
                break;    
            case 'barrier':
                // Hide and disable the barrier
                this.barrier.setVisible(false);
                this.barrier.body.setEnable(false);    
        }
        // Set the active power-up back to null
        this.gameState.activePowerup = null;
    }

    activateLengthen() {
        // First, cancel any other power-up that might be active
        this.deactivatePowerup();
    
        // Set the active power-up type and its duration
        this.gameState.activePowerup = 'length';
        this.gameState.powerupBounceCounter = 20;
    
        // Change the paddle's scale to make it 1.5x wider
        this.paddle.setScale(1.5, 1);
    }

    activatePowerBall() {
        // First, cancel any other power-up that might be active
        this.deactivatePowerup();
    
        // Set the active power-up type and its short duration
        this.gameState.activePowerup = 'power';
        this.gameState.powerupBounceCounter = 10;
    
        // Increase the ball's size by 25%
        this.balls.children.iterate((ball) => {
            ball.setScale(1.25);
        });
    }

    activateBarrier() {
        // First, cancel any other power-up
        this.deactivatePowerup();
    
        // Set the active power-up type and its duration
        this.gameState.activePowerup = 'barrier';
        this.gameState.powerupBounceCounter = 20;
    
        // Enable the barrier
        this.barrier.setVisible(true);
        this.barrier.body.setEnable(true);
    }

    activateMultiBall() {
        // Launch two new balls from the paddle's position
        for (let i = 0; i < 2; i++) {
            const ball = new Ball(this, this.paddle.x, this.paddle.y - this.paddle.height);
            this.balls.add(ball);
            ball.activate();
    
            // Apply any currently active power-up effects to the new ball
            if (this.gameState.activePowerup === 'slow') ball.setTint(0x00aaff);
            if (this.gameState.activePowerup === 'power') ball.setScale(1.25);
            
            // Launch the balls in different directions
            const angleRange = (i === 0) ? [247.5, 270] : [270, 292.5]; // Left and Right
            const launchAngle = Phaser.Math.Between(angleRange[0], angleRange[1]);
            const initialSpeed = 350;
            this.physics.velocityFromAngle(launchAngle, initialSpeed, ball.body.velocity);
        }
    }

}

// -------- GAME OBJECTS -------

class Paddle extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        // Step 1: Run the original Sprite's constructor
        super(scene, x, y, 'paddle');
		
		// Step 2: Save the scene
		this.scene = scene;

        // Step 3: Add the Paddle to the scene and physics engine
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
    }

    activate(){
        // Set the paddle's physics properties
        this.setImmovable(true);
        this.setCollideWorldBounds(true);

        // Add collider between ball and paddle
        this.scene.physics.add.collider(this.scene.balls, this, this.hitPaddle, null, this);
        // Add a collider between the paddle and the power-ups group
        this.scene.physics.add.collider(this, this.scene.powerups, this.collectPowerup, null, this);
    }

    // Method to handle movement
    updatePosition(pointer, ball) {
        // Use Phaser's clamp function to keep the paddle on screen
        const minX = this.displayWidth / 2;
        const maxX = this.scene.physics.world.bounds.width - this.displayWidth / 2;
        this.x = Phaser.Math.Clamp(pointer.x, minX, maxX);

        // Also move the ball if it's "sticky"
        if (ball && ball.isSticky) {
            ball.x = this.x;
        }
    }

    // Callback for the ball-paddle collider
    hitPaddle(paddle, ball) {

        if (ball.isSticky) {
            return;
        }
        this.scene.sound.play('sfx-paddle');

        // --- SPEED LOGIC ---

        // 1. Remember the ball's horizontal direction BEFORE the bounce.
        const initialVelX = ball.body.velocity.x;

        // 2. Calculate the new angle
        let diff = (ball.x - paddle.x) / (paddle.width / 2);
        diff = Phaser.Math.Clamp(diff, -1, 1);
        let newAngleDeg = -90 + (diff * 75);
        const jitter = (Math.random() * 5) - 2.5;
        newAngleDeg += jitter;

        // 3. Determine the new horizontal direction from the angle.
        // Math.cos on the angle gives us the new direction (-1 for left, 1 for right).
        const newVelX = Math.cos(Phaser.Math.DegToRad(newAngleDeg));
        let speed = 350;
        if (this.scene.gameState.activePowerup !== 'slow') {
            // 4. Compare directions and adjust speed.
            speed = ball.body.velocity.length();
            // If the signs are different, it's a PUSH hit (e.g., was positive, now negative).
            if ( (initialVelX > 0 && newVelX < 0) || (initialVelX < 0 && newVelX > 0) ) {
                speed *= 1.10; // Increase speed by 10%
            } 
            // Otherwise, it's a REDIRECT hit.
            else {
                speed *= 0.95; // Reduce speed by 5%
            }
            // 5. Clamp the final speed to a min and max.
            speed = Phaser.Math.Clamp(speed, 350, 700);
        }
        // 6. Set the ball's new velocity using the final angle and speed.
        this.scene.physics.velocityFromAngle(newAngleDeg, speed, ball.body.velocity);

        // --- POWER-UP DURATION LOGIC ---
        // Check if any temporary power-up is active
        if (this.scene.gameState.activePowerup) {
            // Decrease the bounce counter
            this.scene.gameState.powerupBounceCounter--;

            // If the counter reaches zero, deactivate the power-up
            if (this.scene.gameState.powerupBounceCounter <= 0) {
                this.scene.deactivatePowerup();
            }
        }
    }

    // This method is called when the paddle collides with a power-up
    collectPowerup(paddle, powerup) {
        // Tell the power-up to run its activation logic
        powerup.getPowerup();
        // Remove the power-up from the game
        powerup.destroy();
    }

    activatePowerBall() {
        // First, cancel any other power-up that might be active
        this.deactivatePowerup();
    
        // Set the active power-up type and its short duration
        this.gameState.activePowerup = 'power';
        this.gameState.powerupBounceCounter = 5;
    
        // Increase the ball's size by 25%
        this.ball.setScale(1.25);
    }
}

class Ball extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y){
        // Run the original Sprite's constructor
        super(scene, x, y, 'ball');
        
        // Save the scene
        this.scene = scene;

        // Add the Ball to the scene and physics engine
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
    }

    activate(){
        // Set its physics properties
        this.setCollideWorldBounds(true);
        this.setBounce(1);
        this.setCircle(this.width / 2); // Use a circle hitbox

        // Listen for when the ball hits the world's boundaries
        this.body.onWorldBounds = true;
        this.scene.physics.world.on('worldbounds', (body) => {
            // We only want to play the sound for OUR ball.
            if (body.gameObject === this) {
                this.scene.sound.play('sfx-wall');
            }
        });

        // Collision between ball and gutter
        this.scene.physics.add.collider(this, this.scene.gutter, this.hitGutter, null, this);
        // Add collider between ball and the bricks group
        this.scene.physics.add.collider(this, this.scene.bricks, this.hitBrick, null, this);
        // Add collider between ball and the barrier
        this.scene.physics.add.collider(this, this.scene.barrier, this.hitBarrier, null, this);
    }

    hitGutter(ball, gutter) {
        // A ball is removed from the game when it hits the gutter
        // We check if this is the LAST ball
        if (this.scene.balls.countActive(true) === 1) {
            // If there are no balls left, THEN we lose a life and reset
            this.scene.sound.play('sfx-lose-life');
            this.scene.loseLife();
        }
        this.destroy(); // Destroy THIS ball
    }

    hitBrick(ball, brick) {
        // Check if the Power Ball is active
        if (this.scene.gameState.activePowerup === 'power') {
            // If so, deal a massive amount of damage to the brick!
            // This will destroy any destructible brick in one shot.
            if (brick.health > 0){ // Check if it is indestructible
                brick.health -= 1000000;
            }
        }
        // Now, run the brick's regular onHit logic. For destructible blocks, it will see its health
        // is below zero and destroy itself.
        brick.onHit();
    }

    reset() {
        // Stop the ball
        this.body.stop();
        // Tell the ball that it is "stuck" to the paddle
        this.isSticky = true;
        // Set the ball's position right on top of the paddle.
        // We need the paddle's position to do this.
        this.x = this.scene.paddle.x;
        this.y = this.scene.paddle.y - this.scene.paddle.height / 2 - this.height / 2 - 5;
    }
    
    launch() {
        // We only want to launch the ball if it's currently sticky
        if (this.isSticky) {
            // First, change the sticky property to false
            this.isSticky = false;
    
            // Now, give the ball its launching speed and angle
            const initialSpeed = 350;
            const launchAngle = Phaser.Math.Between(247.5, 292.5);
            this.scene.physics.velocityFromAngle(launchAngle, initialSpeed, this.body.velocity);
            
            // Play Sound
            this.scene.sound.play('sfx-launch');
        }
    }

    // This method is called when the ball hits our barrier
    hitBarrier(ball, barrier) {
        // Play sound to show the barrier has been used
        this.scene.sound.play('sfx-boost');
        // Immediately deactivate the power-up, which will destroy the barrier
        this.scene.deactivatePowerup();
    }
}

class Brick extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, brickId, stageLap){

        const brickData = scene.cache.json.get('brickData');

        // Look up the brick's data from our palette
        const data = brickData[brickId];

        // Run the original Sprite's constructor using the texture from the palette
        super(scene, x, y, data.texture);
        
        // Save the scene
        this.scene = scene;

        // Store the properties from the palette in the brick itself
        // Get the base values from the data
        const baseHealth = data.health;
        const baseScore = data.score;

        // --- Calculate final health and score based on the lap ---

        // Score is multiplied by the lap number (e.g., x2 on Lap 2)
        this.score = baseScore * stageLap;

        // Health increases by 1 for each lap after the first.
        // Indestructible bricks (health 0) should not gain health.
        if (baseHealth > 0) {
            this.health = baseHealth + (stageLap - 1);
        } else {
            this.health = 0; // It remains indestructible
        }
        this.brickId = brickId;

        // Add the Brick to the scene
        this.scene.add.existing(this);
    }

    onHit() {
        // 1. Check if the brick is indestructible
        if (this.health === 0) {
            // Play a different sound for hitting an indestructible brick
            this.scene.sound.play('sfx-wall');
            return; // Exit the function early
        }

        // 2. Decrease the brick's health
        this.health -= 1;

        // 3. If the brick still has health, it's been damaged but not destroyed
        if (this.health > 0) {
            // Play the "crack" sound. We don't have it, so we will use the brick breaking sound.
            this.scene.sound.play('sfx-brick');
            // Optional: In the future, you could change the texture here to a cracked version!
            return; // Exit the function
        }

        // 4. If we reach here, the brick's health is 0, so destroy it
        // Play the final breaking sound effect
        this.scene.sound.play('sfx-brick');
        // Hide the brick and disable its physics body
        this.disableBody(true, true);

        // Tell the scene that the score increased, passing the brick's specific score
        this.scene.gainScore(this.score);
        
        if (Math.random() < 0.2) {
            this.scene.spawnPowerup(this.x, this.y);
        }

        // Check if all bricks are gone
        this.scene.checkLevel();
    }
}

class Powerup extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, powerupType){
        // Run the original Sprite's constructor
        super(scene, x, y, `powerup-${powerupType}`);
        
        // Save the Power-up Type
        this.powerupType = powerupType;
        
        // Save the scene
        this.scene = scene;
    
        // Add the sprite to the scene and physics engine
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
    }

    activate(){
        this.scene.physics.velocityFromAngle(90, 150, this.body.velocity);
    }

    getPowerup() {
        // Use a switch to handle different power-up types
        switch (this.powerupType) {
            case 'point':
                // Give the player 100 points
                this.scene.gainScore(100);
                this.scene.sound.play('sfx-pickup');
                break;
            case 'life':
                // Give the player an extra life
                this.scene.gainLife();
                this.scene.sound.play('sfx-pickup');
                break;
            case 'slow':
                this.scene.activateSlowdown();
                this.scene.sound.play('sfx-boost');
                break;    
            case 'length':
                this.scene.activateLengthen();
                this.scene.sound.play('sfx-boost');
                break;    
            case 'power':
                this.scene.activatePowerBall();
                this.scene.sound.play('sfx-boost');
                break;    
            case 'barrier':
                this.scene.activateBarrier();
                this.scene.sound.play('sfx-boost');
                break;    
            case 'multi':
                this.scene.activateMultiBall();
                this.scene.sound.play('sfx-pickup');
                break;    
            default:
                break;
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
        this.highScore = parseInt(localStorage.getItem('brickBreakerHighScore')) || 0;
        // Save high score
        if (this.score > this.highScore){
            this.highScore = this.score;
            localStorage.setItem('brickBreakerHighScore', this.highScore);
        }
    }

    // This is where game objects and logic are set up.
    create() {
        // Stop all sounds from the previous scene (like the BGM)
        this.sound.stopAll();
        // Create and configure the background music
        this.music = this.sound.add('bgm-game-over-music', {
            loop: true,  // This will make the music repeat
            volume: 0.6  // This sets the volume to 60%
        });

        // Play the music
        this.music.play(); 
        // Now play the game over sound
        this.sound.play('sfx-game-over');
        // Add the background image
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background-gameover");
        // Add the Game Over text
        let gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100,
             "Game Over", { font: "48px Arial", fill: "#ffffff" });
        gameOverText.setOrigin(0.5);
        let scoreText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 20,
             `Your score: ${this.score}`, { font: "24px Arial", fill: "#ffffff" });
        scoreText.setOrigin(0.5);
        let highScoreText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 20,
             `High score: ${this.highScore}`, { font: "24px Arial", fill: "#ffffff" });
        highScoreText.setOrigin(0.5);
        // Add the Restart button
        let restartButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 120,
             "Play Again", { font: "32px Arial", fill: "#ffffff" });
        restartButton.setOrigin(0.5);
        // Add Interactivity
        restartButton.setInteractive();
        restartButton.setAlpha(0.8);
        restartButton.on("pointerdown", () => {
            this.scene.start("TitleScene");
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
    width: 800,
    height: 600,

    // The initial background color.
    backgroundColor: '#000000', // black
    
    // This tells Phaser where to put the game canvas in the HTML.
    parent: 'game-container', // element with id of game-container

    // This turns on the Arcade Physics engine for our game.
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 } // We don't need gravity for this game.
        }
    },

    // This is the modern way to handle scaling. We let our CSS file do the work.
    scale: {
        mode: Phaser.Scale.NONE, // Disable Phaser's automatic scaling.
        autoCenter: Phaser.Scale.NO_CENTER // Disable Phaser's automatic centering.
    },
    
    // An array containing all the scenes in our game.
    scene: [BootScene, LoadScene, TitleScene, GameScene, GameOverScene]
};

// -------- CREATE GAME --------

// Create the actual Phaser game object, starting the whole process.

const game = new Phaser.Game(config);