class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        this.ACCELERATION = 240;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 800;
        this.JUMP_VELOCITY = 0;
        this.JUMP_TIMER = 0;
        this.JUMP = false;
        this.TIMER = 0;
        this.score = 0;
        this.PARTICLE_VELOCITY = 50;
        this.soundCD = 0;
    }

    create() {

        this.timer = this.time.delayedCall(1000, this.timerUpdate, [], this);

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 20*16, 170*100);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.5);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
    

        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 2
        });

        this.endFlag = this.map.createFromObjects("Objects", {
            name: "end_flag",
            key: "tilemap_sheet",
            frame: 201
        });

        for (let coin of this.coins){
            coin.x = coin.x*2.5;
            coin.y = coin.y*2.5;
            coin.setScale(2.5);
        }
        this.endFlag[0].x = this.endFlag[0].x*2.5;
        this.endFlag[0].y = this.endFlag[0].y*2.5;
        this.endFlag[0].setScale(2.5);
        

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.endFlag, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(90, 6730, "platformer_characters", "tile_0000.png").setScale(1.5);
        //my.sprite.player.scaleX =  my.sprite.player.scaleX*2
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.score++;
            my.vfx.scoreUp.x = obj2.x;
            my.vfx.scoreUp.y = obj2.y;
            this.sound.play("coinGrab", {volume: 0.1});
            my.vfx.scoreUp.start();
            setTimeout(function(){
                my.vfx.scoreUp.stop();
            }, 500);
            
        });

        this.physics.add.overlap(my.sprite.player, this.endFlag, (obj1, obj2) => {
            console.log("GAME OVER");
            this.scene.stop("Platformer");
            this.walkingSFX.stop();
            this.scene.start("GO", {time: this.TIMER, coins: this.score})
        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        this.physics.world.drawDebug =  false;


        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_10.png'],
            // TODO: Try: add random: true
            scale: {start: 0.0000001, end: 0.08, random: true},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            maxAliveParticles: 8,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1, gravity: -400}, 
        });

        my.vfx.scoreUp = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_08.png', 'star_09.png', 'star_07.png','star_06.png','star_05.png',],
            scale: {start: 0.3, end: 0.001, random: true},
            lifespan: 400,
        });

        my.vfx.chargingJump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['trace_03.png', 'spark_02.png', 'trace_04.png','spark_04.png','trace_07.png','spark_03.png'],
            // TODO: Try: add random: true
            scale: {start: 0.4, end: 0.2, random: true},
            lifespan: 300,
            alpha: 0.2
        });

        my.vfx.walking.stop();
        

        // TODO: add camera code here//4100
        this.cameras.main.setBounds(42, 0, this.map.widthInPixels, this.map.heightInPixels*16);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        console.log(this.map.widthInPixels+ " " +  this.map.heightInPixels);

        this.physics.world.TILE_BIAS = 64;
        this.walkingSFX = this.sound.add("walking", {loop: true});
        

    }

    update() {
        
        if(cursors.left.isDown) {
            my.sprite.player.setVelocityX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

            if (this.soundCD == 0){
                this.walkingSFX.play({volume: 0.15});
                this.soundCD = 10;
            }

            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            } else {
                this.walkingSFX.stop();
                my.vfx.walking.stop();
                this.soundCD == 0;
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setVelocityX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            if (this.soundCD == 0){
                console.log("playing");
                this.walkingSFX.play({volume: 0.15});
                this.soundCD = 10;
            }
            
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
                
                
            } else {
                this.walkingSFX.stop();
                my.vfx.walking.stop();
                this.soundCD == 0;
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
            this.walkingSFX.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            this.JUMP_TIMER++;
        } else {
            if (!cursors.up.isDown && this.JUMP_TIMER != 0){
                this.JUMP_TIMER = 0;
                this.sound.play("jumpLand", {volume: 0.2});
            }
            if(cursors.up.isDown & this.JUMP_VELOCITY >=-810) {
                this.sound.play("jumpCharge", {volume: 0.008, rate: 2.3});
                my.vfx.chargingJump.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                my.vfx.chargingJump.start();
                this.JUMP_VELOCITY-= 30;
            } else {my.vfx.chargingJump.stop();}
            //this.JUMP_TIMER = 502;
        }

        if(cursors.up.isUp && this.JUMP_VELOCITY < 0) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.JUMP_VELOCITY = 0;
            this.sound.play("jumpSFX", {volume: 0.1});
        }
        if (this.soundCD > 0){this.soundCD--;}

    }

    timerUpdate(){
        this.TIMER++;
        this.time.delayedCall(1000, this.timerUpdate, [], this);
    }
}