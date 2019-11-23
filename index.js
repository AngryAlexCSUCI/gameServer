// Logger so I can keep the server running all the time and still know what it's doing
let log4js = require('log4js')
log4js.configure({
    appenders: { server: { type: 'file', filename: 'logs/server.log', category: 'server', maxLogSize: 50000, compress: true, keepFileExt: true } },
    categories: { default: { appenders: ['server'], level: 'info' } }
})
let logger = log4js.getLogger('server')

let WebSocket = require('ws')
let wss = new WebSocket.Server({ port: 8080 })

let playerSpawnPoints = []
let clients = []
let fullHealth = 100

wss.on('connection', function connection(ws) {
    logger.info("Connected")
    let currentPlayer = {}
    currentPlayer.name = 'unknown player'


    ws.on('message', function incoming(message) { // message string = "type { name: username, position: playerPosition, rotation: playerTurn, health: playerHealth }
        logger.info('received: %s', message)


        let messageArr = message.split(/\s/)
        if (!message.includes(' ') || (messageArr.length > 1 && !messageArr[1].startsWith('{'))) {
            if (message === 'connected') {
                logger.info('Player connected')
            } else {
                logger.info('message received: ' + message)
            }
        } else {
            let data = JSON.parse(messageArr[1])

            if (messageArr[0] === 'play') { // player connected, pick spawn point and send back and then broadcast to other players
                logger.info(currentPlayer.name + ': received \'play\': ' + JSON.stringify(data))
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

                var randomSpawnPoint = {}

                if(playerSpawnPoints.length > 0) {
                    randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * Math.floor(playerSpawnPoints.length))]
                }
                else {
                    randomSpawnPoint = {
                        position: [0,0,0],
                        rotation: [0,0,0]
                    }
                }
                
                currentPlayer = {
                    position: randomSpawnPoint.position,
                    rotation: randomSpawnPoint.rotation,
                    health: fullHealth,
                    weapon: {
                        rotation: randomSpawnPoint.rotation,
                        fireBullet: false
                    },
                    readyState: WebSocket.OPEN
                }

                let response = {
                    currentPlayer: currentPlayer,
                    otherPlayers: clients
                }

                logger.info(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(response))

                ws.send('play ' + JSON.stringify(response))

                clients.push(currentPlayer)

                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('other_player_connected ' + JSON.stringify(currentPlayer)); // late join broadcast
                    }
                })

            } else if (messageArr[0] === 'other_player_connected') { // broadcast to all players when player connects
                logger.info(currentPlayer.name + ': received \'other_player_connected\'')

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
                    logger.info(currentPlayer.name + ': emit \'other_player_connected\': ' + JSON.stringify(playerConnected))
                })


            } else if (messageArr[0] === 'move') { // broadcast to all players when player moves
                logger.info(currentPlayer.name + ': received \'move\': ' + JSON.stringify(data))

                currentPlayer.position = data.position

                logger.info(currentPlayer.name + ': broadcast \'move\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('move ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'wpressed') { // broadcast to all players when player presses w
                logger.info(currentPlayer.name + ': received \'wpressed\': ' + JSON.stringify(data))

                currentPlayer.position = data.position

                logger.info(currentPlayer.name + ': broadcast \'wpressed\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('wpressed ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'wrelease') { // broadcast to all players when player releases w
                logger.info(currentPlayer.name + ': received \'wrelease\': ' + JSON.stringify(data))

                currentPlayer.position = data.position

                logger.info(currentPlayer.name + ': broadcast \'wrelease\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('wrelease ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'spressed') { // broadcast to all players when player presses s
                logger.info(currentPlayer.name + ': received \'spressed\': ' + JSON.stringify(data))

                currentPlayer.position = data.position

                logger.info(currentPlayer.name + ': broadcast \'spressed\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('spressed ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'srelease') { // broadcast to all players when player releases w
                logger.info(currentPlayer.name + ': received \'srelease\': ' + JSON.stringify(data))

                currentPlayer.position = data.position

                logger.info(currentPlayer.name + ': broadcast \'srelease\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('srelease ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'apressed') { // broadcast to all players when player presses w
                logger.info(currentPlayer.name + ': received \'apressed\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation

                logger.info(currentPlayer.name + ': broadcast \'apressed\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('apressed ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'arelease') { // broadcast to all players when player releases w
                logger.info(currentPlayer.name + ': received \'arelease\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation

                logger.info(currentPlayer.name + ': broadcast \'arelease\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('arelease ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'dpressed') { // broadcast to all players when player presses s
                logger.info(currentPlayer.name + ': received \'dpressed\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation

                logger.info(currentPlayer.name + ': broadcast \'dpressed\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('dpressed ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'drelease') { // broadcast to all players when player releases w
                logger.info(currentPlayer.name + ': received \'drelease\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation

                logger.info(currentPlayer.name + ': broadcast \'drelease\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('drelease ' + JSON.stringify(currentPlayer))
                    }
                })

			} else if (messageArr[0] === 'fire') {
                logger.info(currentPlayer.name + ': received: \'fire\': ' + data)

                currentPlayer.weapon.rotation = data.rotation

                logger.info(currentPlayer.name + ': broadcast \'fire\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('fire ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'turn') { // broadcast to all players when player turns
                logger.info(currentPlayer.name + ': received \'turn\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation

                logger.info(currentPlayer.name + ': broadcast \'turn\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('turn ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'disconnect') { // broadcast to all players when a player disconnects
                logger.info(currentPlayer.name + ': emit \'disconnect\': ' + currentPlayer.name)

                logger.info(currentPlayer.name + ' broadcast: other player disconnected: ' + JSON.stringify(currentPlayer))
                for (let i = 0; i < clients.length; i++) {
                    if (clients[i].name === currentPlayer.name) {
                        clients.splice(i, 1)
                    }
                }
                logger.info(currentPlayer.name + ': broadcast \'disconnect\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('disconnected ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'weapon') {
                // include weapon rotation and bool fireBullet to know to generate a bullet client side
                logger.info(currentPlayer.name + ': received: \'weapon\': ' + data)

                currentPlayer.weapon.rotation =  data.weapon.rotation
                currentPlayer.weapon.fireBullet =  data.weapon.fireBullet

                logger.info(currentPlayer.name + ': broadcast \'weapon\': ' + JSON.stringify(playerConnected))
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
                logger.info(currentPlayer.name + ': received: \'health_damage\': ' + data)

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

                    logger.info(currentPlayer.name + ': broadcast \'health_damage\': ' + JSON.stringify(response))
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                            client.send('health_damage ' + JSON.stringify(response))
                        }
                    })
                } else {
                    logger.info(currentPlayer.name + ': received health_damage message but failed to find the player that received damage. Data: ' + data)
                }

            } else if (messageArr[0] === 'name_registration') {
                logger.info("Received name_registration message")
                response = {}
                //no other clients connected - don't need to check arr contents
                if(clients.length === 0 ) {
                    clients.push({
                        name: data.name
                    })

                    response = {
                        name: data.name,
                        name_registration_success: true
                    }

                    logger.info("List is empty - adding")
                }
                else {
                    var hasMatch = false;

                    //we need to check if the name is already in the list here
                    for (var index = 0; index < clients.length; ++index) {
                     var client = clients[index];
                     if(client.name === data.name){
                       hasMatch = true;
                       break;
                     }
                    }

                    if(hasMatch) {
                        response = {
                            name: data.name,
                            name_registration_success: false
                        }
                        logger.error("Name found in clients list - invalid")
                    }
                    else {
                        response = {
                            name: data.name,
                            name_registration_success: true
                        }

                        clients.push({
                            name: data.name
                        })
                        logger.info("Name not found in clients list - valid")
                    }

                }

                logger.info(clients)
                ws.send('name_registration ' + JSON.stringify(response))


            } else {
                // just a catch all for all other messages sent
                logger.info('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

                ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

            }
        }
    })

// todo not sure I need these
    // ws.on('open', function open() {
    //     logger.info('connected');
    //     // ws.send(Date.now());
    // });
    //
    //
    // ws.on('close', function close() {
    //     logger.info(currentPlayer.name + ': disconnected');
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
logger.info('--------------- server is running... listening on port 8080')


// todo if you create enemies, put random ID generator function here so enemies have unique IDs for names

