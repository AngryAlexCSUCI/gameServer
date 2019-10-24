let WebSocket = require('ws')
let wss = new WebSocket.Server({ port: 8080 })

let playerSpawnPoints = []
let clients = []
let fullHealth = 100

wss.on('connection', function connection(ws) {
    console.log("Connected")
    let currentPlayer = {}
    currentPlayer.name = 'unknown player'


    ws.on('message', function incoming(message) { // message string = "type { name: username, position: playerPosition, rotation: playerTurn, health: playerHealth }
        console.log('received: %s', message)

        let messageArr = message.split(' ')
        let data = JSON.parse(messageArr[1])

        if (message[0] === 'play') { // player connected, pick spawn point and send back and then broadcast to other players
            console.log(currentPlayer.name + ': received \'play\': ' + JSON.stringify(data))
            if (clients.length === 0) {

                // todo spawn enemies and emit enemy name, position, turn, and health here if desired

                playerSpawnPoints = []
                data.playerSpawnPoints.forEach((_playerSpawnPoint) => {
                    let playerSpawnPoint = {
                        position: _playerSpawnPoint.position,
                        rotation: _playerSpawnPoint.rotation
                    }
                    playerSpawnPoints.push(playerSpawnPoint)
                })
            }
            let randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)]
            currentPlayer = {
                name: data.name,
                position: randomSpawnPoint.position,
                rotation: randomSpawnPoint.rotation,
                health: fullHealth,
                readyState: WebSocket.OPEN
            }
            clients.push(currentPlayer)

            console.log(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(currentPlayer))
            ws.send('play', currentPlayer)
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                    client.send('other_player_connected ' + JSON.stringify(currentPlayer)); // late join broadcast
                }
            })


        } else if (messageArr[0] === 'other_player_connected') { // broadcast to all players when player connects
            console.log(currentPlayer.name + ': received \'other player connected\'')

            wss.clients.forEach((client) => {
                let playerConnected = {
                    name: client.name,
                    position: client.position,
                    rotation: client.rotation,
                    health: client.health,
                }

                if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                    ws.send('other_player_connected ' + JSON.stringify(playerConnected)) // joining before match
                }
                console.log(currentPlayer.name + ': emit \'other player connected\': ' + JSON.stringify(playerConnected))
            })


        } else if (messageArr[0] === 'move') { // broadcast to all players when player moves
            console.log(currentPlayer.name + ': received \'move\': ' + JSON.stringify(data))

            currentPlayer.position = data.position
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                    client.send('move ' + JSON.stringify(data))
                }
            })


        } else if (messageArr[0] === 'turn') { // broadcast to all players when player turns
            console.log(currentPlayer.name + ': received \'turn\': ' + JSON.stringify(data))

            currentPlayer.rotation = data.rotation
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                    client.send('turn ' + JSON.stringify(data))
                }
            })


        } else if (messageArr[0] === 'disconnect') { // broadcast to all players when a player disconnects
            console.log(currentPlayer.name + ': emit \'disconnect\': ' + currentPlayer.name)

            console.log(currentPlayer.name + ' broadcast: other player disconnected: ' + JSON.stringify(currentPlayer))
            for (let i = 0; i < clients.length; i++) {
                if (clients[i].name === currentPlayer.name) {
                    clients.splice(i,1)
                }
            }
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                    client.send(currentPlayer.name + ': disconnected: ' + JSON.stringify(currentPlayer))
                }
            })


        } else if (messageArr[0] === 'shoot') {
            console.log('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

            ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')


        } else if (messageArr[0] === 'health') {
            console.log('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

            ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')


        } else {
            console.log('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

            ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

        }
    })

// todo not sure I need these
    // ws.on('open', function open() {
    //     console.log('connected');
    //     // ws.send(Date.now());
    // });
    //
    //
    // ws.on('close', function close() {
    //     console.log(currentPlayer.name + ': disconnected');
    //     // broadcast to all players when a player disconnects
    //     for (let i = 0; i < clients.length; i++) {
    //         if (clients[i].name === currentPlayer.name) {
    //             clients.splice(i,1)
    //         }
    //     }
    //
    // });

    ws.send('You are connected to the server!')

})
console.log('--------------- server is running... listening on port 8080')


// todo if you create enemies, put random ID generator function here so enemies have unique IDs for names

