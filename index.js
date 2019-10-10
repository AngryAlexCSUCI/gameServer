let app = require('express')()
let server = require('http').Server(app)
let io = require('socket.io')(server)

server.listen(3000)

app.get('/', function (req, res) {
    res.send('test')
})

io.on('connection',function (socket) {
    socket.emit('message', {hello: 'world'})
    socket.on('message', function (data) {
        console.log(data)
    })
})

console.log('--------------- server is running...')





