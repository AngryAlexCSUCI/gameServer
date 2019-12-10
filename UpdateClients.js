let log4js = require('log4js')
log4js.configure({
    appenders: { server: { type: 'file', filename: 'logs/server.log', category: 'server', maxLogSize: 50000, compress: true, keepFileExt: true } },
    categories: { default: { appenders: ['server'], level: 'info' } }
})
let logger = log4js.getLogger('server')
logger.level = 'info'

 let updateClientsList = function (currentPlayer, clients, incrementKillCount = false) {

    for (let index = 0; index < clients.length; ++index) {
        let client = clients[index];

        logger.debug(currentPlayer.name + ': updating player: ' + client.name)
        if(client.name === currentPlayer.name) {
            if (currentPlayer.position) {
                client.position = currentPlayer.position
                logger.debug(currentPlayer.name + ': updating player position: ' + JSON.stringify(currentPlayer.position))
            }
            if (currentPlayer.rotation) {
                client.rotation = currentPlayer.rotation
                logger.debug(currentPlayer.name + ': updating player rotation: ' + JSON.stringify(currentPlayer.rotation))
            }
            if (currentPlayer.vehicleSelection) {
                client.vehicleSelection = currentPlayer.vehicleSelection
                logger.debug(currentPlayer.name + ': updating player vehicle selection: ' + JSON.stringify(currentPlayer.vehicleSelection))
            }
            if (currentPlayer.health) {
                client.health = currentPlayer.health
                logger.debug(currentPlayer.name + ': updating player health: ' + JSON.stringify(currentPlayer.health))
            }
			if (currentPlayer.killCount) {
                client.killCount = currentPlayer.killCount
                logger.debug(currentPlayer.name + ': updating player killCount: ' + JSON.stringify(currentPlayer.killCount))
            }
			if (incrementKillCount) {
                ++client.killCount
                logger.debug(currentPlayer.name + ': incrementing player killCount: ' + JSON.stringify(currentPlayer.killCount))
            }
            clients[index] = client
        }
    }
    return clients
}

let getClientAttr = function (currentPlayer, clients, attribute) {

    for (let index = 0; index < clients.length; ++index) {
        let client = clients[index];

        logger.debug(currentPlayer.name + ': getting player attribute: ' + attribute)
        if(client.name === currentPlayer.name) {
            if (client.hasOwnProperty(attribute)) {
                let result = client[attribute]
                logger.debug(currentPlayer.name + ': found player attribute' + attribute + ': ' + result)
                return result
            } else {
                logger.debug(currentPlayer.name + ': attribute does not exist: ' + attribute)
              return "No such attribute"
            }
        }
    }
}



 module.exports = {
     updateClientsList: updateClientsList,
     getClientAttr: getClientAttr
 }
