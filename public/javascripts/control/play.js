/**
 * Created by JGallon on 2017/6/14.
 */
(function () {
    var timeouts = [];
    var messageName = "zero-timeout-message";

    function setZeroTimeout(fn) {
        timeouts.push(fn);
        window.postMessage(messageName, "*");
    }

    function handleMessage(event) {
        if (event.source == window && event.data == messageName) {
            event.stopPropagation();
            if (timeouts.length > 0) {
                var fn = timeouts.shift();
                fn();
            }
        }
    }

    window.addEventListener("message", handleMessage, true);

    window.setZeroTimeout = setZeroTimeout;
})();

var Neuvol;
var game;
var FPS = 60;
var maxScore = 0;
var cheat = false;
var cheatLim = 100000;
var images = {};
var flag = 0;
var gameover = false;

var speed = function (fps) {
    FPS = parseInt(fps);
}

var loadImages = function (sources, callback) {
    var nb = 0;
    var loaded = 0;
    var imgs = {};
    for (var i in sources) {
        nb++;
        imgs[i] = new Image();
        imgs[i].src = sources[i];
        imgs[i].onload = function () {
            loaded++;
            if (loaded == nb) {
                callback(imgs);
            }
        }
    }
}

var Game = function () {
    this.ganimation = null;
    this.cheatReady = false;
    this.pipes = [];
    this.bird = null;
    this.score = 0;
    this.canvas = document.querySelector("#play");
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.spawnInterval = 90;
    this.interval = 0;
    this.backgroundSpeed = 0.5;
    this.backgroundx = 0;
    this.maxScore = 0;
    this.cheatid = 0;
}

Game.prototype.start = function () {
    this.bird = new Bird();
    this.interval = 0;
    this.score = 0;
    this.pipes = [];
}

Game.prototype.update = function () {
    this.backgroundx += this.backgroundSpeed;
    var nextHoll = 0;
    for (var i = 0; i < this.pipes.length; i += 2) {
        if (this.pipes[i].x + this.pipes[i].width > this.bird.x) {
            nextHoll = this.pipes[i].height / this.height;
            break;
        }
    }

    // if (!this.cheatReady) {
    //     if (lgame.check(cheatLim))
    //         this.cheatReady = true;
    //     else
    //         this.cheatReady = false;
    // }

    if (this.bird.alive) {
        if (cheat) {
            if (lgame.check(cheatLim)) {
                var inputs = [
                    this.bird.y / this.height,
                    nextHoll
                ];
                var gen = lgame.getGen();
                var birds = lgame.getBird();
                var id = -1;
                for (var i in birds) {
                    if (birds[i].alive) {
                        id = i;
                        break;
                    }
                }
                if (id == -1)
                    id = 0;
                this.cheatid = id;
                var res = gen[id].compute(inputs);
                if (res > 0.5) {
                    this.bird.flap();
                }
            }
            else {
                cheat = false;
            }
        }
        this.bird.update();
        if (this.bird.isDead(this.height, this.pipes)) {
            this.bird.alive = false;
            if (this.isItEnd()) {
                // this.start();
                this.stopCanvas();
                gameover = true;

                $.ajax({
                    url: "/datas/updateScore",
                    data: {
                        score: this.score
                    },
                    type: "POST",
                    timeout: 36000,
                    dataType: "text",
                    success: function (data, textStatus) {
                        var dataJson = eval("(" + data + ")");
                        if (dataJson.code == 200) {
                            // make sever know you have finished
                            socket.emit('haveupdate');
                            // alert("添加成功");
                            // window.location.href = "/login";
                        } else {
                            // alert("添加失败");
                        }
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        alert("error:" + textStatus);
                    }
                });
                // needData();

            }
        }
    }


    for (var i = 0; i < this.pipes.length; i++) {
        this.pipes[i].update();
        if (this.pipes[i].isOut()) {
            this.pipes.splice(i, 1);
            i--;
        }
    }

    if (this.interval == 0) {
        var deltaBord = 50;
        var pipeHoll = 120;
        var hollPosition = Math.round(Math.random() * (this.height - deltaBord * 2 - pipeHoll)) + deltaBord;
        this.pipes.push(new Pipe({x: this.width, y: 0, height: hollPosition}));
        this.pipes.push(new Pipe({x: this.width, y: hollPosition + pipeHoll, height: this.height}));
    }

    this.interval++;
    if (this.interval == this.spawnInterval) {
        this.interval = 0;
    }

    this.score++;
    this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;
    var self = this;

    if (FPS == 0) {
        setZeroTimeout(function () {
            self.update();
        });
    } else {
        setTimeout(function () {
            self.update();
        }, 1000 / FPS);
    }
}


Game.prototype.isItEnd = function () {
    if (this.bird.alive)
        return false;
    else
        return true;
}

Game.prototype.display = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (var i = 0; i < Math.ceil(this.width / images.background.width) + 1; i++) {
        this.ctx.drawImage(images.background, i * images.background.width - Math.floor(this.backgroundx % images.background.width), 0)
    }

    for (var i in this.pipes) {
        if (i % 2 == 0) {
            this.ctx.drawImage(images.pipetop, this.pipes[i].x, this.pipes[i].y + this.pipes[i].height - images.pipetop.height, this.pipes[i].width, images.pipetop.height);
        } else {
            this.ctx.drawImage(images.pipebottom, this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, images.pipetop.height);
        }
    }

    this.ctx.fillStyle = "#FFC600";
    this.ctx.strokeStyle = "#CE9E00";
    if (this.bird.alive) {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(Math.PI / 2 * this.bird.gravity / 20);
        this.ctx.drawImage(images.bird, -this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        this.ctx.restore();
    }


    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Oswald, sans-serif";
    this.ctx.fillText("Score : " + this.score, 10, 25);
    // this.ctx.fillText("Max Score : " + this.maxScore, 10, 50);
    // this.ctx.fillText("Cheat Ready : " + this.cheatReady, 10, 75);
    // this.ctx.fillText("Cheat ID : " + this.cheatid, 10, 75);
    // this.ctx.fillText("Generation : " + this.generation, 10, 75);
    // this.ctx.fillText("Alive : " + this.alives + " / " + Neuvol.options.population, 10, 100);

    var self = this;
    ganimation = requestAnimationFrame(function () {
        self.display();
    });
}

Game.prototype.stopCanvas = function () {
    cancelAnimationFrame(ganimation);
    // this.ctx.clearRect(0, 0, this.width, this.height);
    // this.ctx.fillStyle = "#000000";
    // this.ctx.font = "20px Oswald, sans-serif";
    // this.ctx.fillText("Press 'Space' to Start", 10, 25);
    // this.ctx.fillStyle = '#fff';
    this.ctx.fillText("Press 'Space' to Start", 10, 50);
    this.ctx.font = "44px Oswald, sans-serif";
    this.ctx.fillText("Game over", 124, 274);
    // this.ctx.beginPath();
    // this.ctx.rect(0, 0, this.width, this.height);
    // this.ctx.closePath();
    // this.ctx.fill();
}

window.onload = function () {
    var sprites = {
        bird: "/images/bird.png",
        background: "/images/background.png",
        pipetop: "/images/pipetop.png",
        pipebottom: "/images/pipebottom.png"
    }

    var start = function () {
        game = new Game();
        game.start();
        game.update();
        game.display();
        Neuvol = new Neuroevolution({
            population: 50,
            network: [2, [2], 1],
        });
        lgame = new LGame();
        // console.log(lgame.height + " " + lgame.width);
        lgame.start();
        lgame.update();
    }


    loadImages(sprites, function (imgs) {
        images = imgs;
        Limages = imgs;
        start();
    })
}
document.onkeydown = function (event) {
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode == 32) { //space
        if (!gameover)
            if (!cheat)
                game.bird.flap();
            else {

            }
        else {
            game = new Game();
            game.start();
            game.update();
            game.display();
            gameover = false;
        }
    }
    if (e && e.keyCode == 67) { //c
        if (!cheat)
            cheat = true;
        else
            cheat = false;
    }
};