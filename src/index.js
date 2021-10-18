const Server = require('./Server')
const blessed = require("blessed");

function simpleTest (client) {
    const screen = client.screen
    screen.data.main = blessed.box({
        parent:  screen,
        width:   '80%',
        height:  '90%',
        border:  'line',
        content: 'Welcome to my server. Here is your own private session.',
        style:   {
            bg: 'red'
        }
    })

    screen.key('i', function () {
        screen.data.main.style.bg = 'blue';
        screen.render();
    })

    screen.key(['C-c', 'q'], function (ch, key) {
        screen.destroy();
    })

    screen.render()
}

function main () {
    const oServer = new Server(2222)
    oServer.events.on('client.connected', client => {
        simpleTest(client)
    })
}

main()
