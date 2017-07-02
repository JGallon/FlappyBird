/**
 * Created by JGallon on 2017/6/15.
 */

var Neuvol;
var LGame;
var LFPS = 0;
var LmaxScore = 0;

var Limages = {};

// var speed = function (fps) {
//     LFPS = parseInt(fps);
// }

var LloadImages = function (sources, callback) {
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

var LGame = function () {
    this.pipes = [];
    this.birds = [];
    this.score = 0;
    // this.canvas = document.querySelector("#learn");
    // this.ctx = this.canvas.getContext("2d");
    // this.width = this.canvas.width;
    // this.height = this.canvas.height;
    this.width = 500;
    this.height = 512;
    this.spawnInterval = 90;
    this.interval = 0;
    this.gen = [];
    this.alives = 0;
    this.generation = 0;
    this.backgroundSpeed = 0.5;
    this.backgroundx = 0;
    this.LmaxScore = 0;
}

LGame.prototype.check = function (lim) {
    if (this.LmaxScore >= lim)
        return true;
    else
        return false;
}

LGame.prototype.getBird = function () {
    return this.birds;
}

LGame.prototype.getGen = function () {
    return this.gen;
}

LGame.prototype.start = function () {
    this.interval = 0;
    this.score = 0;
    this.pipes = [];
    this.birds = [];

    this.gen = Neuvol.nextGeneration();
    for (var i in this.gen) {
        var b = new Bird();
        this.birds.push(b)
    }
    this.generation++;
    this.alives = this.birds.length;
}

LGame.prototype.update = function () {
    this.backgroundx += this.backgroundSpeed;
    var nextHoll = 0;
    if (this.birds.length > 0) {
        for (var i = 0; i < this.pipes.length; i += 2) {
            if (this.pipes[i].x + this.pipes[i].width > this.birds[0].x) {
                nextHoll = this.pipes[i].height / this.height;
                break;
            }
        }
    }

    for (var i in this.birds) {
        if (this.birds[i].alive) {
            this.birdID = i;
            var inputs = [
                this.birds[i].y / this.height,
                nextHoll
            ];

            var res = this.gen[i].compute(inputs);
            if (res > 0.5) {
                this.birds[i].flap();
            }

            this.birds[i].update();
            if (this.birds[i].isDead(this.height, this.pipes)) {
                this.birds[i].alive = false;
                this.alives--;
                //console.log(this.alives);
                Neuvol.networkScore(this.gen[i], this.score);
                if (this.isItEnd()) {
                    this.start();
                }
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
    this.LmaxScore = (this.score > this.LmaxScore) ? this.score : this.LmaxScore;
    var self = this;

    if (LFPS == 0) {
        setZeroTimeout(function () {
            self.update();
        });
    } else {
        setTimeout(function () {
            self.update();
        }, 1000 / LFPS);
    }
}


LGame.prototype.isItEnd = function () {
    for (var i in this.birds) {
        if (this.birds[i].alive) {
            return false;
        }
    }
    return true;
}