class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

    }

    create() {
        // -- Setup World --
        this.WORLD_WIDTH = this.scale.width;
        this.WORLD_HEIGHT = this.scale.height;
        this.input.addPointer(1); // Add 1 additional pointer
        // -- Setup Background Color --
        this.cameras.main.setBackgroundColor('#333333');
        // --- Create Top Bar ---
        this.createTopBar();
        // --- Create Main Buttons ---
        this.createMainButtons();
        // --- Create Main Viewport ---
        this.createImageView();
        // --- Create Enhance Buttons ---
        this.createEnhanceButtons();
        // --- Setup Handlers ---
        this.setupFileInput();
        this.setupGestures();
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
        this.titleText = this.add.text(12, 0, 'Photo Enhancer', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0, 0.5);
        this.titleText.setY(this.topBar.height / 2);
    }

    createMainButtons(){
        this.mainButtons = [];
        this.createMainButton('Load', true);
        this.createMainButton('Save', false);
        this.createMainButton('Enhance', false);
        this.createMainButton('Close', false);
        this.toggleMainButtons();
    }

    createMainButton(label, enabled){
        const button = {
            enabled: enabled
        }
        button.background = this.add.rectangle(1, 1, 1, 1, 0x555555).setOrigin(0.5);
        button.background.setStrokeStyle(1, 0xffffff);    
        button.label = this.add.text(0, 0, label, { 
            fontFamily: 'Arial', 
            fontSize: '40px', 
            color: '#ffffff'
        }).setOrigin(0.5);
        // Add Interaction
        button.background.setInteractive({ useHandCursor: true });
        button.background.on('pointerdown', (pointer, x, y, event) => {
            if (!button.enabled) return;
            if (this.tweens.isTweening(button.background)) {
                return;
            }
            // Stop the click from closing the menu immediately
            if (label === 'Enhance') {
                event.stopPropagation();
            }
            this.handleMainButtonPress(button);
            this.tweens.add({
                targets: [button.background, button.label],      // The object to tween
                scaleX: 0.9,        // The target horizontal scale
                scaleY: 0.9,        // The target vertical scale
                duration: 50,      // Duration of the tween in ms
                ease: 'Sine.easeInOut', // An easing function
                yoyo: true,         // Make the tween play in reverse once it completes
            });
        });

        this.mainButtons.push(button);
    }

    createImageView(){
        this.imageViewBorder = this.add.rectangle(0, 0, 
            1, 1, 0x333333);
        this.imageViewBorder.setStrokeStyle(1, 0xcccccc);   
        this.mainImage = null;
        this.imageViewCamera = this.cameras.add(1,1,1,1,false,"imageView");
        this.welcomeText = this.add.text(1, 1, "Load an Image to begin =)", {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        // Create Image View Buttons
        this.viewButtons = [];
        this.createViewButton("+", () => { 
            if (this.mainImage) this.mainImage.setScale(this.mainImage.scaleX * 1.05);
        });
        this.createViewButton("-", () => {
             if (this.mainImage) this.mainImage.setScale(this.mainImage.scaleY / 1.05);
        });
        this.createViewButton("◎", () => { this.resetImagePosition(); });
    }

    createViewButton(text, callback){
        const button = {}
        const btnSize = 24;
        button.background = this.add.rectangle(0, 0, btnSize, btnSize, 0x111111).setStrokeStyle(2, 0xffffff);
        button.label = this.add.text(0, 0, text, { fontSize: '18px', fontFamily: 'serif',
            color: '#ffffff'}).setOrigin(0.5);
        button.background.setDepth(100).setVisible(false);
        button.label.setDepth(100).setVisible(false);
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
        //this.cameras.main.ignore(button.background);
        //this.cameras.main.ignore(button.label);
        this.viewButtons.push(button);
    }

    resize(gameSize){
        const { width, height } = gameSize;
        this.WORLD_WIDTH = width;
        this.WORLD_HEIGHT = height;
        // Top Bar
        this.topBar.width = this.WORLD_WIDTH;
        // Main Buttons
        const hGap = 8;
        const vGap = 4;
        const buttonHeight = 32;
        const buttonWidth = (this.WORLD_WIDTH - hGap * 5) / 4;
        let startX = hGap + buttonWidth / 2;
        let startY = this.TOP_BAR_HEIGHT + vGap + buttonHeight / 2;
        for(let i = 0; i < this.mainButtons.length; i++){
            const button = this.mainButtons[i];
            button.background.setSize(buttonWidth, buttonHeight);
            button.background.setPosition(startX + (buttonWidth + hGap) * i, startY);
            button.label.setPosition(button.background.x, button.background.y);
            button.label.setFontSize(buttonHeight / 2);
        }
        // Image View
        const rect = this.mainButtons[0].background;
        this.imageViewBorder.setSize(this.WORLD_WIDTH - 2 * hGap,
            this.WORLD_HEIGHT - (rect.y + rect.height) - vGap);
        this.imageViewBorder.setPosition(hGap + this.imageViewBorder.width / 2,
             rect.y + rect.height - vGap + this.imageViewBorder.height / 2);    
        this.welcomeText.setPosition(this.imageViewBorder.x, this.imageViewBorder.y);
        // Camera
        this.imageViewCamera.setPosition(this.imageViewBorder.x - this.imageViewBorder.width / 2, this.imageViewBorder.y - this.imageViewBorder.height / 2);
        this.imageViewCamera.setScroll(this.imageViewCamera.x, this.imageViewCamera.y)
        this.imageViewCamera.setSize(this.imageViewBorder.width, this.imageViewBorder.height);
        this.resetImagePosition();
        // View Buttons
        const bGap = 8;
        const bSize = 24;
        startX = this.imageViewBorder.x - this.imageViewBorder.width / 2 + bSize / 2 + bGap;
        startY = this.imageViewBorder.y + this.imageViewBorder.height / 2 - bSize / 2 - bGap;
        for(let i = 0; i < this.viewButtons.length; i++){
            let button = this.viewButtons[i];
            button.background.setPosition(startX + (button.background.width + bGap) * i, startY);
            button.label.setPosition(button.background.x, button.background.y);
        }

        if (this.enhanceButton && this.enhanceDropdownContainer) {
            const enhanceBtnBg = this.enhanceButton.background;
            const dropdownBtnWidth = Math.max(enhanceBtnBg.width / 2, 120);
            const dropdownBtnHeight = enhanceBtnBg.height;
            //const dropdownHGap = 4;

            // Reposition and resize buttons inside the container
            for (let i = 0; i < this.enhanceButtons.length; i++) {
                const button = this.enhanceButtons[i];
                const col = i % 2; // 0 for left, 1 for right
                const row = Math.floor(i / 2);

                const xPos = (col === 0) 
                    ? -(dropdownBtnWidth / 2) // Position for left column
                    : (dropdownBtnWidth / 2); // Position for right column
                
                const yPos = row * dropdownBtnHeight + dropdownBtnHeight / 2;

                button.background.setSize(dropdownBtnWidth, dropdownBtnHeight);
                button.background.setPosition(xPos, yPos);
                button.label.setPosition(xPos, yPos);
                button.label.setFontSize(dropdownBtnHeight / 2);
            }
            
            // Position the container itself. Its origin is top-center.
            this.enhanceDropdownContainer.x = enhanceBtnBg.x;
            this.dropdownFinalY = enhanceBtnBg.y + enhanceBtnBg.height / 2 + vGap;

            // If the dropdown is currently open, snap it to the new final Y.
            if (this.isEnhanceDropdownOpen) {
                 this.enhanceDropdownContainer.y = this.dropdownFinalY;
            }
        }
    }

    toggleMainButtons(){
        for(let button of this.mainButtons){
            if (!button.enabled){
                button.label.setColor('#808080');
                button.background.setStrokeStyle(1, 0x808080); 
            }else{
                button.label.setColor('#ffffff');
                button.background.setStrokeStyle(1, 0xffffff); 
            }
        }
    }

    handleMainButtonPress(button){
        switch(button.label.text){
            case "Load": this.loadImage(); break;
            case "Save": this.saveImage(); break;
            case "Enhance": this.enhanceDropDown(); break;
            case "Close": this.closeImage(); break;
        }
    }

    createEnhanceButtons(){
        this.isEnhanceDropdownOpen = false;
        this.enhanceButton = this.mainButtons.find(b => b.label.text === 'Enhance');
        
        this.enhanceDropdownContainer = this.add.container(0, 0);
        this.enhanceDropdownContainer.setVisible(false).setAlpha(0).setDepth(10);

        this.enhanceButtons = [];
        const enhanceOptions = ['Brighten', 'Darken', 'Sharpen', 'Saturate', 'Hue Shift', 'Greyscale', 'Sepia',
            'Negative', 'Trippy', 'Brown', 'Vintage', 'Kodachrome', 'Techni', 'Polaroid', 
            'ShiftBGR', 'Reset'
        ];
        const vGap = 4;

        for (let i = 0; i < enhanceOptions.length; i++) {
            const option = enhanceOptions[i];
            const button = {};
            
            button.background = this.add.rectangle(0, 0, 1, 1, 0x4a4a4a).setOrigin(0.5);
            button.background.setStrokeStyle(1, 0xbbbbbb);    
            button.label = this.add.text(0, 0, option, { 
                fontFamily: 'Arial', 
                fontSize: '16px', 
                color: '#ffffff'
            }).setOrigin(0.5);
            
            button.background.setPosition(0, i * (32 + vGap)); // Placeholder height
            button.label.setPosition(button.background.x, button.background.y);

            button.background.setInteractive({ useHandCursor: true });
            button.background.on('pointerdown', (pointer, x, y, event) => {
                this.handleEnhanceButtonPress(button);
                this.tweens.add({
                    targets: [button.background, button.label],
                    scaleX: 0.9,       
                    scaleY: 0.9,       
                    duration: 50,    
                    ease: 'Sine.easeInOut', 
                    yoyo: true,
                    onComplete: () => {
                        this.closeEnhanceDropdown(false);
                    }  
                });
                event.stopPropagation();
            });

            this.enhanceButtons.push(button);
            this.enhanceDropdownContainer.add([button.background, button.label]);
            this.input.on('pointerdown', () => {
                if (this.isEnhanceDropdownOpen) {
                    this.closeEnhanceDropdown();
                }
            });
        }
    }
	
	enhanceDropDown(){
		if (this.isEnhanceDropdownOpen) {
            this.closeEnhanceDropdown();
        } else {
            this.openEnhanceDropdown();
        }
	}

    openEnhanceDropdown() {
        if (this.isEnhanceDropdownOpen) return;
        this.isEnhanceDropdownOpen = true;

        this.enhanceDropdownContainer.setVisible(true);
        this.enhanceDropdownContainer.y = this.enhanceButton.background.y;
        this.enhanceDropdownContainer.setAlpha(0);

        this.tweens.add({
            targets: this.enhanceDropdownContainer,
            y: this.dropdownFinalY,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
    }

    closeEnhanceDropdown(animation=true) {
        if (!this.isEnhanceDropdownOpen) return;
        this.isEnhanceDropdownOpen = false;

        if (animation){
            this.tweens.add({
                targets: this.enhanceDropdownContainer,
                y: this.enhanceButton.background.y,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    this.enhanceDropdownContainer.setVisible(false);
                }
            });
        }else{
            this.enhanceDropdownContainer.setVisible(false);
        }
    }

    handleEnhanceButtonPress(button){
        if (!this.colorMatrix) return;
        switch(button.label.text){
            case "Brighten": this.colorMatrix.brightness(1.2, true); break;
            case "Darken": this.colorMatrix.brightness(0.8, true); break;
            case "Sharpen": this.colorMatrix.contrast(0.2, true); break;
            case "Saturate": this.colorMatrix.saturate(1.2, true); break;
            case "Hue Shift": this.colorMatrix.hue(30, true); break;
            case "Greyscale": this.colorMatrix.grayscale(1, true); break;
            case "Trippy": this.colorMatrix.lsd(true); break;
            case "Negative": this.colorMatrix.negative(true); break;
            case "Sepia": this.colorMatrix.sepia(true); break;
            case "Brown": this.colorMatrix.brown(true); break;
            case "Vintage": this.colorMatrix.vintagePinhole(true); break;
            case "Kodachrome": this.colorMatrix.kodachrome(true); break;
            case "Techni": this.colorMatrix.technicolor(true); break;
            case "Polaroid": this.colorMatrix.polaroid(true); break;
            case "ShiftBGR": this.colorMatrix.shiftToBGR(true); break;
            case "Reset": 
                this.colorMatrix.reset();
                break;
        }
    }

    loadImage(){
        document.getElementById('file-input').click();
    }

    saveImage(){
        this.asyncSaveImage();
    }

    async asyncSaveImage() {
        // 1. --- SETUP AND VALIDATION ---
        if (!this.mainImage || !this.textures.exists('image-texture')) {
            console.warn("No image to save.");
            return;
        }
        console.log("Starting tiled save process...");

        // Define the size of each tile to process.
        const TILE_SIZE = Math.min(this.WORLD_WIDTH, this.WORLD_HEIGHT) - 4;

        // Get the original image's full dimensions.
        const source = this.textures.get('image-texture').getSourceImage();
        const originalWidth = source.width;
        const originalHeight = source.height;

        // Create the off-screen canvas that we will stitch the final image onto.
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = originalWidth;
        finalCanvas.height = originalHeight;
        const stitchContext = finalCanvas.getContext('2d');

        // Create the on-screen TileSprite used to render each piece.
        // It's placed at the top-left corner of the screen.
        // We add 4 at the sides to avoid edge issues.
        const tile = this.add.tileSprite(0, 0, TILE_SIZE + 4, TILE_SIZE + 4, 'image-texture').setOrigin(0);
        tile.setDepth(10000);

        // Crucially, copy the postFX from the main image to the tile.
        if (this.colorMatrix) {
            const tempMatrix = tile.postFX.addColorMatrix();
            tempMatrix.getData().set(this.colorMatrix.getData());
        }

        // Helper function to wrap snapshotArea in a Promise.
        const snapshotAreaAsPromise = (x, y, width, height) => {
            return new Promise(resolve => this.renderer.snapshotArea(x, y, width, height, resolve));
        };
        
        // Helper function to wait for the next render frame, ensuring the tile is drawn.
        const waitForNextFrame = () => {
            return new Promise(resolve => this.renderer.once('postrender', resolve));
        };

        // 2. --- SEQUENTIAL TILE PROCESSING ---
        const rows = Math.ceil(originalHeight / TILE_SIZE);
        const cols = Math.ceil(originalWidth / TILE_SIZE);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const currentX = col * TILE_SIZE;
                const currentY = row * TILE_SIZE;
                
                // Update the TileSprite's properties for the current piece.
                tile.setTilePosition(currentX, currentY);

                // Wait for Phaser's renderer to draw the updated tile.
                await waitForNextFrame();
                
                console.log(`Processing tile at [${col}, ${row}]...`);

                // Snapshot the rendered tile from the screen.
                const snapshot = await snapshotAreaAsPromise(0, 0, tile.width, tile.height);

                // Draw the captured snapshot onto our final canvas at the correct position.
                stitchContext.drawImage(snapshot, currentX, currentY);
            }
        }
        
        // 3. --- FINALIZATION AND CLEANUP ---
        console.log("Stitching complete. Triggering download...");

        // Trigger the browser download of the final stitched image.
        const link = document.createElement('a');
        link.href = finalCanvas.toDataURL('image/png');
        link.download = `${this.imageFileName}-${Date.now()}.png`;
        link.click();
        
        // Destroy the temporary TileSprite to clean up the scene.
        tile.destroy();
    }

    closeImage(){
        this.unloadImage(); 
        this.mainButtons[0].enabled = true;
        this.toggleMainButtons();
        this.welcomeText.setText("Load an Image to begin =)");
    }

setupFileInput() {
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', event => {
            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                const fullFilename = file.name;
                const lastDotIndex = fullFilename.lastIndexOf('.');
                const filenameWithoutExt = (lastDotIndex === -1) ? fullFilename : fullFilename.substring(0, lastDotIndex);
                this.imageFileName = filenameWithoutExt;

                const reader = new FileReader();

                // Make the reader's onload callback an async function
                reader.onload = async e => {
                    this.unloadImage();
                    this.textures.remove(`image-texture`);

                    // Use 'await' to wait for the resizeImage promise to complete
                    const resizedBase64 = await this.resizeImage(e.target.result);

                    this.textures.addBase64(`image-texture`, resizedBase64);
                    this.textures.once('addtexture', () => {
                        this.time.delayedCall(100, () => this.displayImage());
                    }, this);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    resizeImage(base64) {
        return new Promise((resolve, reject) => {
            const MAX_DIMENSION = 1536;
            const image = new Image();

            image.onload = () => {
                const width = image.width;
                const height = image.height;

                // 1. If the image is already within bounds, do nothing.
                if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
                    resolve(base64); // Return the original base64
                    return;
                }

                // 2. Calculate the new dimensions while preserving the aspect ratio.
                let newWidth, newHeight;
                if (width > height) {
                    newWidth = MAX_DIMENSION;
                    newHeight = (height * MAX_DIMENSION) / width;
                } else {
                    newHeight = MAX_DIMENSION;
                    newWidth = (width * MAX_DIMENSION) / height;
                }

                // 3. Use a canvas to perform the resize.
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                
                // Draw the resized image onto the canvas.
                ctx.drawImage(image, 0, 0, newWidth, newHeight);
                
                // 4. Export the canvas content to a new base64 string.
                // Using 'image/png' is a safe default. Use 'image/jpeg' for photos.
                resolve(canvas.toDataURL('image/png'));
            };
            
            image.onerror = (err) => {
                reject('Failed to load image for resizing.');
            };

            // Trigger the onload event by setting the image source.
            image.src = base64;
        });
    }

    setupGestures(){
        // Pinch to zoom
        let lastDistance = 0;
        this.input.on('pointermove', (p) => {
            const bounds = this.imageViewBorder.getBounds();
            const pointer1 = this.input.pointer1;
            const pointer2 = this.input.pointer2;
            if (this.input.pointer1.isDown && this.input.pointer2.isDown && this.mainImage
                 && bounds.contains(pointer1.x, pointer1.y) && bounds.contains(pointer2.x, pointer2.y)) {
                const distance = Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y);
                if (lastDistance > 0) {
                    const newScale = this.mainImage.scaleX * (distance / lastDistance);
                    this.mainImage.setScale(newScale);
                }
                lastDistance = distance;
            }
        });
        this.input.on('pointerup', () => { lastDistance = 0; });
    }

    displayImage() {
        this.welcomeText.setAlpha(0);
        if (this.mainImage) {
            this.mainImage.destroy();
        }
        this.mainImage = this.add.image(this.scale.width / 2, this.scale.height / 2, "image-texture");
        this.colorMatrix = this.mainImage.postFX.addColorMatrix();
        this.resetImagePosition();
        this.cameras.main.ignore(this.mainImage);
        this.mainImage.setInteractive({ useHandCursor: true, draggable: true });
        this.input.on('drag', (pointer, gameObject, dragX, dragY) =>
        {
            if (gameObject === this.mainImage){
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });
        // Enable Buttons
        for (let button of this.mainButtons){
            button.enabled = true;
        }
        this.toggleMainButtons();
        for (let button of this.viewButtons){
            button.background.setVisible(true);
            button.label.setVisible(true);
        }
    }

    resetImagePosition(){
        if (!this.mainImage) return;
        this.mainImage.setPosition(this.imageViewBorder.x, this.imageViewBorder.y);
        const widthRatio  = this.imageViewBorder.width / this.mainImage.width;
        const heightRatio  =  this.imageViewBorder.height / this.mainImage.height;

        this.mainImage.setScale(Math.min(widthRatio, heightRatio));
    }

    unloadImage(){
        if (this.mainImage){ this.mainImage.destroy(); }
        this.welcomeText.setText("Loading Image...");
        this.welcomeText.setAlpha(1);
        for (let button of this.mainButtons){
            button.enabled = false;
        }
        this.toggleMainButtons();
        for (let button of this.viewButtons){
            button.background.setVisible(false);
            button.label.setVisible(false);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    // Set width and height to 100% to fill the parent container
    width: '100%',
    height: '100%',
    parent: 'game-container',
    backgroundColor: '#333333',
    scale: {
        // RESIZE mode makes the canvas fluid and responsive
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);