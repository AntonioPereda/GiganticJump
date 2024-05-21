class GO extends Phaser.Scene {
    constructor() {
        super("GO");
    }

    init(data) {
        this.score = data.coins;
        this.time = data.time;
    }

    create(){
        console.log(this.score);
        console.log(this.time);
        this.finalScore = Math.ceil(((1/this.time) * 100) * (this.score+1));
        this.add.text(250, 100, "FINAL SCORE").setScale(3);
        this.add.text(350, 200, this.finalScore).setScale(4.5);

        this.add.text(50, 300, "Press ENTER to try again").setScale(3);
        this.add.text(30, 350, "TIP: go fast and collect as many coins as possible!").setScale(1.5);

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);   
    }

    update(){

        if(this.enterKey.isDown){
            this.scene.stop("GO");
            this.scene.start("platformerScene");
        }

    }

}