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
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: [] // Will be populated with scenes
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create simple graphics for assets
        this.makeGraphics('player', 0x0095DD, 32, 48); // Llipsia: Blue Penguin
        this.makeGraphics('ground', 0x654321, 32, 32); // Ground: Brown
        this.makeGraphics('platform', 0xAADDFF, 32, 32); // Ice Platform: Light Blue
        this.makeGraphics('enemy', 0xFF0000, 32, 32); // Chicken: Red
        this.makeGraphics('goal', 0xFFFFFF, 40, 48, 0.5); // Gasparín: White Ghost (alpha)
        this.makeGraphics('bullet', 0xFFC0CB, 10, 10); // Heart/Snowball: Pink

        // Mobile UI Assets
        this.makeCircle('btnDir', 0x888888, 50, 0.5);
        this.makeCircle('btnJump', 0x44FF44, 50, 0.5);
        this.makeCircle('btnAction', 0xFF4444, 50, 0.5);
    }

    create() {
        this.scene.start('GameScene', { lives: 3 });
    }

    makeGraphics(key, color, width, height, alpha = 1) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color, alpha);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    makeCircle(key, color, radius, alpha = 1) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color, alpha);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(key, radius * 2, radius * 2);
        graphics.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.cursors = null;
        this.score = 0;
        this.lives = 3;
        this.levelLength = 2000;

        // Input states from UI
        this.inputs = {
            left: false,
            right: false,
            jump: false,
            action: false
        };

        this.lastFired = 0;
    }

    init(data) {
        this.lives = data.lives !== undefined ? data.lives : 3;
        this.score = data.score !== undefined ? data.score : 0;
    }

    create() {
        // Environment
        this.cameras.main.setBackgroundColor('#87CEEB'); // Sky Blue

        // Create Ground and Platforms
        this.platforms = this.physics.add.staticGroup();

        // Ground floor
        for (let x = 0; x < this.levelLength; x += 32) {
            this.platforms.create(x, 434, 'ground').setOrigin(0, 0).refreshBody();
        }

        // Random Platforms
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(200, this.levelLength - 200);
            const y = Phaser.Math.Between(150, 350);
            this.platforms.create(x, y, 'platform');
        }

        // Player (Llipsia)
        this.player = this.physics.add.sprite(100, 350, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(false); // Can fall off world

        // Camera
        this.cameras.main.setBounds(0, 0, this.levelLength, 450);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // Goal (Gasparín)
        this.goal = this.physics.add.staticSprite(this.levelLength - 100, 350, 'goal');

        // Enemies (Chickens)
        this.enemies = this.physics.add.group();
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(300, this.levelLength - 300);
            const y = 100;
            const enemy = this.enemies.create(x, y, 'enemy');
            enemy.setBounce(1);
            enemy.setCollideWorldBounds(true);
            enemy.setVelocityX(Phaser.Math.Between(-50, 50) || 50);
        }

        // Bullets group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.goal, this.platforms);

        // Overlaps
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.shootEnemy, null, this);

        // Keyboard Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Launch UI Scene
        this.scene.launch('UIScene', { lives: this.lives, score: this.score });

        // Listen for UI events
        const uiScene = this.scene.get('UIScene');
        if (uiScene) {
            uiScene.events.on('input', (data) => {
                this.inputs = { ...this.inputs, ...data };
            });
        }
    }

    update(time, delta) {
        // Check if player fell off
        if (this.player.y > 500) {
            this.handlePlayerDeath();
            return;
        }

        const speed = 160;

        // Combined Input (Keyboard + Touch)
        if (this.cursors.left.isDown || this.inputs.left) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true;
        } else if (this.cursors.right.isDown || this.inputs.right) {
            this.player.setVelocityX(speed);
            this.player.flipX = false;
        } else {
            this.player.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.inputs.jump) && this.player.body.touching.down) {
            this.player.setVelocityY(-550);
        }

        if ((this.actionKey.isDown || this.inputs.action) && time > this.lastFired) {
            this.fireBullet();
            this.lastFired = time + 500;
        }

        // Simple enemy patrol (bounce off walls/platforms) is handled by physics bounce + collision
    }

    fireBullet() {
        const bullet = this.bullets.get(this.player.x, this.player.y);

        if (bullet) {
            bullet.enableBody(true, this.player.x, this.player.y, true, true);
            const velocity = this.player.flipX ? -300 : 300;
            bullet.setVelocity(velocity, -50);
            bullet.body.setAllowGravity(false);

            // Destroy bullet after time
            this.time.delayedCall(1000, () => {
                bullet.disableBody(true, true);
            });
        }
    }

    hitEnemy(player, enemy) {
        // Check if player jumped on enemy
        if (player.body.touching.down && enemy.body.touching.up) {
            enemy.disableBody(true, true);
            player.setVelocityY(-300); // Bounce up
            this.score += 100;
            this.updateUI();
        } else {
            this.handlePlayerDeath();
        }
    }

    shootEnemy(bullet, enemy) {
        bullet.disableBody(true, true);
        enemy.disableBody(true, true);
        this.score += 100;
        this.updateUI();
    }

    handlePlayerDeath() {
        this.lives--;
        this.updateUI();

        if (this.lives > 0) {
            this.scene.restart({ lives: this.lives, score: this.score });
        } else {
            // Game Over
            this.add.text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, 'GAME OVER\nTap to Restart', {
                fontSize: '32px',
                fill: '#fff',
                align: 'center',
                backgroundColor: '#000'
            }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
                this.scene.start('BootScene');
            });
            this.physics.pause();
        }
    }

    reachGoal(player, goal) {
        this.physics.pause();
        this.add.text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, 'YOU WON!\nFound Gasparín <3', {
            fontSize: '32px',
            fill: '#fff',
            align: 'center',
            backgroundColor: '#FF69B4'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.scene.start('BootScene');
        });
    }

    updateUI() {
        this.events.emit('updateScore', { lives: this.lives, score: this.score });
    }
}

class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    init(data) {
        this.lives = data.lives || 3;
        this.score = data.score || 0;
    }

    create() {
        // Setup buttons
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const btnRadius = 40;
        const padding = 20;

        // Helper to create interaction
        const createBtn = (x, y, key, type) => {
            const btn = this.add.image(x, y, key).setInteractive().setAlpha(0.6);
            btn.on('pointerdown', () => {
                this.updateInput(type, true);
                btn.setAlpha(1);
            });
            btn.on('pointerup', () => {
                this.updateInput(type, false);
                btn.setAlpha(0.6);
            });
            btn.on('pointerout', () => {
                this.updateInput(type, false);
                btn.setAlpha(0.6);
            });
            return btn;
        };

        // D-Pad / Movement
        createBtn(btnRadius + padding, height - btnRadius - padding, 'btnDir', 'left');
        createBtn(btnRadius * 3 + padding + 10, height - btnRadius - padding, 'btnDir', 'right');

        // Actions
        createBtn(width - btnRadius - padding, height - btnRadius - padding, 'btnJump', 'jump');
        createBtn(width - btnRadius * 3 - padding - 10, height - btnRadius - padding, 'btnAction', 'action');

        // HUD
        this.livesText = this.add.text(10, 10, `Lives: ${this.lives}`, { fontSize: '16px', fill: '#FFF' });
        this.scoreText = this.add.text(10, 30, `Score: ${this.score}`, { fontSize: '16px', fill: '#FFF' });

        // Listen for updates from GameScene
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('updateScore', (data) => {
                this.livesText.setText(`Lives: ${data.lives}`);
                this.scoreText.setText(`Score: ${data.score}`);
            });
        }
    }

    updateInput(key, value) {
        const data = {};
        data[key] = value;
        this.events.emit('input', data);
    }
}

// Initialize Game
config.scene = [BootScene, GameScene, UIScene];
const game = new Phaser.Game(config);
