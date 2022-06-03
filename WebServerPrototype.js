var player1;
var player2;

const paddleWidth = 150;

const ballWidth = 20;
const ballHeight = 20;

const fieldWidth = 1000;
const fieldHeight = 1000;

const server = require("http").createServer(require("express")());
const port = 3000;

const wss = new (require("ws").Server)({ server });

function gameStart() {
    if(gameActive)
        return;
    gameActive = true;
    let ballAngle = Math.random() * Math.PI*2;
    player2.send(`{"header":"start","ballAngle":"${(ballAngle - Math.PI)%(Math.PI*2)}"}`);
    player1.send(`{"header":"start","ballAngle":"${ballAngle}"}`);
}

function playerJoinGameStart() {
    player1.send(`{"header":"plyjn"}`);
    player2.send(`{"header":"plyjn"}`);
    gameStart();
}

var rndndqueued = false;
var gameActive = false;

//Fix client player leave problem. 
wss.on("connection", client => {
    if(player1)
        if(player2) {
            return client.close();
        } else {
            var player2Get = () => player1;
            player2 = client;
            playerJoinGameStart();
        }
    else {
        var player2Get = () => player2;
        player1 = client;
        if(player2) {
            playerJoinGameStart();
        }
    }
    console.log("client connected");
    
    client.on("close", () => {
        console.log("client disconnected");
        if(client == player1) {
            player1 = undefined;
            if(player2)
                player2.send(`{"header":"plylv"}`);
        } else if(client == player2) {
            player2 = undefined;
            if(player1)
                player1.send(`{"header":"plylv"}`);
        }
    });
    client.on("message", message => {
        const data = JSON.parse(message.toString());
        switch(data.header) {
            case("stusnm") :
                player2Get().send(`{"header":"stusnm","usnm":"${data.usnm}"}`);
                break;
            case("updtply") :
                var client2 = player2Get();
                if(client2)
                    client2.send(`{"header":"updtply","playerVelocity":"${-Number(data.playerVelocity)}","playerX":"${fieldWidth - Number(data.playerX) - paddleWidth}"}`);
                break;
            case("rndndchck") :
                if(rndndqueued)
                    break;
                rndndqueued = true;
                player2Get().send(`{"header":"rndndchck"}`);
                break;
            case("rndnd") :
                rndndqueued = false;
                gameActive = false;
                player2Get().send(`{"header":"rndnd"}`);
                gameStart();
                break;
            case("rndcntnu") :
                rndndqueued = false;
                player2Get().send(`{"header":"rndcntnu","ballX":"${fieldWidth - Number(data.ballX) - ballWidth}","ballY":"${fieldHeight - Number(data.ballY) - ballHeight}","ballAngle":"${(Number(data.ballAngle) - Math.PI)%(Math.PI*2)}"}`);
                break;
        }
    });
});

server.listen(port, () => console.log("listening to port " + port));