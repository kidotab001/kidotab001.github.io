class MainScene extends Phaser.Scene {

    constructor() {
        super('MainScene');
        // A list of possible answers for the Magic 8-Ball 
        this.answers = [
            'It is certain',
            'Without a doubt',
            'You may rely on it',
            'Yes definitely',
            'As I see it, yes',
            'Most likely',
            'Outlook good',
            'Signs point to yes',
            'Yes',
            'Reply hazy, try again',
            'Ask again later',
            'Better not tell you now',
            'Cannot predict now',
            'Concentrate and ask again',
            'Don\'t count on it',
            'My reply is no',
            'My sources say no',
            'Outlook not so good',
            'Very doubtful'
        ];
        // State variables
        this.isShaking = false; // Prevents re-triggering the answer animation
        this.isTTS_Enabled = true; // Manages the state for the custom checkbox 

        // Shake detection variables
        this.shakeThreshold = 25;
        this.lastAcceleration = { x: 0, y: 0, z: 0 };
    }

    preload() {
        // Load the external image asset for the Magic 8-Ball
        this.load.image('ballfront', 'assets/graphics/ball-front.png');
        this.load.image('ballback', 'assets/graphics/ball-back.png');
    }

    create() {
        // Setup World
        this.WORLD_WIDTH = this.cameras.main.width;
        this.WORLD_HEIGHT = this.cameras.main.height;
        // Background Color
        this.cameras.main.setBackgroundColor('#ffffff');
        // Display Title
        this.titleText = this.add.text(this.WORLD_WIDTH / 2, 48, 'Magic 8-Ball', {
            fontFamily: 'Type Light Sans',
            fontSize: '60px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);
        this.flavorText = this.add.text(this.WORLD_WIDTH / 2, this.titleText.y + 52, 'The magic 8-ball will tell your fortune.', {
            fontFamily: 'Type Light Sans',
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);
        // Create 8-Ball
        // The BACK goes first!
        this.ballBack = this.add.sprite(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2 - 20, 'ballback');
        this.ballBack.setAlpha(0); // Hide the back
        // Create the text object for displaying the answer. It starts invisible.
        this.answerText = this.add.text(this.ballBack.x, this.ballBack.y, '', {
            fontFamily: 'Type Light Sans',
            fontSize: '24px',
            color: '#00ffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 180 }
        }).setOrigin(0.5);
        // Then comes the FRONT
        this.ballFront = this.add.sprite(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2 - 20, 'ballfront');

        // Setup Accelerometer
        let hasAccelerometer = this.setupShakeDetection();
        let instruction = "Ask and shake the device!";
        if (!hasAccelerometer) instruction = "Ask and tap the ball!";

        // Show Instruction
        this.questionText = this.add.text(this.WORLD_WIDTH / 2, this.ballFront.y + this.ballFront.height / 2 + 20, 'Think of a question.', {
            fontFamily: 'Type Light Sans',
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);
        this.instructionText = this.add.text(this.WORLD_WIDTH / 2, this.questionText.y + 40, instruction, {
            fontFamily: 'Type Light Sans',
            fontSize: '32px',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);

        // Setup Tap Ball Trigger
        this.ballHitArea = this.add.rectangle(this.ballFront.x, this.ballFront.y, 
            this.ballFront.width, this.ballFront.height, 0x000000);
        this.ballHitArea.setFillStyle(0x000000, 0);
        this.ballHitArea.setInteractive({ useHandCursor: true });
        this.ballHitArea.on('pointerdown', () => this.triggerAnswer());

        // Create Checkbox
        this.readCheckBox = this.createCheckbox(this.WORLD_WIDTH / 4, this.WORLD_HEIGHT - 40, 
            'Read the Result', (checked) => { this.isTTS_Enabled = checked; }, 'ttsEnabled');
        this.darkModeCheckBox = this.createCheckbox(this.WORLD_WIDTH / 4 * 3, this.WORLD_HEIGHT - 40,
            'Enable Dark Mode', (checked) => { this.switchUI_Mode(checked); }, 'darkMode');
        this.readCheckBox.callback(this.readCheckBox.checked);    
        this.darkModeCheckBox.callback(this.darkModeCheckBox.checked);     
    }

    // Helper for creating checkbox
    createCheckbox(x, y, text, callback, localStorageKey) {
        let checkBox = {}
        checkBox.background = this.add.rectangle(x, y, 40, 40, 0xffffff).setStrokeStyle(2, 0xaaaaaa);
        checkBox.background.setInteractive({ useHandCursor: true });
        
        // Create Checkmark and Label
        checkBox.checkmark = this.add.text(x, y, '✔', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);
        checkBox.label = this.add.text(x + 30, y, text, 
            { fontFamily: 'Type Light Sans', 
              fontSize: '24px', 
              color: '#000000' }).setOrigin(0, 0.5);    
        // Load Settings       
        checkBox.checked = (localStorage.getItem(localStorageKey) == 'true');
        checkBox.callback = callback;
        // Center the checkbox
        const offset = (checkBox.background.width + checkBox.label.width) / 2;
        checkBox.background.setX(checkBox.background.x - offset);
        checkBox.checkmark.setX(checkBox.checkmark.x - offset);
        checkBox.label.setX(checkBox.label.x - offset);

        // Handle checkbox click
        checkBox.background.on('pointerdown', () => {
            // Toggle the internal state and update the UI 
            checkBox.checked = !checkBox.checked;
            checkBox.checkmark.setVisible(checkBox.checked);
            localStorage.setItem(localStorageKey, checkBox.checked); // Save Setting
            checkBox.callback(checkBox.checked);
        });
        // Set initial property
        checkBox.checkmark.setVisible(checkBox.checked);
        // Return the checkbox object
        return checkBox;
    }

    // Switch Light/Dark Mode
    switchUI_Mode(darkMode){
        // Set background color
        this.cameras.main.setBackgroundColor(darkMode ? '#111111' : '#ffffff');
        // Set font color
        let fontColor = darkMode ? '#ffffff' : '#000000'
        this.titleText.setColor(fontColor);
        this.flavorText.setColor(fontColor);
        this.questionText.setColor(fontColor);
        this.instructionText.setColor(fontColor);
        this.readCheckBox.label.setColor(fontColor);
        this.darkModeCheckBox.label.setColor(fontColor);
        this.readCheckBox.label.setColor(fontColor);
        this.darkModeCheckBox.label.setColor(fontColor);
        this.readCheckBox.checkmark.setColor(fontColor);
        this.darkModeCheckBox.checkmark.setColor(fontColor);
        // Set check box color
        let fillColor = darkMode ? 0x111111 : 0xffffff;
        this.readCheckBox.background.fillColor = fillColor;
        this.darkModeCheckBox.background.fillColor = fillColor;
        // Add glow to the ball
        if (darkMode){
            this.ballFront.postFX.addGlow(0xffffff, 0.5, 0, false);
            this.ballBack.postFX.addGlow(0xffffff, 0.5, 0, false);
        }
        else {
            this.ballFront.postFX.clear();
            this.ballBack.postFX.clear();
        }
    }

    // Shaking of the 8-ball
    triggerAnswer() {
        // Prevent new shakes while the animation is playing
        if (this.isShaking) return;
        this.isShaking = true;

        // Show the FRONT image
        this.tweens.add({
            targets: this.ballFront,
            alpha: 1,
            duration: 250,
            ease: 'Power2',
        });

        // Hide the BACK image
        this.ballBack.setAlpha(0);

        // Play the "rattle" animation using a tween chain
        const startX = this.ballFront.x;
        const startY = this.ballFront.y;

        // This configuration array is a direct translation of the `@keyframes shake-hard` from CSS.
        // Each object represents a keyframe with x/y translations and a rotation in degrees (r).
        const shakeKeyframes = [
            { x: -7, y: 10, r: 3.5 }, { x: -5, y: 7, r: -1.5 }, { x: 0, y: 7, r: 3.5 },
            { x: 0, y: -9, r: -0.5 }, { x: -8, y: -5, r: 2.5 }, { x: -1, y: 4, r: 3.5 },
            { x: 8, y: 4, r: 0.5 }, { x: -3, y: 8, r: 0.5 }, { x: 10, y: 10, r: -0.5 },
            { x: -4, y: 10, r: 0.5 }, { x: 6, y: 4, r: 0.5 }, { x: -9, y: -7, r: -0.5 },
            { x: 8, y: 3, r: -1.5 }, { x: -8, y: -9, r: 2.5 }, { x: 0, y: -3, r: -0.5 },
            { x: -3, y: 3, r: 1.5 }, { x: 8, y: 0, r: -1.5 }, { x: -3, y: -5, r: -2.5 },
            { x: -3, y: 6, r: -0.5 }, { x: 3, y: -6, r: 1.5 }, { x: -6, y: -4, r: -1.5 },
            { x: -2, y: -7, r: -0.5 }, { x: 9, y: 2, r: -0.5 }, { x: 6, y: 4, r: 3.5 },
            { x: 7, y: 3, r: 0.5 }
        ];

        // The total CSS animation is 100ms, and keyframes are at 2% intervals.
        // This means each step in our tween chain should last 2ms.
        const DURATION_PER_STEP = 2;

        const hardShakeTweens = shakeKeyframes.map(frame => ({
            x: startX + frame.x,
            y: startY + frame.y,
            rotation: Phaser.Math.DegToRad(frame.r),
            duration: DURATION_PER_STEP,
            ease: 'Linear'
        }));

        // Add a final tween to ensure the ball returns to its starting position
        hardShakeTweens.push({
            x: startX,
            y: startY,
            rotation: 0,
            duration: DURATION_PER_STEP,
            ease: 'Linear'
        });

        this.tweens.chain({
            targets: this.ballFront,
            tweens: hardShakeTweens,
            loop: 1,
            onComplete: () => {
                // A final reset ensures the ball is perfectly centered before showing the answer
                this.ballFront.setPosition(startX, startY);
                this.ballFront.setRotation(0);
                this.showAnswer();
            }
        });
    }

    // Displays the answer
    showAnswer() {
        // Pick a random answer from the array
        const randomAnswer = Phaser.Math.RND.pick(this.answers);
        this.answerText.setText(randomAnswer);

        // Show the BACK image
        this.ballBack.setAlpha(1);

        // Fade the FRONT image
        this.tweens.add({
            targets: this.ballFront,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Re-enable shaking after the full animation cycle
                this.isShaking = false;
            }
        });

        // Use the Web Speech API if the checkbox is enabled
        if (this.isTTS_Enabled && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(randomAnswer);
            window.speechSynthesis.speak(utterance);
        }
    }

    // Setup the Accelerometer
    setupShakeDetection() {
        if ('Accelerometer' in window) {
            try {
                const accelerometer = new Accelerometer({ frequency: 10 });
                accelerometer.addEventListener('error', event => {
                    console.error('Accelerometer error:', event.error.name, event.error.message);
                    return false;
                });
                accelerometer.addEventListener('reading', () => this.handleAccelerometerReading(accelerometer));
                accelerometer.start();
                console.log('Using Accelerometer for shake detection.');
            } catch (error) {
                console.error('Could not initialize Accelerometer:', error);
                return false;
            }
            return true;
        } else {
            console.log('Accelerometer not supported.');
            return false;
        }
    }

    // Process the Accelerometer readings
    handleAccelerometerReading(accelerometer) {
        if (this.isShaking) return;
        const { x, y, z } = accelerometer;
        if (x === null || y === null || z === null) return;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        console.log(magnitude);
        // Check the magnitude of the acceleration vector
        if (magnitude > this.shakeThreshold) {
            this.triggerAnswer();
        }
    }
}

// Game Config
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 800,
    backgroundColor: '#000000',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
};

// Load Custom Font
document.fonts.load('10pt "Type Light Sans"').then(() => {
    const game = new Phaser.Game(config);
});