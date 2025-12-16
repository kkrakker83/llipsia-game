// Game Configuration
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 450, // Landscape 16:9 aspect ratio
        parent: 'game-container'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [] // Populated later
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Generate Emoji Textures
        this.createEmojiTexture('player', '🐧', 40);
        this.createEmojiTexture('enemy', '🐔', 40);
        this.createEmojiTexture('goal', '👻', 48);

        // Generate Environment Textures
        this.createSnowTexture('ground', 32, 32);
        this.createSnowTexture('platform', 32, 32);
        this.createGradientTexture('background', 800, 450, '#00FFFF', '#FFFFFF');

        // Particle Texture
        this.createCircleTexture('particle', 0xFF0000, 8);

        // UI Textures
        this.createButtonTexture('btnLeft', '⬅️', 80);
        this.createButtonTexture('btnRight', '➡️', 80);
        this.createButtonTexture('btnJump', '⬆️', 80);

        // Cloud Texture
        this.createCloudTexture('cloud');
    }

    create() {
        this.scene.start('StartScene');
    }

    createCloudTexture(key) {
        const width = 200;
        const height = 100;
        const rt = this.make.renderTexture({ width, height });

        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff, 0.9);

        // Draw cloud shape
        graphics.fillCircle(40, 60, 30);
        graphics.fillCircle(80, 50, 40);
        graphics.fillCircle(120, 60, 30);
        graphics.fillCircle(160, 60, 20);

        // Draw Text
        const text = this.make.text({
            text: 'Llipsia Castillo',
            style: {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#87CEEB', // Sky blue
                fontStyle: 'bold'
            }
        }).setOrigin(0.5);

        rt.draw(graphics, 0, 0);
        rt.draw(text, 100, 60);

        rt.saveTexture(key);

        graphics.destroy();
        text.destroy();
        rt.destroy();
    }

    createEmojiTexture(key, emoji, size) {
        const text = this.make.text({
            text: emoji,
            style: {
                fontSize: `${size}px`,
                fontFamily: 'Arial, "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                align: 'center'
            }
        });

        const width = text.width;
        const height = text.height;

        const rt = this.make.renderTexture({ width, height });
        rt.draw(text, 0, 0);
        rt.saveTexture(key);

        text.destroy();
        rt.destroy();
    }

    createSnowTexture(key, width, height) {
        const graphics = this.make.graphics();
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(0, 0, width, height);
        graphics.lineStyle(4, 0x87CEEB); // Sky Blue border
        graphics.strokeRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    createGradientTexture(key, width, height, colorTop, colorBottom) {
        const canvas = this.textures.createCanvas(key, width, height);
        const context = canvas.context;
        const grd = context.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, colorTop);
        grd.addColorStop(1, colorBottom);
        context.fillStyle = grd;
        context.fillRect(0, 0, width, height);
        canvas.refresh();
    }

    createCircleTexture(key, color, radius) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(key, radius * 2, radius * 2);
        graphics.destroy();
    }

    createButtonTexture(key, emoji, size) {
        const rt = this.make.renderTexture({ width: size, height: size });

        // Background circle
        const circle = this.make.graphics();
        circle.fillStyle(0xffffff, 0.3); // Semi-transparent white
        circle.fillCircle(size/2, size/2, size/2); // Draws at local coordinates

        // Emoji Text
        const text = this.make.text({
            text: emoji,
            style: {
                fontSize: `${size * 0.6}px`,
                fontFamily: 'Arial, "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                align: 'center'
            }
        }).setOrigin(0.5);

        rt.draw(circle, 0, 0);
        rt.draw(text, size/2, size/2);
        rt.saveTexture(key);

        circle.destroy();
        text.destroy();
        rt.destroy();
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    create() {
        // Background
        this.add.image(400, 225, 'background');

        // Clouds
        this.add.image(150, 100, 'cloud').setAlpha(0.8);
        this.add.image(650, 150, 'cloud').setAlpha(0.8).setScale(1.1);

        // Title
        this.add.text(400, 150, 'Llipsia: Aventura Invernal', {
            fontSize: '48px',
            fill: '#000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Play Button
        const playBtn = this.add.text(400, 300, 'JUGAR', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 40, y: 20 }
        }).setOrigin(0.5).setInteractive();

        playBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        playBtn.on('pointerover', () => playBtn.setScale(1.1));
        playBtn.on('pointerout', () => playBtn.setScale(1));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.jumps = 0;
        this.score = 0;
        this.lives = 3;
        this.inputs = { left: false, right: false, jump: false };
    }

    init(data) {
        this.lives = data.lives !== undefined ? data.lives : 3;
        this.score = data.score !== undefined ? data.score : 0;
        this.jumps = 0;
        this.isGameOver = false;
        this.inputs = { left: false, right: false, jump: false };
    }

    create() {
        this.isGameOver = false;

        // Fixed Background
        this.add.image(400, 225, 'background').setScrollFactor(0);

        // Clouds (Parallax)
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(0, 2000);
            const y = Phaser.Math.Between(50, 200);
            const scale = Phaser.Math.FloatBetween(0.8, 1.2);
            this.add.image(x, y, 'cloud')
                .setScrollFactor(0.1)
                .setScale(scale)
                .setAlpha(0.8);
        }

        // Level Generation
        this.platforms = this.physics.add.staticGroup();
        const levelWidth = 2000;
        this.physics.world.setBounds(0, 0, levelWidth, 450);

        // Ground
        for (let x = 0; x < levelWidth; x += 32) {
            this.platforms.create(x, 434, 'ground').setOrigin(0).refreshBody();
        }

        // Platforms
        for (let i = 0; i < 25; i++) {
            const x = Phaser.Math.Between(200, levelWidth - 200);
            const y = Phaser.Math.Between(100, 350);
            this.platforms.create(x, y, 'platform');
        }

        // Player
        this.player = this.physics.add.sprite(100, 350, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(0); // Use scene gravity

        // Camera
        this.cameras.main.setBounds(0, 0, levelWidth, 450);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Enemies
        this.enemies = this.physics.add.group();
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(400, levelWidth - 300);
            const y = 100;
            const enemy = this.enemies.create(x, y, 'enemy');
            enemy.setBounce(1);
            enemy.setCollideWorldBounds(true);
            enemy.setVelocityX(Phaser.Math.Between(-80, 80) || 50);
        }

        // Goal
        this.goal = this.physics.add.staticSprite(levelWidth - 100, 350, 'goal');

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.goal, this.platforms); // Just in case

        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI
        this.scene.launch('UIScene', { score: this.score, lives: this.lives });
        const uiScene = this.scene.get('UIScene');
        if (uiScene) {
            uiScene.events.on('input', (data) => {
                this.inputs = { ...this.inputs, ...data };
            });
        }

        // Jump state tracking
        this.prevJumpState = false;
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Death check (fall)
        if (this.player.y > 450) {
            this.handleDeath();
            return;
        }

        const speed = 200;
        const isLeft = this.cursors.left.isDown || this.inputs.left;
        const isRight = this.cursors.right.isDown || this.inputs.right;
        const isJump = this.cursors.up.isDown || this.inputs.jump;

        // Horizontal Movement
        if (isLeft) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true); // Face left
        } else if (isRight) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false); // Face right
        } else {
            this.player.setVelocityX(0);
        }

        // Jump Logic (Double Jump)
        const onFloor = this.player.body.touching.down;

        if (onFloor) {
            this.jumps = 0;
        }

        if (isJump && !this.prevJumpState) {
            // Jump pressed just now
            if (onFloor || this.jumps < 2) {
                this.player.setVelocityY(-450);
                this.jumps++;
            }
        }
        this.prevJumpState = isJump;
    }

    hitEnemy(player, enemy) {
        if (this.isGameOver) return;

        if (enemy.body.touching.up && player.body.touching.down) {
            // Kill Enemy
            enemy.disableBody(true, true);
            player.setVelocityY(-300); // Bounce
            this.score += 100;
            this.events.emit('updateScore', { score: this.score });

            // Particles
            const particles = this.add.particles(0, 0, 'particle', {
                speed: 100,
                scale: { start: 1, end: 0 },
                blendMode: 'ADD',
                lifespan: 500,
                quantity: 10
            });
            particles.explode(10, enemy.x, enemy.y);
        } else {
            // Kill Player
            this.handleDeath();
        }
    }

    handleDeath() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();
        this.cameras.main.shake(300, 0.02);

        this.time.delayedCall(500, () => {
            this.lives--;
            this.scene.stop('UIScene'); // Clean up UI before restart/end

            if (this.lives > 0) {
                this.scene.restart({ lives: this.lives, score: this.score });
            } else {
                this.add.rectangle(0, 0, 800, 450, 0x000000, 0.7).setOrigin(0).setScrollFactor(0);
                this.add.text(400, 225, 'GAME OVER', { fontSize: '40px', fill: '#fff' })
                    .setOrigin(0.5).setScrollFactor(0)
                    .setInteractive().on('pointerdown', () => this.scene.start('StartScene'));
            }
        });
    }

    reachGoal(player, goal) {
        this.physics.pause();
        this.isGameOver = true;
        this.scene.stop('UIScene'); // Clean up UI

        this.add.rectangle(0, 0, 800, 450, 0x000000, 0.7).setOrigin(0).setScrollFactor(0);
        this.add.text(400, 200, '¡Encontraste a tu amor!', {
            fontSize: '32px',
            fill: '#FF69B4',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        this.add.text(400, 300, 'Toca para volver', { fontSize: '24px', fill: '#fff' })
            .setOrigin(0.5).setScrollFactor(0)
            .setInteractive().on('pointerdown', () => this.scene.start('StartScene'));
    }
}

class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    init(data) {
        this.score = data.score || 0;
        this.lives = data.lives || 3;
    }

    create() {
        // Multi-touch support
        this.input.addPointer(3);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const btnSize = 80;
        const padding = 20;

        // Score Text
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, { fontSize: '20px', fill: '#000', fontStyle: 'bold' });
        this.livesText = this.add.text(20, 50, `Lives: ${this.lives}`, { fontSize: '20px', fill: '#000', fontStyle: 'bold' });

        // Update listener
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('updateScore', (data) => {
                if (data.score !== undefined) this.scoreText.setText(`Score: ${data.score}`);
            });
        }

        // Buttons
        // Left
        this.createBtn(padding + btnSize/2, height - padding - btnSize/2, 'btnLeft', 'left');
        // Right
        this.createBtn(padding + btnSize * 1.5 + 10, height - padding - btnSize/2, 'btnRight', 'right');
        // Jump
        this.createBtn(width - padding - btnSize/2, height - padding - btnSize/2, 'btnJump', 'jump');
    }

    createBtn(x, y, key, type) {
        // Larger hit area for easier touch (Radius 60 = 120px diameter)
        const hitArea = new Phaser.Geom.Circle(40, 40, 60);
        const btn = this.add.image(x, y, key)
            .setInteractive(hitArea, Phaser.Geom.Circle.Contains)
            .setAlpha(0.5);

        btn.on('pointerdown', () => {
            this.events.emit('input', { [type]: true });
            btn.setAlpha(1);
        });
        btn.on('pointerup', () => {
            this.events.emit('input', { [type]: false });
            btn.setAlpha(0.5);
        });
        btn.on('pointerout', () => {
            this.events.emit('input', { [type]: false });
            btn.setAlpha(0.5);
        });
    }
}

config.scene = [BootScene, StartScene, GameScene, UIScene];
const game = new Phaser.Game(config);
