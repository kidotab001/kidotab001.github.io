class MainScene extends Phaser.Scene {
    
    constructor() {
        super('MainScene');
    }

    preload() {
    }

    create() {
        // Define Constants
        this.UI_PANEL_HEIGHT = 120;
        this.WORLD_WIDTH = this.cameras.main.width;
        this.WORLD_HEIGHT = this.cameras.main.height - this.UI_PANEL_HEIGHT;
        // Create Gradient Background
        const texture = this.textures.createCanvas('gradient-bg', this.WORLD_WIDTH, this.WORLD_HEIGHT);
        const context = texture.getContext();
        const gradient = context.createLinearGradient(0, 0, 0, this.WORLD_HEIGHT);
        gradient.addColorStop(0, '#030341'); // Dark blue at the top
        gradient.addColorStop(1, '#0e6f7b'); // Black at the bottom
        context.fillStyle = gradient;
        context.fillRect(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
        texture.refresh();
        // Add Gradient Background
        this.add.image(0, 0, 'gradient-bg').setOrigin(0);
        // Create UI Panel
        this.add.rectangle(0, this.WORLD_HEIGHT, 
            this.WORLD_WIDTH, this.UI_PANEL_HEIGHT, 
            0x202020).setOrigin(0).setDepth(100);
        // Setup Buttons
        const buttonData = [
            { shapeType: 'square', color: 0x800000 },
            { shapeType: 'circle', color: 0x000080 },
            { shapeType: 'triangle', color: 0x800080 },
            { shapeType: 'star', color: 0x008000 }
        ];    
        const buttonSize = 80;
        const buttonSpacing = (this.WORLD_WIDTH - (buttonData.length * buttonSize)) / (buttonData.length + 1);
        // Create Buttons
        buttonData.forEach((data, index) => {
            const buttonX = buttonSpacing + (index * (buttonSize + buttonSpacing)) + buttonSize / 2;
            const buttonY = this.WORLD_HEIGHT + this.UI_PANEL_HEIGHT / 2;

            // Create the button's square background shape.
            const buttonBg = this.add.rectangle(buttonX, buttonY, buttonSize, buttonSize, data.color).setStrokeStyle(2, 0xffffff);
            buttonBg.setInteractive({ useHandCursor: true });
            buttonBg.setDepth(100);
            
            // Draw the corresponding shape icon inside the button
            switch (data.shapeType) {
                case 'square':
                    this.add.rectangle(buttonX, buttonY, 40, 40, 0xffffff).setDepth(100);
                    break;
                case 'circle':
                    this.add.circle(buttonX, buttonY, 20, 0xffffff).setDepth(100);
                    break;
                case 'triangle':
                    this.add.triangle(buttonX, buttonY, 25, 0, 50, 44, 0, 44, 0xffffff).setDepth(100);
                    break;
                case 'star':
                    this.add.star(buttonX, buttonY, 5, 12, 24, 0xffffff).setDepth(100);
                    break;
            }

            // Set up the input handler for a tap on a UI button.
            buttonBg.on('pointerdown', () => {
                this.createShape(data.shapeType);
            });
        });
        // Set up global input handlers
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // Update the game object's position as it's dragged.
            gameObject.setPosition(dragX, dragY);
        });
        // This handler checks what to do after a drag action ends
        this.input.on('dragend', (pointer, gameObject) => {
            // Check if the shape was dragged past the edge of the screen.
            if (gameObject.x < 0 || gameObject.x > this.WORLD_WIDTH || 
                gameObject.y < 0 || gameObject.y > this.WORLD_HEIGHT) {
                // If so, remove it from the screen.
                gameObject.destroy();
            }
        });
    }

    createShape(shapeType) {
        // Generate a random color for visual variety
        const color = new Phaser.Display.Color();
        color.random(0, 255);
        let randomColor = color.color;
        // Generate a random position within the "world" area (above the UI panel)
        const x = Phaser.Math.Between(50, this.WORLD_WIDTH - 50);
        const y = Phaser.Math.Between(50, this.WORLD_HEIGHT - 50);
        // Create the shape
        let newShape;
        // Create the correct procedural shape based on the button pressed.
        switch (shapeType) {
            case 'square':
                newShape = this.add.rectangle(x, y, 80, 80, randomColor);
                break;
            case 'circle':
                newShape = this.add.circle(x, y, 45, randomColor);
                break;
            case 'triangle':
                newShape = this.add.triangle(x, y, 50, 0, 100, 100, 0, 100, randomColor);
                break;
            case 'star':
                newShape = this.add.star(x, y, 5, 25, 50, randomColor);
                break;
        }
        if (newShape) {
            // Give the shape a random size (80% to 150%)
            newShape.setScale(Phaser.Math.FloatBetween(0.8, 1.5));
            // Make the new shape interactive so it can respond to input.
            newShape.setInteractive({ useHandCursor: true });
            // Enable the drag-and-drop functionality for the new shape.
            this.input.setDraggable(newShape);
        }
    }
    
}

const config = {
    type: Phaser.AUTO,

    width: 600,
    height: 800,

    backgroundColor: '#000000',

    parent: 'game-container',

    scale: {
        mode: Phaser.Scale.NONE, 
        autoCenter: Phaser.Scale.NO_CENTER
    },

    scene: [MainScene]
};

const game = new Phaser.Game(config);