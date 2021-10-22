require('dotenv').config()
const Server = require('./sshd/Server')
const application = require('./application/index')

function main () {
    const oServer = new Server(process.env.SERVER_PORT)
    oServer.events.on('client.connected', ({ server, client }) => application(server, client))
}

main()
