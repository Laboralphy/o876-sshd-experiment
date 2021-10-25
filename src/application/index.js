const viewChat = require('./layouts/chat')

function writeToAllClients (server, text) {
    server.clients.forEach(client => {
        if (client.data.components) {
            const c = client.data.components.console
            c.pushLine(text)
            c.scroll(Infinity)
            client.screen.render()
        }
    })
}

function focusCommand (client) {
    const ic = client.data.components.inputCommand
    const screen = client.screen
    ic.clearValue()
    ic.focus()
    screen.render()
}

async function application (server, client) {
    const screen = client.screen

    const oComponents = viewChat(screen)
    client.data.components = oComponents

    const ic = oComponents.inputCommand
    const csl = oComponents.console
    csl.pushLine('{yellow-fg}Bienvenue sur le serveur.{/yellow-fg}')

    ic.key(['escape'], function (ch, key) {
        focusCommand(client)
    })

    ic.key(['C-q'], function (ch, key) {
        screen.destroy()
    })

    ic.key(['enter'], function (ch, key) {
        const text = ic.getValue()
        ic.pushHistory(text)
        focusCommand(client)
        writeToAllClients(server, client.username + ': ' + text)
    })

    focusCommand(client)
}

module.exports = application
