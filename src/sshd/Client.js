const auth = require('./auth');
const blessed = require('blessed')
const Events = require('events')

let CLIENT_LAST_ID = 0

class Client {
    constructor (client) {
        this._sshClient = client
        this._username = ''
        this._session = null
        this._screen = null
        this._stream = null
        this._data = {}
        this._id = ++CLIENT_LAST_ID
        client.on('authentication', ctx => this.handleAuthentication(ctx))
        client.on('ready', () => this.handleReady())
        client.on('close', () => this.handleClose())
        console.log('client', this.id, 'connected')
        this._events = new Events()
    }

    get data () {
        return this._data
    }

    get events () {
        return this._events
    }

    get client () {
        return this._sshClient
    }

    get id () {
        return this._id
    }

    get screen () {
        return this._screen
    }

    get username () {
        return this._username
    }

    async handleSession (accept, reject) {
        this._session = accept()
        this._stream = await this.getStream(this._session)
        this._screen = this.getScreen(this._stream)
        this.events.emit('screen.created')
    }

    handleReady () {
        console.log('client', this.id, 'authenticated as', this._username);
        this.client.on('session', (accept, reject) => this.handleSession(accept, reject))
    }

    handleClose () {
        console.log('client', this.id, 'disconnected')
        if (this._screen && !this._screen.destroyed) {
            this._screen.destroy();
        }
    }

    /**
     * Gestion de la phase d'authentification
     * @param ctx {*} contexte délivré par ssh2
     */
    handleAuthentication (ctx) {
        switch (ctx.method) {
            case 'password':
                // le client utilise une authentification par mot de passe
                if (auth.checkUserPassword(ctx)) {
                    this._username = ctx.username
                    return ctx.accept()
                }
                break;

            case 'publickey':
                // l'utilisateur a posté une clé publique sur le serveur
                if (auth.checkUserKey(ctx)) {
                    this._username = ctx.username
                    return ctx.accept()
                }
                break;

            default:
                return ctx.reject();
        }
        ctx.reject();
    }

    getStream (session) {
        return new Promise(resolve => {
            session.on('pty', (accept, reject, {rows, cols}) => {
                accept()
                session.on('shell', accept => {
                    const stream = accept()
                    const updateStreamSize = (rows, cols) => {
                        stream.rows = rows
                        stream.columns = cols
                        stream.emit('resize')
                    }
                    session.on('window-change', (accept, reject, {rows, cols}) => updateStreamSize(rows, cols))
                    updateStreamSize(rows, cols)
                    resolve(stream)
                })
            })
        })
    }

    getScreen (stream) {
        const screen = blessed.screen({
            title: 'SSHception',
            smartCSR: true,
            terminal: 'xterm-256color',
            input: stream.stdout,
            output: stream.stdin,
            autoPadding: true
        });

        screen.on('destroy', () => {
            stream.exit(0)
            stream.end()
            this._events.emit('screen.destroyed')
        })

        return screen
    }

}

module.exports = Client
