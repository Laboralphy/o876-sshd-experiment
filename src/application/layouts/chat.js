const blessed = require('blessed');
const lineinput = require('../widgets/lineinput')

module.exports = function (parent) {
    const panel = blessed.box({
        parent,
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        border: 'none'
    })
    const textConsole = blessed.text({
        parent: panel,
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
    const textPrompt = blessed.text({
        parent: panel,
        width: 1,
        height: 1,
        top: '100%-1',
        left: 0,
        content: '>'
    })
    const inputCommand = blessed.widget.lineinput({
        parent: panel,
        top: '100%-1',
        left: 2,
        height: 1,
        width: '100%-2',
        input: true,
        inputOnFocus: true
    })
    return {
        panel,
        console: textConsole,
        textPrompt,
        inputCommand
    }
}
