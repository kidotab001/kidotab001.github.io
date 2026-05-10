// -------- GAME SCENES --------

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.setBaseURL('assets');
        this.load.spritesheet('player', 'player.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.image('background', 'parallax/11_background.png');
        this.load.image('clouds', 'parallax/07_huge_clouds.png');
        this.load.image('hill', 'parallax/05_hill1.png');
        this.load.image('trees', 'parallax/02_trees and bushes.png');
        this.load.image('platform', 'platform.png');
        this.load.spritesheet('coin', 'coin.png', {
            frameWidth: 20,
            frameHeight: 20
        });
    }

    create() {
        
        // Add the static sky image.
        // We set its origin to (0, 0) so it aligns to the top-left corner.
        this.add.image(0, 0, 'background').setOrigin(0, 0);
        
        // Add the cloud layer as a TileSprite.
        // It fills the whole screen (800x600) and also has its origin at (0,0).
        // We also use setTileScale to adjust the size of the tiles.
        this.cloud = this.add.tileSprite(0, 0, 800, 600, 'clouds');
        this.cloud.setOrigin(0, 0);
        this.cloud.setTileScale(800/2048, 600/1546);
        
        this.hill = this.add.tileSprite(0, 0, 800, 600, 'hill');
        this.hill.setOrigin(0, 0);
        this.hill.setTileScale(800/2048, 600/1546);
        
        this.trees = this.add.tileSprite(0, 0, 800, 600, 'trees');
        this.trees.setOrigin(0, 0);
        this.trees.setTileScale(800/2048, 600/1546);

        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.scale = 2;
       
        // Create the 'run' animation
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 44, end: 54 }),
            frameRate: 15,
            repeat: -1
        });
        // Create the 'spin' animation for coins
        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 8 }),
            frameRate: 10,
            repeat: -1 // -1 means loop forever
        });
        
        // Play the 'run' animation on the player sprite
        this.player.play('run', true);
        // Create a group for coins
        this.coinGroup = this.physics.add.group({ allowGravity: false });
        // Create the group
        this.groundGroup = this.physics.add.group({allowGravity: false});

        // Create platforms using a loop
        for (let i = 0; i < 15; i++) {
            // The x position is the block index times the block's width (48)
            // The y position is at the bottom of the screen
            let platform = this.groundGroup.create(i * 48, 570, 'platform');
            platform.setScale(48/128); // Scale the block to 48x48 pixels
            platform.setImmovable(true);
            platform.setVelocity(-180, 0);
        }

        // Add a collider between the player and the ground
        this.physics.add.collider(this.player, this.groundGroup);
        this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
        // Set Hitbox of Player 
        this.player.body.setSize(16, 40);
        this.player.body.setOffset(24, 24);
    
        // Create the 'jump' animation
        this.anims.create({
             key: 'jump',
             frames: this.anims.generateFrameNumbers('player', { start: 80, end: 84 }),
             frameRate: 10,
             repeat: 0 // Don't repeat the jump animation
        });
        // Listen for a click or tap to trigger the jump
        this.input.on('pointerdown', () => {
             // Check if the player is on the ground
             if (this.player.body.touching.down) {
                  // Give the player an upward velocity
                  this.player.setVelocityY(-500);
                  // Play the jump animation
                  this.player.play('jump', true);
             }
        });
        // Spawn the first random platform to kick things off
        this.spawnPlatform();
    }
    
    update(){
        // Check if player has fallen off the screen
        if (this.player.y > 900) {
        	this.scene.restart();
        }
        this.cloud.tilePositionX += 0.5;
        this.hill.tilePositionX += 1.0;
        this.trees.tilePositionX += 2.0;
        if (this.player.body.touching.down) {
             this.player.play('run', true);
        }
        const rightmostX = this.getRightmostPlatformX();
        if (rightmostX < this.sys.game.config.width) {
             this.spawnPlatform();
        }
        // Loop through all children of the ground group
    	this.groundGroup.getChildren().forEach(platform => {
            // Check if the platform is off-screen to the left
            if (platform.x < -platform.displayWidth) {
                // If it is, put it back in the pool
                platform.setActive(false);
                platform.setVisible(false);
            }
	    });
	    // Loop through all children of the coin group
    	this.coinGroup.getChildren().forEach(coin => {
         	// Check if the coin is off-screen to the left
         	if (coin.x < -coin.displayWidth) {
              	// If it is, put it back in the pool
              	coin.setActive(false);
              	coin.setVisible(false);
         	}
    	});
    }
    
    spawnPlatform() {
        const platformLength = Phaser.Math.Between(4, 8);
        const platformY = Phaser.Math.Between(450, 570);
        const gap = Phaser.Math.Between(100, 200);
    
        // USE our new helper function to find the rightmost platform
        const rightmostX = this.getRightmostPlatformX();
    
        // Calculate the starting x position for the new platform
        const nextPlatformX = rightmostX + 48 + gap;
    
        // Create the new platform using a loop
        for (let i = 0; i < platformLength; i++) {
            // Use get() instead of create()
            let platform = this.groundGroup.get(nextPlatformX + i * 48, platformY, 'platform');
        
            // Wake the platform up and set its properties
            platform.setActive(true)
                    .setVisible(true)
                    .setScale(48 / 128)
                    .setImmovable(true)
                    .setVelocity(-180, 0);
                    
            // Randomly place a coin on top of the platform block
            if (Phaser.Math.FloatBetween(0, 1) < 0.5) {
              // Get a coin from the pool
                let coin = this.coinGroup.get(platform.x, platform.y - 44, 'coin');
        	   // Scale the coin
        	   coin.setScale(1.5);
                // Wake the coin up and play its animation
                coin.setActive(true)
                    .setVisible(true)
                    .setVelocity(-180, 0)
                    .play('spin', true);
            }        
        }
    }
    
    getRightmostPlatformX() {
        let rightmostX = 0;
    
        // Loop through all the platforms in the group
        this.groundGroup.getChildren().forEach(platform => {
            // Keep track of the largest x position we find
            rightmostX = Math.max(rightmostX, platform.x);
        });
    
        return rightmostX;
    }
    
    collectCoin(player, coin) {
        // Immediately disable the coin's physics body to prevent double collection
        coin.body.enable = false;
    
        // Create a tween to make the coin pop up and fade out
        this.tweens.add({
            targets: coin,
            y: coin.y - 50, // Move 50 pixels up
            alpha: 0, // Fade to fully transparent
            duration: 300, // The tween lasts 0.3 seconds
            ease: 'Power2',
            // When the tween is complete, we'll run this function
            onComplete: () => {
                // Put the coin back in the object pool
                coin.setActive(false).setVisible(false);
            }
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
    backgroundColor: '#000053', // navy
    
    // This tells Phaser where to put the game canvas in the HTML.
    parent: 'game-container', // element with id of game-container

    // This turns on the Arcade Physics engine for our game.
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 } // Gravity setting
        }
    },

    // This is the modern way to handle scaling. We let our CSS file do the work.
    scale: {
        mode: Phaser.Scale.NONE, // Disable Phaser's automatic scaling.
        autoCenter: Phaser.Scale.NO_CENTER // Disable Phaser's automatic centering.
    },
    pixelArt: true,
    // An array containing all the scenes in our game.
    scene: [GameScene]
};

// -------- CREATE GAME --------

// Create the actual Phaser game object, starting the whole process.
const game = new Phaser.Game(config);
