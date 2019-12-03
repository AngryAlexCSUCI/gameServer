let log4js = require('log4js')
log4js.configure({
    appenders: { server: { type: 'file', filename: 'logs/server.log', category: 'server', maxLogSize: 50000, compress: true, keepFileExt: true } },
    categories: { default: { appenders: ['server'], level: 'info' } }
})
let logger = log4js.getLogger('server')
logger.level = 'info'

 let updateClientsList = function (currentPlayer, clients) {

    for (let index = 0; index < clients.length; ++index) {
        let client = clients[index];

        logger.info(currentPlayer.name + ': updating player: ' + client.name)
        if(client.name === currentPlayer.name) {
            if (currentPlayer.position) {
                client.position = currentPlayer.position
                logger.info(currentPlayer.name + ': updating player position: ' + JSON.stringify(currentPlayer.position))
            }
            if (currentPlayer.rotation) {
                client.rotation = currentPlayer.rotation
                logger.info(currentPlayer.name + ': updating player rotation: ' + JSON.stringify(currentPlayer.rotation))
            }
            if (currentPlayer.vehicleSelection) {
                client.vehicleSelection = currentPlayer.vehicleSelection
                logger.info(currentPlayer.name + ': updating player vehicle selection: ' + JSON.stringify(currentPlayer.vehicleSelection))
            }
            if (currentPlayer.health) {
                client.health = currentPlayer.health
                logger.info(currentPlayer.name + ': updating player health: ' + JSON.stringify(currentPlayer.health))
            }
            clients[index] = client
        }
    }
    return clients
}


 module.exports = {
     updateClientsList: updateClientsList
 }
