const blessed = require('blessed');
const lineinput = require('./lineinput')

function createMudView (parent) {
    const console = blessed.text({
        parent,
        width: '100%',
        height: '100%-1',
        top: 0,
        left: 0,
        tags: true,
        border: 'line',
        scrollable: true,
        alwaysScroll: true,
        mouse: true
   })
    const inputCommand = blessed.widget.lineinput({
        parent,
        top: '100%-1',
        left: 0,
        height: 1,
        width: '100%',
        input: true,
        inputOnFocus: true
    })
    return {
        console,
        inputCommand
    }
}

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

    const oComponents = createMudView(screen)
    client.data.components = oComponents

    const ic = oComponents.inputCommand
    const csl = oComponents.console
    csl.pushLine('{yellow-fg}Bienvenue sur le serveur.{/yellow-fg}')

    ic.key(['escape'], function (ch, key) {
        console.log('ECHAP')
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
