const auth = require('./auth')
const SSH2 = require('ssh2');
const Client = require('./Client')
const Events = require('events')

class Server {
    constructor () {
        this._events = new Events()
        this._aClients = []
        this._oServer = null
    }

    async init () {
        auth.init(process.env)
        const oPath = auth.getPaths()
        this._oServer = await this.createServer(process.env.SERVER_PORT)
    }

    get port () {
        return this._oServer.address().port
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
        return new Promise(resolve => {
            const oSrvConfig = {
                hostKeys: auth.loadHostPrivateKey()
            }
            const oServer = new SSH2.Server(oSrvConfig, client => this.handleConnection(client))
            oServer.listen(port, '0.0.0.0', () => {
                resolve(oServer)
            })
        })
    }
}

module.exports = Server
