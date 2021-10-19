const dotenv = require('dotenv')
const Server = require('./sshd/Server')
const application = require('./application/index')

function checkEnv () {
    const result = dotenv.config()
    if (result.error) {
        throw result.error
    }
}

function main () {
    checkEnv()
    const oServer = new Server(2222)
    oServer.events.on('client.connected', ({ server, client }) => {
        application({ server, client })
    })
}

main()
