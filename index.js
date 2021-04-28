// Logger so I can keep the server running all the time and still know what it's doing
let log4js = require('log4js');

log4js.configure({
    appenders: { 
        console: {
            type: 'console'
        },
        file: { 
            type: 'file', 
            filename: 'logs/server.log', 
            // category: 'server', 
            // maxLogSize: 50000, 
            // compress: true, 
            // keepFileExt: true 
        }
    },
    categories: { 
        default: { 
            appenders: ['file', 'console'], 
            level: 'DEBUG' 
        } 
    }
});

let logger = log4js.getLogger('server')
// logger.level = 'info'

let WebSocket = require('ws')
let wss = new WebSocket.Server({ port: 8080 })

let updater = require('./UpdateClients.js')

let playerSpawnPoints = []
let clients = []
let defaultFullHealth = 100
let defaultKillCount = 0

wss.on('connection', function connection(ws) {
    logger.info("Connected")
    console.log("New connection")
    let currentPlayer = {}


    ws.on('message', function incoming(message) { // message string = "type { name: username, position: playerPosition, rotation: playerTurn, health: playerHealth }
        logger.debug('received: %s', message)
        // console.log('Received message from client: %s', message)


        let messageArr = message.split(/\s/)
        if (!message.includes(' ') || (messageArr.length > 1 && !messageArr[1].startsWith('{'))) {
            if (message === 'connected') {
                logger.info('Player connected')
                console.log('Player connected')
            } else {
                logger.info('message received: ' + message)
                console.log('message received: ' + message)
            }
        } else {
            let data = JSON.parse(messageArr[1])

            if (messageArr[0] === 'play') { // player connected, pick spawn point and send back and then broadcast to other players
                logger.info(data.name + ': received \'play\': ' + JSON.stringify(data))
                console.log(data.name + ': received \'play\': ' + JSON.stringify(data))

                if (playerSpawnPoints.length === 0) {
                    playerSpawnPoints = []
                    data.playerSpawnPoints.forEach((_playerSpawnPoint) => {
                        let playerSpawnPoint = {
                            position: _playerSpawnPoint.position,
                            rotation: _playerSpawnPoint.rotation
                        }
                        playerSpawnPoints.push(playerSpawnPoint)
                    })
                }

                logger.debug('player spawn points populated: ' + JSON.stringify(playerSpawnPoints))
                console.log('player spawn points populated: ' + JSON.stringify(playerSpawnPoints))

                var randomSpawnPoint = {}

                if(playerSpawnPoints.length > 0) {
                    randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * Math.floor(playerSpawnPoints.length))]
                    // playerSpawnPoints = [ // for testing with close spawn points
                    //     {
                    //         position: [
                    //             10.0,
                    //             0.0,
                    //             0.0
                    //         ],
                    //         rotation: [
                    //             0.0,
                    //             0.0,
                    //             90.0
                    //         ]
                    //     },
                    //     {
                    //         position: [
                    //             -10.0,
                    //             0.0,
                    //             0.0
                    //         ],
                    //         rotation: [
                    //             0.0,
                    //             0.0,
                    //             270.0
                    //         ]
                    //     },
                    // ]
                    // randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * Math.floor(2))]
                }
                else {
                    if (clients.length % 2 == 0) {
                        randomSpawnPoint = {
                            position: [-10,0,0],
                            rotation: [0,0,-90]
                        }
                    } else {
                        randomSpawnPoint = {
                            position: [10,0,0],
                            rotation: [0,0,90]
                        }
                    }
                }

                currentPlayer = {
                    simulationStep: -1,
                    name: data.name,
                    position: randomSpawnPoint.position,
                    rotation: randomSpawnPoint.rotation,
                    velocity: [0,0],
                    acceleration: [0,0],
                    health: defaultFullHealth,
                    killCount: defaultKillCount,
                    vehicleSelection: data.vehicleSelection,
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
                console.log(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(response))

                ws.send('play ' + JSON.stringify(response))

                clients = updater.updateClientsList(currentPlayer, clients)

                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('other_player_connected ' + JSON.stringify(currentPlayer)); // late join broadcast
                    }
                })

            } else if (messageArr[0] === 'name_registration') {
                logger.info("Received name_registration message")
                console.log("Received name_registration message")
                let response = {}
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
                    console.log("List is empty - adding")
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
                        console.log("Name found in clients list - invalid")
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
                        console.log("Name not found in clients list - valid")
                    }

                }

                logger.info(clients);
                console.log("At end of name_registration, response: " + JSON.stringify(response));
                ws.send('name_registration ' + JSON.stringify(response));

            } else if (messageArr[0] === 'other_player_connected') { // broadcast to all players when player connects, this isn't really being used right now
                logger.info(currentPlayer.name + ': received \'other_player_connected\'')
                console.log(currentPlayer.name + ': received \'other_player_connected\'')

                wss.clients.forEach((client) => {
                    clients.forEach((c) => {
                        let playerConnected = {
                            name: c.name,
                            position: c.position,
                            vehicleSelection: c.vehicleSelection,
                            rotation: c.rotation,
                            health: parseFloat(c.health),
                            killCount: c.killCount,
                        }
                        if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                            ws.send('other_player_connected ' + JSON.stringify(playerConnected)) // joining before match
                        }
                        logger.info(currentPlayer.name + ': emit \'other_player_connected\': ' + JSON.stringify(playerConnected))
                    })
                })

            } else if (messageArr[0] === 'move') { // broadcast to all players when player moves
                logger.debug('received \'move\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))
                //console.log('received \'move\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))

                currentPlayer.simulationStep = data.simulationStep
                currentPlayer.position = data.position
                currentPlayer.rotation = data.rotation
                clients = updater.updateClientsList(currentPlayer, clients)

                logger.debug(currentPlayer.name + ': broadcast \'move\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('move ' + JSON.stringify(currentPlayer))
                    }
                })
            } else if (messageArr[0] === 'ackMessage') { // broadcast ack to all players
                logger.debug('received \'ackMessage\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))
                console.log('received \'ackMessage\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))

                // currentPlayer.position = data.position
                // currentPlayer.rotation = data.rotation
                // clients = updater.updateClientsList(currentPlayer, clients)

                logger.debug(currentPlayer.name + ': broadcast \'ackMessage\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('ackMessage ' + JSON.stringify(data))
                    }
                })

            } else if (messageArr[0] === 'collision') { // broadcast ack to all players
                logger.debug('received \'collision\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))
                console.log('received \'collision\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))

                currentPlayer.position = data.position
                currentPlayer.rotation = data.rotation
                currentPlayer.velocity = data.velocity
                currentPlayer.acceleration = data.acceleration
                clients = updater.updateClientsList(currentPlayer, clients)

                console.log(currentPlayer.name + ': broadcast \'collision\': ' + JSON.stringify(currentPlayer))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('collision ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'collisionAck') { // broadcast ack to all players
                logger.debug('received \'collisionAck\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))
                console.log('received \'collisionAck\' from ' + currentPlayer.name + ': ' + JSON.stringify(data))

                currentPlayer.position = data.position
                currentPlayer.rotation = data.rotation
                currentPlayer.velocity = data.velocity
                currentPlayer.acceleration = data.acceleration
                clients = updater.updateClientsList(currentPlayer, clients)

                console.log(currentPlayer.name + ': broadcast \'collisionAck\': ' + JSON.stringify(currentPlayer))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('collisionAck ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'fire') {
                logger.info(currentPlayer.name + ': received: \'fire\': ' + data)
                console.log(currentPlayer.name + ': received: \'fire\': ' + data)

                currentPlayer.weapon.rotation = data.rotation
                clients = updater.updateClientsList(currentPlayer, clients)

                logger.info(currentPlayer.name + ': broadcast \'fire\': ' + JSON.stringify(data))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('fire ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'projectile_damage') {
                logger.info(currentPlayer.name + ': received \'projectile_damage\': ' + JSON.stringify(data))

                let indexDamaged = null
                let indexKiller = null
                let kill = false
                let damageAmt = typeof data.damage != 'undefined' && data.damage != null ? data.damage : parseFloat(data.damage)
                let change = -1
                let updatedClient = null
				let killCounter = 0
                // current player damaged another player
                clients.forEach((client, index) => {
                    if (client.name === data.name) {
                        if (data.from === currentPlayer.name) {
                            logger.info(currentPlayer.name + ' damaged another player: ' + data.name + ' by ' + data.damage)
                        }
                        indexDamaged = index
                        change = parseFloat(client.health) - damageAmt
                        client.health = change < 0 ? 0 : change
						clients = updater.updateClientsList(client, clients)
                    }

					if (client.name === data.from) {
						if (change === 0) {
							indexKiller = index
							kill = true
							client.killCount++
							killCounter = client.killCount
							logger.info(currentPlayer.name + ' killed another player: ' + data.name)
							clients = updater.updateClientsList(client, clients)
						}
					}
                })
                
                if (indexDamaged !== null) {
                    let response = {
                        name: data.name,
                        from: data.from,
                        health: change,
                        damage: damageAmt
                    }
                    if (kill) {
                        response.killerName = data.from
						// response.killerName = currentPlayer.name
                        response.killCount = killCounter
                        logger.info(currentPlayer.name + ' current kill count is ' + currentPlayer.killCount)
                    }

                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                            client.send('projectile_damage ' + JSON.stringify(response))
                        }
                    })
                } else {
                    logger.error(currentPlayer.name + ': received projectile_damage message but failed to find the player that received damage. Data: ' + data)
                }

            } else if (messageArr[0] === 'killed') {
                logger.info(currentPlayer.name + ': received \'killed\': ' + JSON.stringify(data))

                // current player was killed by from player

                let indexKiller = null
                let kill = false
                let updatedClient = null
				let killCounter = 0
                // current player damaged another player
                //if (data.from === currentPlayer.name) {
                clients.forEach((client, index) => {
                    if (client.name === data.from && change === 0) {
                        indexKiller = index
                        kill = true
						client.killCount++
                        killCounter = client.killCount
						clients = updater.updateClientsList(client, clients)
                        logger.info(currentPlayer.name + ' killed another player: ' + data.name)
                    }
                })
                //}

                if (indexKiller) {
                    let response = {
                        name: data.name,
                        from: data.from,
                    }
                    if (kill) {
                        response.killerName = data.from
                        response.killCount = killCounter
                        //clients = updater.updateClientsList(currentPlayer, clients)
                        logger.info(currentPlayer.name + ' current kill count is ' + currentPlayer.killCount)
                    }

                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                            client.send('killed ' + JSON.stringify(response))
                        }

                    })
                } else {
                    logger.error(currentPlayer.name + ': received killed message but failed to find the player that killed current player. Data: ' + data)
                }

            } else if (messageArr[0] === 'weapon') {
                // include weapon rotation and bool fireBullet to know to generate a bullet client side
                logger.debug(currentPlayer.name + ': received: \'weapon\': ' + data)

                currentPlayer.weapon.rotation =  data.weapon.rotation
                currentPlayer.weapon.fireBullet =  data.weapon.fireBullet
                clients = updater.updateClientsList(currentPlayer, clients)

                logger.debug(currentPlayer.name + ': broadcast \'weapon\': ' + JSON.stringify(playerConnected))
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('weapon ' + JSON.stringify(currentPlayer))
                    }
                })

            } else if (messageArr[0] === 'health_damage') {
                // when a player is damaged by another player or an obstacle
                logger.info(currentPlayer.name + ': received: \'health_damage\': ' + data)

                let indexDamaged = null
                let damageAmt = typeof data.damage != 'undefined' && data.damage != null ? data.damage : parseFloat(data.damage)
                let change = -1
                let updatedClient = null
                clients.forEach((client, index) => {
                    if (client.name === data.name) { // this player was damaged by current player
                        logger.info(data.name + ' got damaged by: ' + data.damage)
                        indexDamaged = index
                        change = parseFloat(client.health) - damageAmt
                        client.health = change < 0 ? 0 : change
                        updatedClient = client
                    }
                })
                if (updatedClient) {
                    clients = updater.updateClientsList(updatedClient, clients)
                }

                if (indexDamaged !== null) {
                    let response = {
                        name: data.name,
                        from: data.from,
                        health: change,
                        damage: damageAmt
                    }

                    logger.info(currentPlayer.name + ': broadcast \'health_damage\': ' + JSON.stringify(response))
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                            client.send('health_damage ' + JSON.stringify(response))
                        }
                    })
                } else {
                    logger.error(currentPlayer.name + ': received health_damage message but failed to find the player that received damage. Data: ' + data)
                }

            } else if (messageArr[0] === 'disconnect'  || messageArr[0] === 'disconnected') {
                logger.info(currentPlayer.name + ': received: \'disconnected\': ' + JSON.stringify(data));
                console.log(currentPlayer.name + ': received: \'disconnected\': ' + JSON.stringify(data));
                // broadcast to all players when a player disconnects
                // Remove disconnected client from the clients list
                for (let i = 0; i < clients.length; i++) {
                    if (clients[i].name === data.name) {
                        clients.splice(i,1)
                    }
                }
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('disconnect ' + JSON.stringify(data))
                    }
                })
            } else {
                // just a catch all for all other messages sent
                logger.info('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')
                console.log('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

                ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

            }
        }
    })

    // ws.on('open', function open() {
    //     logger.info('connected');
    //     // ws.send(Date.now());
    // });
    //
    //
    ws.on('close', function close() {
        logger.info(currentPlayer.name + ': disconnected');
        console.log(currentPlayer.name + ': disconnected');
        // Remove disconnected client from the clients list
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].name === currentPlayer.name) {
                clients.splice(i,1)
            }
        }
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                client.send('disconnect ' + JSON.stringify(currentPlayer))
            }
        })
    });

    console.log('SENDING "You are connected to the server!" TO CLIENT');
    ws.send('You are connected to the server!') // DO NOT change this message

})
logger.info('--------------- server is running... listening on port 8080');
console.log('--------------- server is running... listening on port 8080');
