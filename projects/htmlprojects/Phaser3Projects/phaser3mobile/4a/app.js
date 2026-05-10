class MainScene extends Phaser.Scene {

    constructor() {
        super('MainScene');

        // -- Variables --
        this.soundOn = true;
        this.buttons = [];

        this.inputValue = '0';
        this.resultValue = 0;
        this.isInputing = true;
        this.operand = null;
        this.operator = null;

        // -- Colors --
        this.colors = [
            { color: "#222222", type: "dark"}, //0
            { color: "#172c41", type: "dark"}, //1
            { color: "#9b59b6", type: "dark"}, //2
            { color: "#c0392b", type: "dark"}, //3
            { color: "#8e44ad", type: "dark"}, //4
            { color: "#0f481c", type: "dark"}, //5
            { color: "#ffffff", type: "light"}, //6
            { color: "#f39c12", type: "light"}, //7
            { color: "#bdc3c7", type: "light"}, //8
            { color: "#2ecc71", type: "light"}, //9
            { color: "#3498db", type: "light"}, //10
            { color: "#1abc9c", type: "light"} //11
        ];

        // Retrieve from local storage
        this.isSoundOn = (localStorage.getItem("isSoundOn") == 'true');
        this.backColorIndex = localStorage.getItem("backColorIndex") ?? 1;
        this.resultColorIndex = localStorage.getItem("resultColorIndex") ?? 0;
        this.numColorIndex = localStorage.getItem("numColorIndex") ?? 6;
        this.opColorIndex = localStorage.getItem("opColorIndex") ?? 7;
        this.utilColorIndex = localStorage.getItem("utilColorIndex") ?? 8;
    }

    preload(){
        // Preload Tone Files
        const tones = ['C3', 'Cs3', 'D3', 'Ds3', 'E3', 'F3', 'Fs3', 'G3', 'Gs3', 'A3', 'As3', 'B3', 
            'C4', 'Cs4', 'D4', 'Ds4', 'E4', 'F4', 'Fs4', 'G4', 'Gs4', 'A4', 'As4', 'B4', 
            'C5', 'Cs5', 'D5', 'Ds5', 'E5', 'F5', 'Fs5', 'G5', 'Gs5', 'A5', 'As5', 'B5'];
        for(let tone of tones){
            this.load.audio(`tone${tone}`,`assets/audio/${tone}.wav`);
        }    
    }

    create() {
        // -- Setup World --
        this.WORLD_WIDTH = this.scale.width;
        this.WORLD_HEIGHT = this.scale.height;
        this.input.addPointer(3); // Add 3 additional pointers
        // -- Set Background Color --
        this.cameras.main.setBackgroundColor(this.getColor(this.backColorIndex));
        // --- Create Top Bar ---
        this.createTopBar();
        // --- Create Result Bar ---
        this.createResultBar();
        // --- Create Buttons ---
        this.createButtons();
        // --- Responsive Handling ---
        // Listen for the resize event from the Scale Manager
        this.scale.on('resize', this.resize, this);
        // Initial layout call
        this.resize({ width: this.scale.width, height: this.scale.height });
    }

    createTopBar(){
        this.TOP_BAR_HEIGHT = 32;
        this.TOP_BTN_SIZE = 24;
        this.TOP_BTN_GAP = 4;
        // Create Top Bar
        this.topBar = this.add.rectangle(0, 0, this.WORLD_WIDTH, this.TOP_BAR_HEIGHT, 0x202020).setOrigin(0);
        // Create Title
        this.titleText = this.add.text(12, 0, 'Calculator', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0, 0.5)
        this.titleText.setY(this.topBar.height / 2);
        // Create Buttons
        this.topButtons = []
        this.topButtons.push(this.createTopButton(0, "𝅘𝅥𝅮", ()=>{
            this.isSoundOn = !this.isSoundOn;
            if (this.isSoundOn){
                this.topButtons[0].background.setFillStyle(0x111111);
                this.topButtons[0].background.setStrokeStyle(2, 0xffffff);
                this.topButtons[0].label.setColor('#ffffff');
            }else{
                this.topButtons[0].background.setFillStyle(0x393939);
                this.topButtons[0].background.setStrokeStyle(2, 0x6c6c6c);
                this.topButtons[0].label.setColor('#6c6c6cff');
            }
            localStorage.setItem("isSoundOn", this.isSoundOn);
        }));
        this.topButtons.push(this.createTopButton(1, "B", ()=>{
            this.backColorIndex = Phaser.Math.Wrap(this.backColorIndex + 1, 0, this.colors.length - 1);
            this.cameras.main.setBackgroundColor(this.getColor(this.backColorIndex));
            this.resultBar.background.setStrokeStyle(1, this.colorToHex(this.lineColor(this.backColorIndex)));
            for(let button of this.buttons){
                button.background.setStrokeStyle(1, this.colorToHex(this.lineColor(this.backColorIndex)));
            }
            localStorage.setItem("backColorIndex", this.backColorIndex);
        }));
        this.topButtons.push(this.createTopButton(2, "=", ()=>{
            this.resultColorIndex = Phaser.Math.Wrap(this.resultColorIndex + 1, 0, this.colors.length - 1);
            this.resultBar.background.setFillStyle(this.colorToHex(this.getColor(this.resultColorIndex)));
            this.resultBar.text.setColor(this.lineColor(this.resultColorIndex)); 
            localStorage.setItem("resultColorIndex", this.resultColorIndex);
        }));
        this.topButtons.push(this.createTopButton(3, "1", ()=>{
            this.numColorIndex = Phaser.Math.Wrap(this.numColorIndex + 1, 0, this.colors.length - 1);
            for(let button of this.buttons.filter((item) => item.type == 'num')){
                button.background.setFillStyle(this.colorToHex(this.getColor(this.numColorIndex)));
                button.label.setColor(this.lineColor(this.numColorIndex)); 
            }
            localStorage.setItem("numColorIndex", this.numColorIndex);
        }));
        this.topButtons.push(this.createTopButton(4, "+", ()=>{
            this.opColorIndex = Phaser.Math.Wrap(this.opColorIndex + 1, 0, this.colors.length - 1);
            for(let button of this.buttons.filter((item) => item.type == 'op')){
                button.background.setFillStyle(this.colorToHex(this.getColor(this.opColorIndex)));
                button.label.setColor(this.lineColor(this.opColorIndex)); 
            }
            localStorage.setItem("opColorIndex", this.opColorIndex);
        }));
        this.topButtons.push(this.createTopButton(5, "%", ()=>{
            this.utilColorIndex = Phaser.Math.Wrap(this.utilColorIndex + 1, 0, this.colors.length - 1);
            for(let button of this.buttons.filter((item) => item.type == 'util')){
                button.background.setFillStyle(this.colorToHex(this.getColor(this.utilColorIndex)));
                button.label.setColor(this.lineColor(this.utilColorIndex)); 
            }
            localStorage.setItem("utilColorIndex", this.utilColorIndex);
        }));
        // Initial toggle for sound
        this.isSoundOn = !this.isSoundOn;
        this.topButtons[0].callback();
    }

    createTopButton(index, text, callback){
        const button = {}
        let x = this.WORLD_WIDTH - this.TOP_BTN_SIZE * index - this.TOP_BTN_SIZE / 2 - this.TOP_BTN_GAP * (index + 1);
        let y = this.TOP_BAR_HEIGHT / 2;
        button.background = this.add.rectangle(x, y, this.TOP_BTN_SIZE, this.TOP_BTN_SIZE, 0x111111).setStrokeStyle(2, 0xffffff);
        button.label = this.add.text(x, y, text, { fontSize: '18px', fontFamily: 'serif',
            color: '#ffffff'}).setOrigin(0.5);
        button.background.setInteractive({ useHandCursor: true });
        button.callback = callback;
        button.background.on('pointerdown', () => {
            if (this.tweens.isTweening(button.background)) {
                return;
            }
            button.callback();
            this.tweens.add({
                targets: [button.background, button.label],      // The object to tween
                scaleX: 0.9,        // The target horizontal scale
                scaleY: 0.9,        // The target vertical scale
                duration: 50,      // Duration of the tween in ms
                ease: 'Sine.easeInOut', // An easing function
                yoyo: true,         // Make the tween play in reverse once it completes
            });
        });
        
        return button;
    }

    createResultBar(){
        this.resultBar = {}
        this.GAP = 12;
        this.resultBar.background = this.add.rectangle(1, 1, 1, 1, 
            this.colorToHex(this.getColor(this.resultColorIndex))).setOrigin(0);
        this.resultBar.background.setStrokeStyle(1, this.colorToHex(this.lineColor(this.backColorIndex)));    
        this.resultBar.text = this.add.text(0, 0, '0', {
            fontFamily: 'Arial',
            fontSize: '80px',
            color: this.lineColor(this.resultColorIndex),
            align: 'right'
        }).setOrigin(1, 0.5);
    }

    createButtons(){
        this.createButton(0, 4, '⌫', 'G3', 'num');
        this.createButton(1, 4, '0', 'A3', 'num');
        this.createButton(2, 4, '.', 'B3', 'num');

        this.createButton(0, 3, '1', 'C4',  'num');
        this.createButton(1, 3, '2', 'D4', 'num');
        this.createButton(2, 3, '3', 'E4', 'num');

        this.createButton(0, 2, '4', 'F4', 'num');
        this.createButton(1, 2, '5', 'G4', 'num');
        this.createButton(2, 2, '6', 'A4', 'num');

        this.createButton(0, 1, '7', 'B4', 'num');
        this.createButton(1, 1, '8', 'C5', 'num');
        this.createButton(2, 1, '9', 'D5', 'num');

        this.createButton(0, 0, 'C', 'E5', 'util');
        this.createButton(1, 0, '+/-', 'F5', 'util');
        this.createButton(2, 0, '%', 'G5', 'util');

        this.createButton(3, 0, '/', 'As4', 'op');
        this.createButton(3, 1, '*', 'Gs4', 'op');
        this.createButton(3, 2, '-', 'Fs4', 'op');
        this.createButton(3, 3, '+', 'Ds4', 'op');
        this.createButton(3, 4, '=', 'Cs4', 'op');
    }

    createButton(col, row, label, tone, type){
        const button = {
            col: col,
            row: row,
            label: label,
            tone: tone,
            type: type,
        }
        const colorIndex = this.getButtonColorIndex(type);
        button.background = this.add.rectangle(1, 1, 1, 1, 
            this.colorToHex(this.getColor(colorIndex))).setOrigin(0.5);
        button.background.setStrokeStyle(1, this.lineColor(colorIndex));    
        button.label = this.add.text(0, 0, label, { 
            fontFamily: 'Arial', 
            fontSize: '40px', 
            color: this.lineColor(colorIndex) 
        }).setOrigin(0.5);
        // Add Interaction
        button.background.setInteractive({ useHandCursor: true });
        button.background.on('pointerdown', () => {
            if (this.tweens.isTweening(button.background)) {
                return;
            }
            this.handleButtonPress(button);
            this.tweens.add({
                targets: [button.background, button.label],      // The object to tween
                scaleX: 0.9,        // The target horizontal scale
                scaleY: 0.9,        // The target vertical scale
                duration: 50,      // Duration of the tween in ms
                ease: 'Sine.easeInOut', // An easing function
                yoyo: true,         // Make the tween play in reverse once it completes
            });
            if (this.isSoundOn && button.tone != ''){
                this.sound.play(`tone${button.tone}`);
            }
        });

        this.buttons.push(button);
    }

    resize(gameSize){
        const { width, height } = gameSize;
        this.WORLD_WIDTH = width;
        this.WORLD_HEIGHT = height;
        // Top Buttons
        this.topBar.width = this.WORLD_WIDTH;
        for(let i = 0; i < this.topButtons.length; i++){
            let button = this.topButtons[i];
            let x = this.WORLD_WIDTH - this.TOP_BTN_SIZE * i - this.TOP_BTN_SIZE / 2 - this.TOP_BTN_GAP * (i + 1);
            button.background.setX(x);
            button.label.setX(x);
        }
        // Result Bar
        const hMargin = this.WORLD_WIDTH * 0.04;
        const vMargin = this.WORLD_HEIGHT * 0.04;
        const resultHeight = (this.WORLD_HEIGHT - this.TOP_BAR_HEIGHT) / 8;
        const rBar = this.resultBar.background;
        rBar.setPosition(hMargin, this.TOP_BAR_HEIGHT + vMargin);
        rBar.setSize(this.WORLD_WIDTH - hMargin * 2, resultHeight);
        this.resultBar.text.setPosition(rBar.x + rBar.width - hMargin / 2, 
            rBar.y + rBar.height / 2);
        this.resultBar.text.setFontSize(rBar.height - vMargin / 2);
        // Buttons
        const startX = rBar.x;
        const startY = rBar.y + rBar.height + vMargin;
        const buttonWidth = (rBar.width - hMargin / 2 * 3) / 4;
        const buttonHeight = (this.WORLD_HEIGHT - startY - vMargin * 6) / 5;
        for (let button of Object.values(this.buttons)){
            button.background.setSize(buttonWidth, buttonHeight);
            const x = startX + button.col * (button.background.width + hMargin / 2);
            const y = startY + button.row * (button.background.height + vMargin);
            button.background.setPosition(x + buttonWidth / 2, y + buttonHeight / 2);
            button.label.setPosition(button.background.x, button.background.y);
            button.label.setFontSize(buttonHeight / 2);
        }
    }

    colorToHex(hexString){
        const hex = hexString.slice(1);
        return parseInt(hex, 16);
    }

    getColor(index){
        return this.colors[index].color;
    }

    lineColor(index){
        return this.colors[index].type == 'light' ? "#000000" : "#ffffff";
    }

    getButtonColorIndex(type){
        switch(type){
            case 'num': return this.numColorIndex;
            case 'op': return this.opColorIndex;
            case 'util': return this.utilColorIndex;
            default: return 0;
        }
    }

    handleButtonPress(button){
        const label = button.label.text;
        if (!isNaN(label)) { // Is it a number?
            this.inputDigit(label);
        } else if (label === '.') {
            this.inputDecimal();
        } else if (label === 'C') {
            this.clearCalculator();
        } else if (label === '+/-') {
            this.flipSign();    
        } else if (label === '=') {
            this.performCalculation();
        } else {
            if (button.type === "num"){
                this.inputBackspace();
            }else{
                this.inputOperator(label);
            }
        }
        this.updateDisplay();
    }

    inputDigit(label){
        if (!this.isInputing){
            this.isInputing = true;
            this.inputValue = label;
        }else if(this.inputValue === '0'){
            this.inputValue = label;
        }else{
            const cleanValue = this.inputValue.replace('.', '').replace('-', '');
            if (cleanValue.length < 10)
                this.inputValue += label;
        }
    }

    flipSign(){
        if (!this.isInputing){
            this.resultValue = -this.resultValue;
        }else{
            this.inputValue = (-parseFloat(this.inputValue)).toString();
        }
    }

    inputDecimal(){
        if (!this.isInputing){
            this.isInputing = true;
            this.inputValue = "0.";
        }else{
            if (this.inputValue.indexOf('.') != -1) return;
            else this.inputValue += ".";
        }
    }

    inputBackspace(){
        if (!this.isInputing){
            this.inputValue = "0";
            return;
        }
        this.inputValue = this.inputValue.slice(0, -1);
        if (this.inputValue.length == 0) this.inputValue = "0";
    }

    inputOperator(label){
        if (this.isInputing){
            this.isInputing = false;
            this.operand = parseFloat(this.inputValue);
        }else{
            this.operand = this.resultValue;
        }
        this.operator = label;
    }

    performCalculation(){
        let firstOp = 0;
        let secondOp = 0;
        if (this.isInputing){
            this.isInputing = false;
            const input = parseFloat(this.inputValue);
            if (this.operator == null){
                this.resultValue = input;
                return;
            }
            firstOp = this.operand;
            secondOp = input;
            this.operand = secondOp;
        }else{
            if (this.operator == null){
                return;
            }
            firstOp = this.resultValue;
            secondOp = this.operand;
        }
        switch(this.operator){
            case '+': this.resultValue = firstOp + secondOp; break;
            case '-': this.resultValue = firstOp - secondOp; break;
            case '*': this.resultValue = firstOp * secondOp; break;
            case '/': this.resultValue = firstOp / secondOp; break;
            case '%': this.resultValue = firstOp % secondOp; break;
        }
    }

    clearCalculator() {
        this.inputValue = '0';
        this.resultValue = 0;
        this.isInputing = true;
        this.operand = null;
        this.operator = null;
    }

    updateDisplay() {
        if (this.isInputing){
            this.resultBar.text.setText(this.formatInputValue(this.inputValue));
        }else{
            this.resultBar.text.setText(this.formatResultNumber(this.resultValue));
        }
    }

    formatInputValue(valueStr){
        if (valueStr.indexOf('.') > -1){
            return valueStr.replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        }else{
            return valueStr.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        }
    }

    formatResultNumber(value){
        if (isNaN(value))
            return "Error"
        const absValue = Math.abs(value);
        const isDecimal = (value % 1 !== 0);

        if (absValue >= 10000000000 || isDecimal && absValue >= 1000000000){
            if (absValue < 1e10) return value.toExponential(6);
            else if (absValue < 1e100) return value.toExponential(5);
            else return value.toExponential(4);
        }

        if (isDecimal){
            const integerPartStr = String(Math.trunc(absValue));
            const integerDigitCount = integerPartStr.length;
            const maxDecimalPlaces = 10 - integerDigitCount;
            const roundedStr = value.toFixed(maxDecimalPlaces);
            const str = String(parseFloat(roundedStr));
            return str.replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        }else{
            return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        }

    }
}


const config = {
    type: Phaser.AUTO,
    // Set width and height to 100% to fill the parent container
    width: '100%',
    height: '100%',
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        // RESIZE mode makes the canvas fluid and responsive
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);