const blessed = require('blessed');
const Abstract = require('../layout-manager/Abstract')

class Help extends Abstract {
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
            mouse: true,
            content: `HELP
----
help component.`
        })
        return {
            textConsole
        }
    }
}

module.exports = Help
