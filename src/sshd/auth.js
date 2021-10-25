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

const GLOBALS = {
    WRONG_PASSWORD_DELAY: 0
}

const USERS = {}

/**
 * Définition des variables globales stockant les chemins qui mène aux information clients (pass, username, id etc...)
 */
function definePathVariables (sSecretPath) {
    // dossier général contenant les information sensible (clé pub ou priv etc...)
    // Ce dossier doit être extérieur à l'application
    PATH.SECRET = path.resolve(sSecretPath)
    // Dossier des fichiers utilisateurs
    PATH.USERS = path.join(PATH.SECRET, 'users')
    // Dossier content la clé privée du serveur
    PATH.PRIV_KEY = path.join(PATH.SECRET, 'host.key')
}

/**
 * Renvoie true si le fichier spécifié existe sur le système de fichier
 * Il s'agit d'un processus synchrone car il est utilisé lors de la phase d'initialisation
 * bien avant la connexion du moindre client.
 * @param sPath {string} chemin et nom de fichier
 * @returns {boolean} true = le fichier existe, false = le fichier n'existe pas
 */
function exists (sPath) {
    try {
        fs.statSync(sPath)
        return true
    } catch (e) {
        return false
    }
}

/**
 * Vérifie l'existence des dossier nécessaire aux stockage des clé serveur et client
 * @throws Error si l'un des dossier n'existe pas
 */
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

/**
 * Charge la liste des utilisateurs.
 */
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
 * @param input {string|Buffer} chaine à comparer avec "allowed"
 * @param allowed {string|Buffer} chaine de référence avec laquelle on compare "input"
 * @returns {boolean} true = les deux chaine sont identique, false = les deux chaines sont différentes
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
 * @param ctx {object} contexte utilisateur fournit par ssh2
 * @param nWrongPasswordDelay {number} nombre de millisecondes à attendre si le mot de passe est faux
 * @returns {Promise<boolean>} true = le mot de passe est correcte
 */
function checkUserPassword (ctx, nWrongPasswordDelay = GLOBALS.WRONG_PASSWORD_DELAY) {
    return new Promise((resolve, reject) => {
        const sUser = ctx.username, sPassword = ctx.password
        if (sUser in USERS) {
            const oUser = USERS[sUser]
            const c = crypto.createHash(oUser.password.algo)
            const sHashedPassword = c.update(sPassword).digest('hex')
            if (checkValue(sHashedPassword.toLowerCase(), oUser.password.hash.toLowerCase())) {
                resolve(true)
                return
            }
        }
        if (nWrongPasswordDelay > 0) {
            setTimeout(() => resolve(false), nWrongPasswordDelay)
        } else {
            resolve(false)
        }
    })
}

/**
 * Vérifie l'authenticité d'un utilisateur s'authentifiant avec une clé.
 * @param ctx {object} contexte utilisateur fournit par ssh2
 * @returns {boolean} true = l'utilisateur est bien authentifié
 */
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

/**
 * Charge la clé du serveur
 * @returns {Buffer[]}
 */
function loadHostPrivateKey () {
    return [fs.readFileSync(PATH.PRIV_KEY)]
}

let bInit = false

/**
 * Initialisation du chargement des clés utilisateurs
 * @param WRONG_PASSWORD_DELAY {number}
 * @param PATH_SECRET {string}
 */
function init({ WRONG_PASSWORD_DELAY, PATH_SECRET }) {
    if (!bInit) {
        GLOBALS.WRONG_PASSWORD_DELAY = WRONG_PASSWORD_DELAY
        definePathVariables(PATH_SECRET)
        checkFolders()
        loadUsers()
        bInit = true
    }
}

/**
 * Renvoie les chemin calculé par definePathVariable
 * @returns {{PRIV_KEY: string, USERS: string, SECRET: string}}
 */
function getPaths () {
    return PATH
}

module.exports = {
    init,
    loadHostPrivateKey,
    checkUserPassword,
    checkUserKey,
    getPaths
}
