class BootScene extends Phaser.Scene {

    constructor() {
        super('BootScene');
    }

    preload(){
        this.load.image("background", "assets/graphics/background.png");
    }

    create() {
        this.scene.start("LoadScene");
	}
}

class LoadScene extends Phaser.Scene {
    constructor() {
        super('LoadScene');
    }

    preload(){
        this.add.image(0, 0, "background").setOrigin(0);
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
        // --- LOAD THE FILES!!! ---
        this.load.image("icon-piano", "assets/graphics/piano.png");
        this.load.image("icon-xylophone", "assets/graphics/xylophone.png");
        // Xylophone
        const xylophoneNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        for (let i = 0; i < 8; i++){
            this.load.image(`xylophone-note${i}`, `assets/graphics/xylophone/note${i}.png`);
            this.load.audio(`xylophone-${xylophoneNotes[i]}-note`, 
                `assets/audio/xylophone/${xylophoneNotes[i]}_note.mp3`);
        }
        // Piano
        this.load.image("piano-key-black-back", "assets/graphics/piano/key-black-back.png");
        this.load.image("piano-key-black", "assets/graphics/piano/key-black.png");
        this.load.image("piano-key-white", "assets/graphics/piano/key-white.png");
        const pianoNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 
            'Cs4', 'Ds4', 'Fs4', 'Gs4', 'As4'];
        for (let note of pianoNotes){
            this.load.audio(`piano-${note}-note`, 
                `assets/audio/piano/piano-note-${note}.wav`);
        }

        // --- SET UP 'COMPLETE' EVENT ---
        // Listen for the 'complete' event, which fires when all assets are loaded
        this.load.on('complete', () => {
            this.scene.start("MainScene");
        });  
     }
}

class MainScene extends Phaser.Scene {
    
    constructor() {
        super('MainScene');
    }

    create() {
        // Setup World
        this.WORLD_WIDTH = this.cameras.main.width;
        this.WORLD_HEIGHT = this.cameras.main.height;
        // Background
        this.add.image(0, 0, "background").setOrigin(0);
        // Display Title
        this.titleText = this.add.text(this.WORLD_WIDTH / 2, 60, 'Musical Instruments', {
            fontFamily: 'Arial',
            fontSize: '60px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        this.flavorText = this.add.text(this.WORLD_WIDTH / 2, this.titleText.y + 60, 
            'Choose an instrument to play!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        // Add Buttons
        this.pianoButton = this.createButton(0, "Piano", "icon-piano", () => {
            this.gotoScene("PianoScene");
        });
        this.xylophoneButton = this.createButton(2, "Xylophone", "icon-xylophone", () => {
            this.gotoScene("XylophoneScene");
        });
        // Fade in
        this.cameras.main.fadeIn(250);
    }

    createButton(index, label, key, callback){
        const button = {};
        const x = this.WORLD_WIDTH / 4 * (index + 1);
        const y = this.WORLD_HEIGHT / 2 + 50;
        const size = 256;

        const graphics = this.add.graphics();
        graphics.fillStyle(0xaaaaaa, 1);
        graphics.fillRoundedRect(x - size / 2, y - size / 2, size, size, 16);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, size - 8, 16);
        button.background = graphics;

        button.label = this.add.text(x, y + size / 2 - 24, label, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);

        button.image = this.add.image(x, y - 8, key);
        button.image.setScale((size * 0.7) / button.image.width);
        // Add Interaction
        button.background.setInteractive({ useHandCursor: true ,
            hitArea: new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        button.background.on('pointerdown', () => {
            button.callback = callback;
            button.callback();
        });

        return button;
    }

    gotoScene(sceneName){
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (camera) => {
            this.scene.start(sceneName);
        });
        this.cameras.main.fadeOut(250);
    }
    
}

class PianoScene extends Phaser.Scene {
    constructor() {
        super('PianoScene');
    }

    create(){
        // Setup World
        this.WORLD_WIDTH = this.cameras.main.width;
        this.WORLD_HEIGHT = this.cameras.main.height;
        // Background
        this.add.image(0, 0, "background").setOrigin(0);
        // Display Title
        this.titleText = this.add.text(this.WORLD_WIDTH / 2, 48, 'Piano', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        // Add Back Button
        this.backButton = this.createBackButton();
        // Create Piano
        this.createPiano();
        // Fade In
        this.cameras.main.fadeIn(250);
    }

    createBackButton(){
        const button = {};
        const width = 120;
        const height = 48;
        const x = this.WORLD_WIDTH - 8 - width / 2;
        const y = this.WORLD_HEIGHT - 8 - height / 2;

        const graphics = this.add.graphics();
        graphics.fillStyle(0xaaaaaa, 1);
        graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 4, width - 8, height - 8, 8);
        button.background = graphics;

        button.label = this.add.text(x, y, 'Back', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);

        // Add Interaction
        button.background.setInteractive({ useHandCursor: true ,
            hitArea: new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        button.background.on('pointerdown', () => {
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (camera) => {
                this.scene.start("MainScene");
            });
            this.cameras.main.fadeOut(250);
        });

        return button;
    }

    createPiano(){
        const whiteKeyWidth = 97;
        const whiteKeyHeight = 400;
        const blackKeyHeight = 200;
        const startX = this.WORLD_WIDTH / 2 - (8 * whiteKeyWidth) / 2 + whiteKeyWidth / 2;
        const y = this.WORLD_HEIGHT / 2 + 12;

        const pianoNotesWhite = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const pianoNotesBlack = ['Cs4', 'Ds4', '', 'Fs4', 'Gs4', 'As4'];

        // Add Background
        this.add.rectangle(this.WORLD_WIDTH / 2, y, 
            this.WORLD_WIDTH, whiteKeyHeight + 24, 0x003333);
        // Add White Keys
        for (let i = 0; i < 8; i++){
            let note = pianoNotesWhite[i];
            if (note == 'C5'){ note = 'C\n1·'}
            else{
                note = `${note.charAt(0)}\n${i+1}`;
            };
            const x = startX + whiteKeyWidth * i;
            const background = this.add.image(x, y, 'piano-key-white');
            const text = this.add.text(x, y + 100, note,{
                fontFamily: 'Arial',
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#000000',
                align: 'center',
            });
            text.setOrigin(0.5).setAlpha(0.5);
             // Set Interaction
            background.setInteractive({ useHandCursor: true});
            background.on('pointerdown', () => {
                if (this.tweens.isTweening(background)) {
                    return;
                }
                // Play Audio
                this.sound.play(`piano-${pianoNotesWhite[i]}-note`);
                // Click Animation
                this.tweens.add({
                    targets: [background, text],      // The object to tween
                    alpha: 0.8,
                    duration: 100,      // Duration of the tween in ms
                    ease: 'Sine.easeInOut', // An easing function
                    yoyo: true,         // Make the tween play in reverse once it completes
                });
            });
        }
        // Add Black Keys
        for(let i = 0; i < 6; i++){
            let note = pianoNotesBlack[i];
            if (note == '') continue;
            note = `${note.charAt(0)}♯`;
            const lowerBackground = this.add.image(startX + whiteKeyWidth * i + whiteKeyWidth / 2, 
                y - whiteKeyHeight / 2 + blackKeyHeight / 2, 'piano-key-black-back');
            const background = this.add.image(startX + whiteKeyWidth * i + whiteKeyWidth / 2, 
                y - whiteKeyHeight / 2 + blackKeyHeight / 2, 'piano-key-black');
            const text = this.add.text(background.x, background.y + blackKeyHeight / 4, note,{
                fontFamily: 'Arial',
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
            });
            text.setOrigin(0.5).setAlpha(0.5);   
            // Set Interaction
            background.setInteractive({ useHandCursor: true});
            background.on('pointerdown', () => {
                if (this.tweens.isTweening(background)) {
                    return;
                }
                // Play Audio
                this.sound.play(`piano-${pianoNotesBlack[i]}-note`);
                // Click Animation
                this.tweens.add({
                    targets: [background, text],      // The object to tween
                    alpha: 0.8,
                    duration: 100,      // Duration of the tween in ms
                    ease: 'Sine.easeInOut', // An easing function
                    yoyo: true,         // Make the tween play in reverse once it completes
                });
            }); 
        }
    }
}

class XylophoneScene extends Phaser.Scene {
    constructor() {
        super('XylophoneScene');
    }

    create(){
        // Setup World
        this.WORLD_WIDTH = this.cameras.main.width;
        this.WORLD_HEIGHT = this.cameras.main.height;
        // Background
        this.add.image(0, 0, "background").setOrigin(0);
        // Display Title
        this.titleText = this.add.text(this.WORLD_WIDTH / 2, 48, 'Xylophone', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        // Add Back Button
        this.backButton = this.createBackButton();
        // Create Xylophone
        this.createXylophone();
        // Fade In
        this.cameras.main.fadeIn(250);
    }

    createBackButton(){
        const button = {};
        const width = 120;
        const height = 48;
        const x = this.WORLD_WIDTH - 8 - width / 2;
        const y = this.WORLD_HEIGHT - 8 - height / 2;

        const graphics = this.add.graphics();
        graphics.fillStyle(0xaaaaaa, 1);
        graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 4, width - 8, height - 8, 8);
        button.background = graphics;

        button.label = this.add.text(x, y, 'Back', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);

        // Add Interaction
        button.background.setInteractive({ useHandCursor: true ,
            hitArea: new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        button.background.on('pointerdown', () => {
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (camera) => {
                this.scene.start("MainScene");
            });
            this.cameras.main.fadeOut(250);
        });

        return button;
    }

    createXylophone(){
        const startX = this.WORLD_WIDTH / 2 - (8 * 84) / 2 + 84 / 2;
        const startY = this.WORLD_HEIGHT / 2;
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        for(let i = 0; i < 8; i++){
            const x = startX + i * 84;
            const y = startY;
            const background = this.add.image(x, y, `xylophone-note${i}`);
            let note = notes[i];
            if (note == 'C5'){ note = 'C\n1·'}
            else{
                note = `${note.charAt(0)}\n${i+1}`;
            };
            const text = this.add.text(x ,y, note,{
                fontFamily: 'Arial',
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#000000',
                align: 'center',
            });
            text.setOrigin(0.5).setAlpha(0.5);
            // Set Interaction
            background.setInteractive({ useHandCursor: true});
            background.on('pointerdown', () => {
                if (this.tweens.isTweening(background)) {
                    return;
                }
                // Play Audio
                this.sound.play(`xylophone-${notes[i]}-note`);
                // Click Animation
                this.tweens.add({
                    targets: [background, text],      // The object to tween
                    scaleX: 0.98,        // The target horizontal scale
                    scaleY: 0.98,        // The target vertical scale
                    alpha: 0.8,
                    duration: 50,      // Duration of the tween in ms
                    ease: 'Sine.easeInOut', // An easing function
                    yoyo: true,         // Make the tween play in reverse once it completes
                });
            });
        }
    }
}

const config = {
    type: Phaser.AUTO,

    width: 800,
    height: 600,

    backgroundColor: '#000000',

    parent: 'game-container',

    scale: {
        mode: Phaser.Scale.NONE, 
        autoCenter: Phaser.Scale.NO_CENTER
    },
    input: {
        activePointers: 4
    },

    scene: [BootScene, LoadScene, MainScene, PianoScene, XylophoneScene]
};

const game = new Phaser.Game(config);