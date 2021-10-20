const blessed = require('blessed');

function createMudView (parent) {
    const console = blessed.text({
        parent,
        width: '100%',
        height: '100%-1',
        top: 0,
        left: 0,
        border: 'line',
        scrollable: true,
        alwaysScroll: true,
        mouse: true
   })
    const inputCommand = blessed.textbox({
        parent,
        top: '100%-1',
        left: 0,
        height: 1,
        width: '100%'
    })
    return {
        console,
        inputCommand
    }
}

function loopInputCommand(ic, onInput) {
    ic.focus()
    ic.clearValue()
    ic.readInput((dummy, text) => {
        onInput(text)
        loopInputCommand(ic, onInput)
    })
}

function writeToAllClients (server, text) {
    server.clients.forEach(client => {
        if (client.data.components) {
            const c = client.data.components.console
            c.pushLine(text)
            c.scroll(Infinity)
            setTimeout(() => client.screen.render(), 0)
        }
    })
}

function application (server, client) {
    const screen = client.screen

    const oComponents = createMudView(screen)
    client.data.components = oComponents

    const ic = oComponents.inputCommand

    screen.key(['escape'], function (ch, key) {
        ic.clearValue()
    })

    loopInputCommand(ic, text => {
        if (text === null) {
            return true
        }
        text = text.trim()
        if (text.toLowerCase() === '/quit') {
            screen.destroy()
            return false
        }
        writeToAllClients(server,client.username + ': ' + text)
        return true
    })

    screen.render()
}

module.exports = application
