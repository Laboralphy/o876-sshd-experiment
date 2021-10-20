const Server = require('./Server')
const application = require('../application/index')

function main () {
    const oServer = new Server(2222)
    oServer.events.on('client.connected', ({ server, client }) => {
        application(server, client)
    })
}

main()
