// Logger so I can keep the server running all the time and still know what it's doing
let log4js = require('log4js')
log4js.configure({
    appenders: { server: { type: 'file', filename: 'logs/server.log', category: 'server' } },
    categories: { default: { appenders: ['server'], level: 'info' } }
})
let logger = log4js.getLogger('server')

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


        let messageArr = message.split(/\s/)
        if (!message.includes(' ') || (messageArr.length > 1 && !messageArr[1].startsWith('{'))) {
            if (message === 'connected') {
                console.log('Player connected')
            } else {
                console.log('message received: ' + message)
            }
        } else {
            let data = JSON.parse(messageArr[1])

            if (messageArr[0] === 'play') { // player connected, pick spawn point and send back and then broadcast to other players
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

                let randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * Math.floor(playerSpawnPoints.length))]
                currentPlayer = {
                    name: data.name,
                    position: randomSpawnPoint.position,
                    rotation: randomSpawnPoint.rotation,
                    health: fullHealth,
                    weapon: {
                        rotation: randomSpawnPoint.rotation,
                        fire_bullet: false
                    },
                    readyState: WebSocket.OPEN
                }
                let response = {
                    currentPlayer: currentPlayer,
                    otherPlayers: clients
                }

                console.log(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(response))

                ws.send('play ' + JSON.stringify(currentPlayer))

                clients.push(currentPlayer)

                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('other_player_connected ' + JSON.stringify(currentPlayer)); // late join broadcast
                    }
                })

            } else if (messageArr[0] === 'other_player_connected') { // broadcast to all players when player connects
                console.log(currentPlayer.name + ': received \'other_player_connected\'')

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
                    console.log(currentPlayer.name + ': emit \'other_player_connected\': ' + JSON.stringify(playerConnected))
                })


            } else if (messageArr[0] === 'move') { // broadcast to all players when player moves
                console.log(currentPlayer.name + ': received \'move\': ' + JSON.stringify(data))

                currentPlayer.position = data.position

                console.log(currentPlayer.name + ': broadcast \'move\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('move ' + JSON.stringify(data))
                    }
                })


            } else if (messageArr[0] === 'turn') { // broadcast to all players when player turns
                console.log(currentPlayer.name + ': received \'turn\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation

                console.log(currentPlayer.name + ': broadcast \'turn\': ' + JSON.stringify(data))
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
                        clients.splice(i, 1)
                    }
                }
                console.log(currentPlayer.name + ': broadcast \'disconnect\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('disconnected ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'weapon') {
                // include weapon rotation and bool fire_bullet to know to generate a bullet client side
                console.log(currentPlayer.name + ': received: \'weapon\': ' + data)

                currentPlayer.weapon.rotation =  data.weapon.rotation
                currentPlayer.weapon.fire_bullet =  data.weapon.fire_bullet

                console.log(currentPlayer.name + ': broadcast \'weapon\': ' + JSON.stringify(playerConnected))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('weapon ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'health_damage') {
                // when a player is damaged by a bullet
                /*  data:
                     {
                       from: playerName             // player that did the damage
                       name: playerName             // player that was damaged
                       damage: int                  // how much damage the player took
                     }
                 */
                console.log(currentPlayer.name + ': received: \'health_damage\': ' + data)

                let indexDamaged = null
                if (data.from === currentPlayer.name) {
                    clients = clients.map((client, index) => {
                        if (client.name === data.name) {
                            indexDamaged = index
                            let change = client.health - data.damage
                            client.health = change < 0 ? 0 : change
                        }
                        return client
                    })
                }

                if (indexDamaged !== null) {
                    let response = {
                        name: clients[indexDamaged].name,
                        health: clients[indexDamaged].health
                    }

                    console.log(currentPlayer.name + ': broadcast \'health_damage\': ' + JSON.stringify(response))
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                            client.send('health_damage ' + JSON.stringify(response))
                        }
                    })
                } else {
                    console.log(currentPlayer.name + ': received health_damage message but failed to find the player that received damage. Data: ' + data)
                }

            } else {
                // just a catch all for all other messages sent
                console.log('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

                ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

            }
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

    ws.send('You are connected to the server!') // DO NOT change this message

})
console.log('--------------- server is running... listening on port 8080')


// todo if you create enemies, put random ID generator function here so enemies have unique IDs for names

