const debug = require('debug')
const auth = require('./auth')
const SSH2 = require('ssh2');
const Client = require('./Client')
const Events = require('events')

class Server {
    constructor (port) {
        this._events = new Events()
        auth.init(process.env)
        this.createServer(port)
        this._aClients = []
    }

    get clients () {
        return this._aClients
    }

    addClient (oClient) {
        if (this._aClients.indexOf(oClient) < 0) {
            this._aClients.push(oClient)
        }
    }

    removeClient (oClient) {
        const iClient = this._aClients.indexOf(oClient)
        if (iClient >= 0) {
            this._aClients.splice(iClient, 1)
        }
    }

    get events () {
        return this._events
    }

    handleConnection (client) {
        const oClient = new Client(client)
        this.addClient(oClient)
        oClient.events.on('screen.created', c => {
            this._events.emit('client.connected', { client: oClient, server: this })
        })
        oClient.events.on('screen.destroyed', c => {
            this._events.emit('client.disconnected', { client: oClient, server: this })
            this.removeClient(oClient)
        })
        oClient.events.on('screen.resize', ({ cols, rows }) => {
            this._events.emit('window.resize', { client: oClient, server: this, cols, rows })
            this.removeClient(oClient)
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
