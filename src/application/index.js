const blessed = require('blessed')

function application ({ server, client }) {
    const screen = client.screen

    const oInput1 = blessed.input({

    })

    // const oBox1 = blessed.box({
    //     parent:  screen,
    //     width:   '80%',
    //     height:  '90%',
    //     border:  'line'
    // })

    // const oImg1 = blessed.image({
    //     file: 'assets/images/fallout-vault-boy-05.gif',
    //     parent:  screen,
    //     type: 'ansi',
    //     width:   'shrink',
    //     height:  '90%',
    //     top: 0,
    //     left: 0,
    //     search: false
    // })
    //
    // // screen.append(oBox1)
    // screen.append(oImg1)

    // screen.key('i', function () {
    //     // screen.data.main.style.bg = 'blue';
    //     screen.render();
    // })

    screen.key(['C-c', 'q'], function (ch, key) {
        screen.destroy();
    })

    screen.render()
}

module.exports = application
