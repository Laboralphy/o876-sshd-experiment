const blessed = require('blessed');
const lineinput = require('../widgets/lineinput')
const Abstract = require('../layout-manager/Abstract')

class Chat extends Abstract {
    buildComponents(parent) {
        const textConsole = blessed.text({
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
        const textPrompt = blessed.text({
            parent,
            width: 1,
            height: 1,
            top: '100%-1',
            left: 0,
            content: '>'
        })
        const inputCommand = lineinput({
            parent,
            top: '100%-1',
            left: 2,
            height: 1,
            width: '100%-2',
            input: true,
            inputOnFocus: true
        })
        return {
            textConsole,
            textPrompt,
            inputCommand
        }
    }

    print (sString) {
        this.components.textConsole.pushLine(sString)
        this.components.textConsole.scroll(Infinity)
    }

    clear () {
        this.components.textConsole.setText('')
    }

    show () {
        super.show()
        const ic = this.components.inputCommand
        ic.focus()
    }

    free () {
        this.clear()
        super.free()
    }

    resetCommand () {
        const ic = this.components.inputCommand
        ic.clearValue()
        ic.focus()
    }
}

module.exports = Chat
