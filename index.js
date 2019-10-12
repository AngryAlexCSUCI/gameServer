let app = require('express')()
let server = require('http').Server(app)
let io = require('socket.io')(server)

server.listen(3000)

let playerSpawnPoints = []
let clients = []
// let fullHealth = 100

app.get('/', (req, res) => {
    res.send('test')
})

io.on('connection', (socket) => {

    let currentPlayer = {}
    currentPlayer.name = 'unknown'

    socket.on('player connected', () => {
        console.log(currentPlayer.name + ': received \'player connected\'')
        for (let i = 0; i < clients.length; i++) {
            let playerConnected = {
                name: clients[i].name,
                position: clients[i].position,
                rotation: clients[i].rotation
                // health: clients[i].health
            }
            socket.emit('other player connected', { 'other player connected': playerConnected}) // joining before match
            console.log(currentPlayer.name + ': emit \'other player connected\': ' + JSON.stringify(playerConnected))
        }
    })

    socket.on('play', (data) => {
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
        socket.broadcast.emit('other player connected', currentPlayer) // late join broadcast
    })

    socket.on('player move', (data) => {
        console.log('Received move: ' + JSON.stringify(data))
        currentPlayer.position = data.position
        socket.broadcast.emit('player move', currentPlayer)
    })

    socket.on('player rotate', (data) => {
        console.log('Received rotation: ' + JSON.stringify(data))
        currentPlayer.rotation = data.rotation
        currentPlayer.broadcast.emit('player rotate', currentPlayer)
    })

    // todo add 'player shoot' and 'health' socked emitters here

    socket.on('disconnect', (data) => {
        console.log(currentPlayer.name + ": emit 'disconnect': " + currentPlayer.name)
        socket.broadcast.emit('other player disconnected', currentPlayer)
        console.log(currentPlayer.name + " broadcast: other player disconnected: " + JSON.stringify(currentPlayer))
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].name === currentPlayer.name) {
                clients.splice(i,1)
            }
        }
    })

})

console.log('--------------- server is running...')

// todo if you create enemies, put random ID generator function here so enemies have unique IDs for names



