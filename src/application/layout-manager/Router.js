class Router {
    constructor () {
        this._routes = {}
        this._screen = null
    }

    set screen (value) {
        this._screen = value
    }

    get screen () {
        return this._screen
    }

    addRoute (sRoute, pClass) {
        this._routes[sRoute] = {
            instance: null,
            class: pClass
        }
        return this.getView(sRoute)
    }

    getView (sRoute) {
        if (sRoute in this._routes) {
            const oRoute = this._routes[sRoute]
            if (oRoute.instance === null) {
                if (!this._screen) {
                    throw new Error('Layout router screen has not been defined')
                }
                const pClass = oRoute.class
                const oInstance = new pClass(this._screen)
                oRoute.instance = oInstance
                return oInstance
            } else {
                return oRoute.instance
            }
        } else {
            throw new Error('This view-route does not exists : "' + sRoute + '"')
        }
    }

    show (sRoute) {
        for (const [k, r] of Object.entries(this._routes)) {
            const bVisibleRoute = sRoute === k
            const oInstance = r.instance
            if (oInstance) {
                if (bVisibleRoute) {
                    oInstance.show()
                } else {
                    oInstance.hide()
                }
            } else if (bVisibleRoute) {
                this.getView(k)
            }
        }
    }
}

module.exports = Router
