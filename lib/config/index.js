/**
 *  Gestione file di configurazione
 *  ===============================
 *  Consente di gestire file di configurazione per estendere keystone con proprietà predefinite
 *  I file devono risiedere in una cartella nella radice del progetto di keystone (default config)
 *  e devono avere nomi corrispondenti al valore della proprietà NODE_ENV
 */
const keystone = require('keystone');
const path = require('path');

const ESCI_SU_ERRORE = {
    'TRUE': true,
    'FALSE': false
};

let default_options = {
    'wysiwyg additional options': { force_br_newlines: true, force_p_newlines: false, forced_root_block: false, verify_html: false, relative_urls: true, },
    'wysiwyg additional plugins': 'paste, charactercount',
    'cloudinary secure': true,
    'cloudinary folders': true,
    'start_time': new Date().getTime(),
};

/**
 * Notifica un errore e chiude il processo
 * @param ambiente - nome dell'ambiente
 * @param msg - messaggio di errore
 * @param exit - se true (default) chiude il processo
 * @private
 */
function _log_errore (ambiente, msg, exit = true) {

    console.log(Array(msg.length+3).join("-") );
    console.log(' ERRORE DI CONFIGURAZIONE');
    console.log(' NODE_ENV=' + ambiente);
    console.log(' ' + msg);
    console.log(Array(msg.length+3).join("-") );

    if (exit) {
        process.exit();
    }
}

/**
 * Crea e ritorn la funzione per lo store delle sessioni
 * @param mongo_connection_string
 * @param session
 * @private
 */
function _session_store (mongo_connection_string, session) {

    const mongodb_store = require('connect-mongodb-session');
    //  Genero funzione e la ritorno
    return new (mongodb_store(session))({
        uri: mongo_connection_string,
        collection: 'app_sessions',
    })
}

/**
 * Cicla l'elenco dei paramatri e li applica a keystone
 * @param parametri
 * @private
 */
function _init (parametri) {

    for (let parametro in parametri) {
        if (parametri.hasOwnProperty(parametro)) {
            keystone.set(parametro, parametri[parametro]);
        }
    }

}

/**
 * Legge il file di configurazione e predispone proprietà per configurare keystone
 * @param ambiente - nome del file di configurazione (proveniente da NODE_ENV)
 * @param conf_folder - nome della cartella di configurazione - default config
 * @returns {{init: any, lista: *, db: {name: string, port: *, host: *}}}
 */
function configura (ambiente = 'developement', conf_folder = 'config') {

    let parametri = null;

    //  Verifica che esista il file corrispondente ad ambiente nella cartella di configurazione
    try {
        let conf_path = path.join( keystone.get('module root'), conf_folder, ambiente.toLowerCase());
        parametri = require(conf_path);
    } catch (e) {
        _log_errore(ambiente, `Impossibile caricare il file ${conf_folder}/${ambiente}.js`, ESCI_SU_ERRORE.TRUE);
    }

    //  Verifica esistenza configurazione database
    if (!parametri.db || !parametri.db.name) {
        _log_errore(ambiente, `Configurazione database per ambiente '${ambiente}' errata o mancante`, ESCI_SU_ERRORE.TRUE)
    }

    //  Configurazione mongo
    const db = {
        name: parametri.db.name,
        port: parametri.db.port,
        host: parametri.db.host,
    };

    parametri.mongo = `mongodb://${parametri.db.host}:${parametri.db.port}/${parametri.db.name}`;
    delete parametri.db;

    //  Verifico se esiste il modulo connect-mongodb-session
    //  e se esiste configuro la proprietà 'session store'
    try {
        const connectMongoDBSession = require('connect-mongodb-session');
        parametri['session store'] = _session_store.bind(null, parametri.mongo);
    } catch (e) {
        _log_errore(ambiente, 'Modulo connect-mongodb-session non installato, impossibile configurare uno store per le sessioni', ESCI_SU_ERRORE.FALSE)
    }

    //  Unisco opzioni di default
    Object.assign(parametri, default_options);

    //  Aggiungo metodo per accedere alla cartella lib
    parametri.lib = function (...libPaths) {
        libPaths = libPaths.join(path.sep);
        return require(path.join(global.basePath, 'lib', libPaths));
    };

    parametri['404'] = function (req, res, next) {
        res.not_found();
    };

    return {
        init: _init.bind(null, parametri),
        lista: parametri,
        db: db
    }
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

module.exports = configura;
