require('dotenv').config()
const debug = require('debug')
const auth = require('./auth')
const SSH2 = require('ssh2');
const Client = require('./Client')
const Events = require('events')

class Server {
    constructor (port) {
        this._events = new Events()
        auth.init()
        this.createServer(port)
    }

    get events () {
        return this._events
    }

    handleConnection (client) {
        const oClient = new Client(client)
        oClient.events.on('screen.created', c => {
            this._events.emit('client.connected', oClient)
        })
        oClient.events.on('screen.destroyed', c => {
            this._events.emit('client.disconnected', oClient)
        })
    }

    createServer (port) {
        const oSrvConfig = {
            hostKeys: auth.loadHostPrivateKey()
        }
        const oServer = new SSH2.Server(oSrvConfig, client => this.handleConnection(client))
        oServer.listen(port, '0.0.0.0', () => {
            console.log('listening on port', oServer.address().port);
        })
        return oServer
    }
}

module.exports = Server
