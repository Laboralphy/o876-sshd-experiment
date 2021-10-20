const crypto = require('crypto');
const { timingSafeEqual } = require('crypto')
const fs = require('fs')
const path = require('path')
const { utils } = require('ssh2');
const { parseKey } = utils

const PATH = {
    SECRET: '',
    USERS: '',
    PRIV_KEY: ''
}

const USERS = {}

function loadConfig () {
    PATH.SECRET = path.resolve(process.env.PATH_SECRET)
    PATH.USERS = path.join(PATH.SECRET, 'users')
    PATH.PRIV_KEY = path.join(PATH.SECRET, 'host.key')
}

function exists (sPath) {
    try {
        fs.statSync(sPath)
        return true
    } catch (e) {
        return false
    }
}

function checkFolders () {
    const cx = sPath => {
        if (!exists(sPath)) {
            throw new Error('expected path or file to exist : ' + sPath)
        }
    }
    cx(PATH.SECRET)
    cx(PATH.USERS)
    cx(PATH.PRIV_KEY)
}

function loadUsers () {
    const aFiles = fs.readdirSync(PATH.USERS)
    aFiles.forEach(sFile => {
        const sContent = fs.readFileSync(path.join(PATH.USERS, sFile))
        const oUser = JSON.parse(sContent.toString())
        oUser.parsedKey = oUser.key ? parseKey(oUser.key) : null
        USERS[oUser.username] = oUser
    })
}

/**
 * Permet de comparer deux valeurs. Renvoie true si les deux valeurs sont identitiques
 * Cette fonction mettra toujours le même temps à répondre quelque soit les deux valeurs spécifiées
 * afin d'empecher de déduire les longueurs des éléments à comparer
 * @param input {string|Buffer}
 * @param allowed {string|Buffer}
 * @returns {boolean}
 */
function checkValue (input, allowed) {
    if (!(input instanceof Buffer)) {
        input = Buffer.from(input)
    }
    if (!(allowed instanceof Buffer)) {
        allowed = Buffer.from(allowed)
    }
    const autoReject = input.length !== allowed.length
    if (autoReject) {
        // si les deux chaines sont de longeurs différentes
        // on force l'echec de la vérification mais on force aussi les mêmes longueurs
        allowed = input
    }
    const isMatch = timingSafeEqual(input, allowed)
    return !autoReject && isMatch
}

/**
 * Verifie qu'un utilisateur ait bien tapé son mot de passe
 * @param ctx {object}
 * @returns {boolean}
 */
function checkUserPassword (ctx) {
    const sUser = ctx.username, sPassword = ctx.password
    if (sUser in USERS) {
        const oUser = USERS[sUser]
        const c = crypto.createHash(oUser.password.algo)
        const sHashedPassword = c.update(sPassword).digest('hex')
        return checkValue(sHashedPassword.toLowerCase(), oUser.password.hash.toLowerCase())
    } else {
        return false
    }
}

function checkUserKey (ctx) {
    const sUser = ctx.username
    if (sUser in USERS) {
        const oUser = USERS[sUser]
        if (oUser.parsedKey) {
            const oKey = oUser.parsedKey
            const bSameAlgo = ctx.key.algo === oKey.type
            const bSameKey = bSameAlgo && checkValue(ctx.key.data, oKey.getPublicSSH())
            return bSameKey && ctx.signature && oKey.verify(ctx.blob, ctx.signature)
        }
    }
}

function loadHostPrivateKey () {
    return [fs.readFileSync(PATH.PRIV_KEY)]
}

let bInit = false

function init() {
    if (!bInit) {
        loadConfig()
        checkFolders()
        loadUsers()
        bInit = true
    }
}

module.exports = {
    init,
    loadHostPrivateKey,
    checkUserPassword,
    checkUserKey
}
