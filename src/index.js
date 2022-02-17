require('dotenv').config()
const debug = require('debug')
const Server = require('./sshd/Server')
const application = require('./application/index')

const debugServ = debug('serv')

async function main () {
    debugServ('server instance construction')
    const oServer = new Server(process.env.SERVER_PORT)
    await oServer.init()
    debugServ('listening on port', oServer.port)
    oServer.events.on('client.connected', ({ server, client }) => {
        debugServ('client connected and authenticated as', client.username)
        application(server, client)
    })
    oServer.events.on('client.disconnected', ({ server, client }) => {
        debugServ('client connected and authenticated as', client.username)
        application(server, client)
    })
}

main()
