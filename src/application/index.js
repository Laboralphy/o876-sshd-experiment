const Chat = require('./layouts/chat')
const Help = require('./layouts/help')
const LayoutRouter = require('./layout-manager/Router')

class Application {
    constructor (server, client) {
        this._server = server
        this._client = client
        this.buildRouter()
    }

    /**
     * Construction de toutes les routes d'interface possible
     */
    buildRouter () {
        const oLayoutRouter = new LayoutRouter()
        oLayoutRouter.screen = this._client.screen
        oLayoutRouter.addRoute('chat', Chat)
        oLayoutRouter.addRoute('help', Help)
        this._client.data.view = oLayoutRouter
    }

    /**
     * Affiche l'interface correspondant à la route spécifiée
     * @param sRoute {string}
     */
    showView (sRoute) {
        this._client.data.view.show(sRoute)
        this.render()
    }

    sendToAllClient (text) {
        this._server.clients.forEach(client => {
            if (client.data.view) {
                client.data.view.getView('chat').print(text)
                client.screen.render()
            }
        })
    }

    /**
     * Raffraichi l'affichage du client
     */
    render () {
        this._client.screen.render()
    }

    resetCommand () {
        this._client.data.view.getView('chat').resetCommand()
        this.render()
    }

    print (sText) {
        this._client.data.view.getView('chat').print(sText)
        this.render()
    }

    quit () {
        this._client.screen.destroy()
    }

    funcKeyEvent (key) {
        switch (key.name) {
            case 'f1':
                this.showView('help')
                break

            case 'f2':
                this.showView('chat')
                break
        }
    }

    run () {
        this.showView('chat')
        const oChat = this._client.data.view.getView('chat')
        const ic = oChat.components.inputCommand
        const screen = this._client.screen

        ic.key(['escape'], (ch, key) => {
            this.resetCommand()
        })

        ic.key(['enter'], (ch, key) => {
            const text = ic.getValue()
            ic.pushHistory(text)
            this.resetCommand()
            this.sendToAllClient(this._client.username + ': ' + text)
        })

        screen.key(['C-q'], (ch, key) => {
            this.quit()
        })

        screen.key(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'], (ch, key) => {
            this.funcKeyEvent(key)
        })

        ic.key(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'], (ch, key) => {
            this.funcKeyEvent(key)
        })
    }
}

function application (server, client) {
    const app = new Application(server, client)
    app.run()
}

module.exports = application
