class Abstract {
    constructor (parent) {
        this._oComponents = this.buildComponents(parent)
        this.hide()
    }

    get components () {
        return this._oComponents
    }

    buildComponents (parent) {
        throw new Error('ERR_ABSTRACT_METHOD buildComponents')
    }

    _forEachComponent (callback) {
        for (const [sKey, oComp] of Object.entries(this._oComponents)) {
            callback(oComp, sKey)
        }
    }

    show () {
        this._forEachComponent(c => c.show())
    }

    hide () {
        this._forEachComponent(c => c.hide())
    }

    free () {
        this._forEachComponent(c => c.free())
    }
}

module.exports = Abstract
