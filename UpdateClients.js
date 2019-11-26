
 let updateClientsList = function (currentPlayer, clients) {

    for (let index = 0; index < clients.length; ++index) {
        let client = clients[index];

        if(client.name === currentPlayer.name){
            if (currentPlayer.position) {
                client.position = currentPlayer.position
            }
            if (currentPlayer.rotation) {
                client.rotation = currentPlayer.rotation
            }
            if (currentPlayer.vehicleSelection) {
                client.vehicleSelection = currentPlayer.vehicleSelection
            }
            if (currentPlayer.health) {
                client.health = currentPlayer.health
            }
            clients[index] = client
        }
    }
    return clients
}


 module.exports = {
     updateClientsList: updateClientsList
 }
