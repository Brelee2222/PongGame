class PongGame {
    player1;
    player2;

    ball;

    fieldWidth;
    fieldHeight;

    lastGameWin;

    gameActive = false;

    constructor(fieldWidth = 1000, fieldHeight = 1000) {
        this.fieldWidth = fieldWidth;
        this.fieldHeight = fieldHeight;
    }

    makeBall(width, height) {
        this.ball = new Ball(this.fieldWidth/2 - width/2, this.fieldHeight/2 - width/2, width, height)
    }

    destroyBall() {
        delete this.ball;
    }

    tick() {
        this.tickBall();
        this.tickPlayerPaddle(this.player1.paddle);
        this.tickPlayerPaddle(this.player2.paddle);
    }

    tickPlayerPaddle(paddle) {
        if(paddle.movementDisabled)
            return paddle.x;

        paddle.x += paddle.velocity;
        if(paddle.x < 0) {
            paddle.velocity = 0;
            paddle.x = 0;
        }
        if(paddle.x + paddle.width > this.fieldWidth) {
            paddle.velocity = 0;
            paddle.x = this.fieldWidth - paddle.width;
        }
        return paddle.x;
    }

    tickBllPadlBnc(paddle) {
        let stepX = (paddle.x - this.ball.x + (this.ball.dx > 0 ? -this.ball.width : paddle.width)) / this.ball.dx;
        let stepY = (paddle.y - this.ball.y + (this.ball.dy > 0 ? -this.ball.height : paddle.height)) / this.ball.dy;
        let bounceAngle;
        if((stepY < stepX && stepX < 0) || stepY > 0)
            stepX = stepY;
        else {
            stepY = stepX;
            bounceAngle = Math.PI/2;
        }
        if(stepX < 1) {
            let nx = this.ball.x + stepX*this.ball.dx;
            let ny = this.ball.y + stepX*this.ball.dy;
            let htbxchx = nx + this.ball.width - paddle.x;
            let htbxchy = ny + this.ball.height - paddle.y;
            if(htbxchx >= 0 && htbxchx <= paddle.width + this.ball.width && htbxchy >= 0 && htbxchy <= paddle.height + this.ball.height) {
                this.ball.x = nx;
                this.ball.y = ny;
                this.ball.bounce(bounceAngle);
                return false;
            }
        } 
        return true;
    }

    tickBllBrdrBnc() {
        let stepX = (this.ball.dx > 0 ? this.fieldWidth - this.ball.width - this.ball.x : -this.ball.x) / this.ball.dx;
        let stepY = (this.ball.dy > 0 ? this.fieldHeight - this.ball.height - this.ball.y : -this.ball.y) / this.ball.dy;
        let bounceAngle;
        if(stepY < stepX)
            stepX = stepY;
        else {
            stepY = stepX;
            bounceAngle = Math.PI/2;
        }
        if(stepX < 1) {
            this.ball.x += stepX*this.ball.dx;
            this.ball.y += stepY*this.ball.dy;
            this.ball.bounce(bounceAngle);
            if(this.ball.y <= 0) {
                this.lastGameWin = false;
                this.stopRound();
            } else 
                if(this.ball.y + this.ball.height >= this.fieldHeight - 0) {
                    this.lastGameWin = true;
                    this.stopRound();
                }
            return false;
        } else {
            this.ball.x += this.ball.dx;
            this.ball.y += this.ball.dy;
            return true;
        }
    }

    tickBall() {
        if(this.tickBllPadlBnc(this.player1.paddle))
            if(this.tickBllPadlBnc(this.player2.paddle))
                this.tickBllBrdrBnc();
    }

    stopRound() {
        this.gameActive = false;
    }
}

class PongPlayer {
    paddle;
    username;
    score = 0;
    constructor(usnm) {
        this.username = usnm;
    }
}

class Paddle {
    x;
    y;

    width;
    height;

    velocity = 0;

    paddleSpeed = 6;

    movementDisabled = true;

    constructor(x = 0, y = 0, width = 100, height = 20) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

class Ball {
    x;
    y;

    width;
    height;

    angle = 1;

    speed = 8;  

    constructor(x = 0, y = 0, width = 10, height = 10) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.updateVelocity();
    }

    //No update velocity needed anymore
    set angle(angle) {
        this.angle = angle;
        this.updateVelocity();
        return angle;
    }

    bounce(reflectAngle = 0) {
        this.angle = reflectAngle*2 - (this.angle%(Math.PI*2));
        this.updateVelocity();
    }

    updateVelocity() {
        this.dx = Math.cos(this.angle)*this.speed;
        this.dy = Math.sin(this.angle)*this.speed;
    }
}

class CanvasPong extends PongGame {
    canvas;

    ballWidth = 20;
    ballHeight = 20;
    paddleWidth = 150;
    paddleHeight = 20;

    ballSprite;
    paddleSprite;

    tickID;
    refreshID;

    constructor(CanvasId, width = 1000, height = 1000) {
        super(width, height);
        this.canvas = document.getElementById(CanvasId);
        this.paddleSprite = new PaddleSprite(this.paddleWidth, this.paddleHeight);
        this.ballSprite = new BallSprite(this.ballWidth, this.ballHeight);
    }

    refreshFrame() {
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "50px arial"
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText(this.player1.score, this.fieldWidth - 100, 400);
        ctx.fillText(this.player2.score, this.fieldWidth - 100, this.fieldHeight - 400);
        ctx.fillText(this.player2.username, 0, 50);
        ctx.fillText(this.player1.username, 0, this.fieldHeight - 50);
        ctx.drawImage(this.ballSprite.sprite, this.ball.x, this.ball.y);
        ctx.drawImage(this.paddleSprite.sprite, this.player1.paddle.x, this.player1.paddle.y);
        ctx.drawImage(this.paddleSprite.sprite, this.player2.paddle.x, this.player2.paddle.y);
    }

    stopRound() {
        super.stopRound();
        this.stop();
        webSocket.send(`{"header":"rndndchck"}`);
    }

    startRound(ballAngle) {
        this.player1.paddle.x = this.fieldWidth / 2 - this.player1.paddle.width / 2;
        this.player2.paddle.x = this.fieldHeight / 2 - this.player2.paddle.width / 2;
        this.player1.paddle.movementDisabled = false;
        this.player2.paddle.movementDisabled = false;
        this.start(ballAngle);
    }

    start(ballAngle) {
        if(pongGame.gameActive)
            return;
        this.gameActive = true;
        this.ball.angle = ballAngle;
        this.ball.updateVelocity();
        this.tickID = setInterval(() => this.tick(), 10);
        this.refreshID = setInterval(() => this.refreshFrame(), 10);
    }

    stop() {
        clearInterval(this.tickID);
        clearInterval(this.refreshID);
    }
}

class BallSprite {
    sprite;
    width;
    height;

    constructor(width, height) {
        this.sprite = new OffscreenCanvas(width, height);
        this.width = width;
        this.height = height;
        const ctx = this.sprite.getContext("2d")
        ctx.strokeStyle = "#aaaaaa";
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.arc(width/2, height/2, width/2, 0, 2*Math.PI);
        ctx.stroke();
    }
}
class PaddleSprite {
    sprite;
    width;
    height;

    constructor(width, height) {
        this.sprite = new OffscreenCanvas(width, height);
        this.width = width;
        this.height = height;
        const ctx = this.sprite.getContext("2d");
        ctx.strokeStyle = "#aaaaaa";
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, width, height);
        ctx.stroke();
    }
}

const pongGame = new CanvasPong("canvasGraphics");

const username = prompt("provide a username");

const serverStatus = document.getElementById("serverStatus");

const webSocket = new WebSocket("wss://localhost:9106");

function sendData() {
    webSocket.send(`{"header":"updtply","playerX":"${pongGame.player1.paddle.x}","playerVelocity":"${pongGame.player1.paddle.velocity}"}`);
}

webSocket.addEventListener("error", () => {
    serverStatus.textContent = "Failed to connect to the Websocket";
});

webSocket.addEventListener("open", () => {
    console.log("connected to the server");
    webSocket.send(`{"header":"stusnm","usnm":"${username}"}`)
    serverStatus.textContent = "Connected To The WebSocketServer (Secure)";

    (pongGame.player1 = new PongPlayer()).paddle = new Paddle(pongGame.fieldWidth/2 - 50, pongGame.fieldHeight - 70, 150, 20);
    pongGame.player1.username = username;

    window.addEventListener("keydown", key => {
        if(pongGame.player1.paddle.velocity)
            return;
        switch(key.key) {
            case("ArrowRight") :
                pongGame.player1.paddle.velocity = pongGame.player1.paddle.paddleSpeed;
                sendData();
                break;
            case("ArrowLeft") :
                pongGame.player1.paddle.velocity = -pongGame.player1.paddle.paddleSpeed;
                sendData();
                break;
        }
    });
    window.addEventListener("keyup", key => {
        if(key.key == "ArrowRight" || key.key == "ArrowLeft") {
            pongGame.player1.paddle.velocity = 0;
            sendData();
        }
    });
});

webSocket.addEventListener("message", message => {
    //will make my own parser
    const messageData = JSON.parse(message.data);

    switch(messageData.header) {
        case("rndndchck") : 
            if(pongGame.gameActive)
                webSocket.send(`{"header":"rndcntnu","ballX":"${pongGame.ball.x}","ballY":"${pongGame.ball.y}","ballAngle":"${pongGame.ball.angle}"}`);
            else {
                webSocket.send(`{"header":"rndnd"}`);
                (pongGame.lastGameWin ? pongGame.player1 : pongGame.player2).score++;
                pongGame.stop();
            }
            break;
        case("rndnd") :
            (pongGame.lastGameWin ? pongGame.player1 : pongGame.player2).score++;
            pongGame.stop();
            break;
        case("start") :
            pongGame.makeBall(20, 20);
            pongGame.refreshFrame();
            setTimeout(() => pongGame.startRound(Number(messageData.ballAngle)), 3000);
            break;
        case("plyjn") :
            (pongGame.player2 = new PongPlayer()).paddle = new Paddle(pongGame.fieldWidth/2 - 75, 50, 150, 20);
            break;
        case("updtply") : 
            pongGame.player2.paddle.velocity = Number(messageData.playerVelocity);
            pongGame.player2.paddle.x = Number(messageData.playerX);
            break;
        case("plylv") :
            pongGame.stop();
            pongGame.player1.score = 0;
            delete pongGame.player2;
            break;
        case("rndcntnu") :
            pongGame.ball.x = Number(messageData.ballX);
            pongGame.ball.y = Number(messageData.ballY);
            pongGame.start(Number(messageData.ballAngle));
            break;
        case("stusnm") : 
            pongGame.player2.username = messageData.usnm;
            break;
    }
});