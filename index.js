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
                let randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * Math.floor(playerSpawnPoints.length))]
                currentPlayer = {
                    name: data.name,
                    position: randomSpawnPoint.position,
                    rotation: randomSpawnPoint.rotation,
                    health: fullHealth,
                    readyState: WebSocket.OPEN
                }
                clients.push(currentPlayer)

                logger.info(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(currentPlayer))
                ws.send('play ' + JSON.stringify(currentPlayer))
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('other_player_connected ' + JSON.stringify(currentPlayer)); // late join broadcast
                    }
                })

            } else if (messageArr[0] === 'other_player_connected') { // broadcast to all players when player connects
                logger.info(currentPlayer.name + ': received \'other player connected\'')

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
                    logger.info(currentPlayer.name + ': emit \'other player connected\': ' + JSON.stringify(playerConnected))
                })


            } else if (messageArr[0] === 'move') { // broadcast to all players when player moves
                logger.info(currentPlayer.name + ': received \'move\': ' + JSON.stringify(data))

                currentPlayer.position = data.position
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('move ' + JSON.stringify(data))
                    }
                })


            } else if (messageArr[0] === 'turn') { // broadcast to all players when player turns
                logger.info(currentPlayer.name + ': received \'turn\': ' + JSON.stringify(data))

                currentPlayer.rotation = data.rotation
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send('turn ' + JSON.stringify(data))
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
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) { // broadcast to all except current player
                        client.send(currentPlayer.name + ': disconnected: ' + JSON.stringify(currentPlayer))
                    }
                })


            } else if (messageArr[0] === 'weapon') {
                // todo include weapon rotation and bool fire_bullet to know if to generate bullet client side?
                /*  {
                       name: playerName
                       rotation: [x, y, z]
                       fire_bullet: true
                    }
                 */
                logger.info()

                // logger.warn('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

                ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')


            } else if (messageArr[0] === 'health_damage') {
                // todo health damage to and from player
                /*  {
                       name: playerName
                       damageTo: otherPlayerName
                     }
                     return health damage/new health of other player?
                 */
                logger.warn('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

                ws.send('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')


            } else {
                // just a catch all for all other messages sent
                logger.warn('Message type ' + messageArr[0] + ' has no corresponding action on the server. No messages sent to other players.')

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

    ws.send('You are connected to the server!')

})
logger.info('--------------- server is running... listening on port 8080')


// todo if you create enemies, put random ID generator function here so enemies have unique IDs for names

