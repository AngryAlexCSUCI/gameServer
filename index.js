//
// 'use strict';
//
// const https = require('https');
// const fs = require('fs');
// const path = require('path');
//
// const WebSocket = require('ws');

// var certFilePath = path.resolve(__dirname, "bin/csr.pem");
// var keyFilePath = path.resolve(__dirname, "bin/custom.key");
// var certKeyFile = fs.readFileSync(keyFilePath);
// var certFile = fs.readFileSync(certFilePath);
//
// const server = https.createServer({
//     cert: fs.readFileSync(certFilePath),
//     key: fs.readFileSync(keyFilePath)
// });
//
// const wss = new WebSocket.Server({ server });
//
// wss.on('connection', function connection(ws) {
//     console.log('someone has connected');
//     ws.on('message', function message(msg) {
//         console.log(msg);
//         ws.send("Hello back to you!");
//     });
// });
//
// server.listen(function listening() {
//     //
//     // If the `rejectUnauthorized` option is not `false`, the server certificate
//     // is verified against a list of well-known CAs. An 'error' event is emitted
//     // if verification fails.
//     //
//     // The certificate used in this example is self-signed so `rejectUnauthorized`
//     // is set to `false`.
//     //
//     const ws = new WebSocket(`wss://ec2-3-84-148-203.compute-1.amazonaws.com:3000`, {
//         rejectUnauthorized: false
//     });
//
//     ws.on('open', function open() {
//         ws.send('This websocket is open and working!');
//     });
// });



// let app = require('express')()
// let server = require('http').Server(app)
// // let io = require('socket.io')(server)
// //
// app.get('/', (req, res) => {
//     res.send('test')
// })
"use strict"
let WebSocketServer = require('ws').Server
// let wss = new WebSocketServer({
//     server: httpsServer
// });

const wss = new WebSocketServer({ port: 3000 })
// server.listen(3000)

wss.on('connection', function connection(ws) {
    console.log("Connected")
    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
    })

    ws.send('Hello back to you!')
})
console.log('--------------- server is running...')
//
// // "use strict"
// // // Optional. You will see this name in eg. 'ps' or 'top' command
// // process.title = 'node-chat'
// // // Port where we'll run the websocket server
// // let webSocketsServerPort = 3000
// // // websocket and http servers
// // let webSocketServer = require('websocket').server
// // let http = require('http')
// // /**
// //  * Global variables
// //  */
// // // latest 100 messages
// // let history = [ ]
// // // list of currently connected clients (users)
// // let clients = [ ]
// // /**
// //  * Helper function for escaping input strings
// //  */
// // function htmlEntities(str) {
// //     return String(str)
// //         .replace(/&/g, '&amp').replace(/</g, '&lt')
// //         .replace(/>/g, '&gt').replace(/"/g, '&quot')
// // }
// // /**
// //  * HTTP server
// //  */
// // let server = http.createServer(function(request, response) {
// //     // Not important for us. We're writing WebSocket server,
// //     // not HTTP server
// // })
// // server.listen(webSocketsServerPort, function() {
// //     console.log((new Date()) + " Server is listening on port "
// //         + webSocketsServerPort)
// // })
// // /**
// //  * WebSocket server
// //  */
// // let wsServer = new webSocketServer({
// //     // WebSocket server is tied to a HTTP server. WebSocket
// //     // request is just an enhanced HTTP request. For more info
// //     // http://tools.ietf.org/html/rfc6455#page-6
// //     httpServer: server
// // })
// // // This callback function is called every time someone
// // // tries to connect to the WebSocket server
// // wsServer.on('request', function(request) {
// //     console.log((new Date()) + ' Connection from origin '
// //         + request.origin + '.')
// //     // accept connection - you should check 'request.origin' to
// //     // make sure that client is connecting from your website
// //     // (http://en.wikipedia.org/wiki/Same_origin_policy)
// //     let connection = request.accept(null, request.origin)
// //     // we need to know client index to remove them on 'close' event
// //     let index = clients.push(connection) - 1
// //     let userName = false
// //     let userColor = false
// //     console.log((new Date()) + ' Connection accepted.')
// //     // send back chat history
// //     if (history.length > 0) {
// //         connection.sendUTF(
// //             JSON.stringify({ type: 'history', data: history} ))
// //     }
// //     // user sent some message
// //     connection.on('message', function(message) {
// //         if (message.type === 'utf8') { // accept only text
// //             // first message sent by user is their name
// //         }
// //         console.log("Received message: ")
// //         console.log(message)
// //     })
// //     // user disconnected
// //     connection.on('close', function(connection) {
// //         if (userName !== false && userColor !== false) {
// //             console.log((new Date()) + " Peer "
// //                 + connection.remoteAddress + " disconnected.")
// //             // remove user from the list of connected clients
// //             clients.splice(index, 1)
// //             // push back user's color to be reused by another user
// //         }
// //     })
// // })
//
//
// // let playerSpawnPoints = []
// // let clients = []
// // let fullHealth = 100
//
//
//
// // io.on('connection', (socket) => {
// //
// //     let currentPlayer = {}
// //     currentPlayer.name = 'unknown'
// //
// //     socket.on('player connected', () => {
// //         console.log(currentPlayer.name + ': received \'player connected\'')
// //         for (let i = 0; i < clients.length; i++) {
// //             let playerConnected = {
// //                 name: clients[i].name,
// //                 position: clients[i].position,
// //                 rotation: clients[i].rotation
// //                 // health: clients[i].health
// //             }
// //             socket.emit('other player connected', { 'other player connected': playerConnected}) // joining before match
// //             console.log(currentPlayer.name + ': emit \'other player connected\': ' + JSON.stringify(playerConnected))
// //         }
// //     })
// //
// //     socket.on('play', (data) => {
// //         console.log(currentPlayer.name + ': received \'play\': ' + JSON.stringify(data))
// //         if (clients.length === 0) {
// //
// //             // todo spawn enemies and emit enemy name, position, rotation, and health here if desired
// //
// //             playerSpawnPoints = []
// //             data.playerSpawnPoints.forEach((_playerSpawnPoint) => {
// //                 let playerSpawnPoint = {
// //                     position: _playerSpawnPoint.position,
// //                     rotation: _playerSpawnPoint.rotation
// //                 }
// //                 playerSpawnPoints.push(playerSpawnPoint)
// //             })
// //         }
// //
// //         let randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)]
// //         currentPlayer = {
// //             name: data.name,
// //             position: randomSpawnPoint.position,
// //             rotation: randomSpawnPoint.rotation,
// //             // health: fullHealth
// //         }
// //         clients.push(currentPlayer)
// //
// //         console.log(currentPlayer.name + ': emit \'play\': ' + JSON.stringify(currentPlayer))
// //         socket.emit('play', currentPlayer)
// //         socket.broadcast.emit('other player connected', currentPlayer) // late join broadcast
// //     })
// //
// //     socket.on('player move', (data) => {
// //         console.log('Received move: ' + JSON.stringify(data))
// //         currentPlayer.position = data.position
// //         socket.broadcast.emit('player move', currentPlayer)
// //     })
// //
// //     socket.on('player rotate', (data) => {
// //         console.log('Received rotation: ' + JSON.stringify(data))
// //         currentPlayer.rotation = data.rotation
// //         currentPlayer.broadcast.emit('player rotate', currentPlayer)
// //     })
// //
// //     // todo add 'player shoot' and 'health' socked emitters here
// //
// //     socket.on('disconnect', (data) => {
// //         console.log(currentPlayer.name + ": emit 'disconnect': " + currentPlayer.name)
// //         socket.broadcast.emit('other player disconnected', currentPlayer)
// //         console.log(currentPlayer.name + " broadcast: other player disconnected: " + JSON.stringify(currentPlayer))
// //         for (let i = 0; i < clients.length; i++) {
// //             if (clients[i].name === currentPlayer.name) {
// //                 clients.splice(i,1)
// //             }
// //         }
// //     })
// //
// // })
//
// console.log('--------------- server is running...')
//
// // todo if you create enemies, put random ID generator function here so enemies have unique IDs for names
//
//
//
