let WebSocket = require('ws')
let wss = new WebSocket.Server({ port: 8080 })

let playerSpawnPoints = []
let clients = []
let fullHealth = 100

wss.on('connection', function connection(ws) {
    console.log("Connected")
    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
    })
    ws.send('Hello back to you!')

    let currentPlayer = {}
    currentPlayer.name = 'unknown'

    ws.on('player connected', () => {
        console.log(currentPlayer.name + ': received \'player connected\'')
        for (let i = 0; i < clients.length; i++) {
            let playerConnected = {
                name: clients[i].name,
                position: clients[i].position,
                rotation: clients[i].rotation,
                health: clients[i].health
            }
            ws.emit('other player connected', { 'other player connected': playerConnected}) // joining before match
            console.log(currentPlayer.name + ': emit \'other player connected\': ' + JSON.stringify(playerConnected))
        }
    })

    ws.on('play', (data) => {
        console.log(currentPlayer.name + ': received \'play\': ' + JSON.stringify(data))
        if (clients.length === 0) {

            // todo spawn enemies and emit enemy name, position, rotation, and health here if desired

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
            // health: fullHealth
        }
        clients.push(currentPlayer)

        console.log(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(currentPlayer))
        ws.emit('play', currentPlayer)
        ws.broadcast.emit('other player connected', currentPlayer) // late join broadcast
    })

    ws.on('player move', (data) => {
        console.log('Received move: ' + JSON.stringify(data))
        currentPlayer.position = data.position
        ws.broadcast.emit('player move', currentPlayer)
        // wss.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(data)
        //     }
        // }) // todo use this for client management in ws
    })

    ws.on('player rotate', (data) => {
        console.log('Received rotation: ' + JSON.stringify(data))
        currentPlayer.rotation = data.rotation
        ws.broadcast.emit('player rotate', currentPlayer)
    })

    // todo add 'player shoot' and 'health' socked emitters here

    ws.on('disconnect', (data) => {
        console.log(currentPlayer.name + ": emit 'disconnect': " + currentPlayer.name)
        ws.broadcast.emit('other player disconnected', currentPlayer)
        console.log(currentPlayer.name + " broadcast: other player disconnected: " + JSON.stringify(currentPlayer))
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].name === currentPlayer.name) {
                clients.splice(i,1)
            }
        }
    })


})
console.log('--------------- server is running... listening on port 8080')

/*
todo rewrite socket io stuff to ws: update broadcast and emit to send
 */


// todo if you create enemies, put random ID generator function here so enemies have unique IDs for names

