/**
 *  Gestione multilingua
 *  ====================
 *  Questo modo configura il modulo i18n per l'internazionalizzazione
 *  Esporta dei middleware che gestiscono le lingue nelle route
 *  Esporta un metodo per creare dei campi multilingua nei modelli
 *  Esporta un metodo per definire routes multilingua
 */
const keystone = require('keystone');
const fs = require('fs');
const Types = keystone.Field.Types;

const i18n = require('i18n');
const path = require('path');

const suffisso = '_i18n_';
const nomeLingua = {
    'it': 'Italiano',
    'en': 'Inglese',
    'de': 'Tedesco',
    'fr': 'Francese',
    'es': 'Spagnolo'
};

let _app = null;

let opzioni_i18n = null;
let opzioni_mw = null;

function _set_default_locale (locals) {
    locals.defaultLocale = opzioni_i18n.defaultLocale;
    locals.locales = opzioni_i18n.locales;
    locals.nascondi_default_locale = opzioni_i18n.nascondi_default_locale;
    locals.locales_path = {};
    opzioni_i18n.locales.forEach(l => {
        if (l === opzioni_i18n.defaultLocale) {
            locals.locales_path[l] = `${opzioni_i18n.nascondi_default_locale ? '' : '/' + l}`;
        } else {
            locals.locales_path[l] = `/${l}`;
        }
    })
}

/**
 * Ritorna la configurazione del modulo i18n
 * @returns {*}
 * @private
 */
function _get_conf () {
    return opzioni_i18n;
}

//  Inizializzazione modulo
//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

/**
 * Configura il modulo i18n e le opzioni per il middleware
 * @param opzioni
 * @param opzioni_middleware
 * @private
 */
function _init(opzioni = {}, opzioni_middleware = {}) {

    const defaults = {
        autoReload: false,
        admin_ui: true,
        cookie: 'lang',
        defaultLocale: 'it',
        directory: path.join(keystone.get('module root'), 'locales'),
        extension: '.json',
        locales: ['it', 'en'],
        nascondi_default_locale: true,
        objectNotation: true,
        routes_map: [],
        redirections: [],
        syncFiles: true,
        updateFiles: true
    };

    opzioni_i18n = Object.assign(defaults, opzioni);

    opzioni_middleware.escludiRoutes = opzioni_middleware.escludiRoutes || [];
    opzioni_middleware.escludiRoutes = Array.isArray(opzioni_middleware.escludiRoutes) ? opzioni_middleware.escludiRoutes : [opzioni_middleware.escludiRoutes];

    //  opzioni per middleware
    opzioni_mw = {
        re_routes: new RegExp('^\/(' + opzioni_i18n.locales.join('|') + ')([\/\?].*)?$','i'),
        re_esclusioni: opzioni_middleware.escludiRoutes.concat([
            /^\/keystone\//,
            /^\/api\//,
            /^\/legal\//,
            /\.xml$/,
            /\.txt$/
        ])
    };

    //  valuto parametro admin_ui
    if (opzioni_i18n.admin_ui) {
        opzioni_i18n.autoReload = true;
        opzioni_i18n.syncFiles = false;
        opzioni_i18n.updateFiles = false;
    }

    //	assegno locales a keystone
    const locales = opzioni_i18n.locales.map(l => ({locale: l}));
    keystone.set('locales', locales);

    //	provo a importare il modello traduzioni se disponibile
    if (opzioni_i18n.admin_ui === true) {
        if (fs.existsSync(path.join(keystone.get('module root'), 'lib', 'models', 'traduzioni'))) {
            keystone.import('lib/models/traduzioni');
        } else {
            console.log(`index.js 119 _init`, `non trovato`);
        }
    }

    //  configuro modulo i18n
    i18n.configure(opzioni_i18n);

}

//  Middlewares
//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//
/**
 * Middleware per rilevare la lingua
 * Utilizza un cookie per tenere traccia della lingua corrente
 * redirige gli url senza info sulla lingua alla route corretta
 * @private
 */
function _redirect () {
    keystone.pre('routes', i18n.init);
    keystone.pre('routes', _mw_redirect);
}
/**
 * Middleware per rilevare la lingua
 * @param req
 * @param res
 * @param next
 * @private
 */
function _mw_redirect (req, res, next) {

    req.locale = req.cookies.leng || req.locale;
    _set_default_locale(res.locals);

    //  Controllo route corrente
    if (opzioni_mw.re_esclusioni.some(e => req.url.match(e))) {
        //  se è tra le route escluse esco
        req.setLocale(req.locale);
        res.locals.locale = req.locale;

        return next();
    }

    //  Controllo slash finale
    if( req.url.lastIndexOf('/') !== req.url.length-1 ){
        req.url += '/';
    }

    //  Verifico se la route setta un linguaggio
    const match = req.url.match(opzioni_mw.re_routes);
    if (match) {

        //  Imposto lingua per dizionario
        req.setLocale(match[1]);

        //  Imposto lingua per view
        res.locals.locale = req.getLocale();

        //  Imposto cookie
        res.cookie(opzioni_i18n.cookie, req.getLocale());

    } else {

        //  Se il locale della request non è tra quelli gestiti
        //  imposto il locale di default
        if (!opzioni_i18n.locales.some(e => e === req.locale)) {
            req.locale = opzioni_i18n.defaultLocale;
        }

        res.cookie(opzioni_i18n.cookie, req.locale);
        res.redirect(302, '/' + req.locale + req.url);
        return;
    }

    locals_i18n_set(req, res);

    return next()
}
/**
 * Middleware per il settaggio della lingua
 * @private
 */
function _browse () {
    keystone.pre('routes', i18n.init);
    keystone.pre('routes', _mw_browse);
}
/**
 * Middleware per il settaggio della lingua
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function _mw_browse (req, res, next) {

    _set_default_locale(res.locals);

    //  Controllo route corrente
    if (opzioni_mw.re_esclusioni.some(e => req.url.match(e))) {
        req.setLocale( req.locale );
        res.locals.locale = req.locale;
        res.locals.localePath = ( res.locals.locale === opzioni_i18n.defaultLocale ? '' : '/' +  res.locals.locale);

        return next();
    }

    //  Verifico che la richiesta abbia un locale e servo la pagina corrispondente
    const match = req.url.match(opzioni_mw.re_routes);
    if (match) {

        req.setLocale(match[1]);

        //	Imposto lingua per le view
        res.locals.locale = match[1];
        res.locals.localePath = ( match[1] === opzioni_i18n.defaultLocale ? '/' + opzioni_i18n.defaultLocale : '/' +  match[1])
        //  res.locals.localePath = ( match[1] === opzioni_i18n.defaultLocale ? '' : '/' +  match[1])

    } else {

        req.setLocale(opzioni_i18n.defaultLocale);
        res.locals.locale = req.getLocale();
        res.locals.localePath = '/' + opzioni_i18n.defaultLocale;
        // res.locals.localePath = '';

    }

    locals_i18n_set(req, res);

    next()
}

/**
 * Aggiunge alle locals l'oggetto i18n con utilità per la gestione delle lingue
 * @param req
 * @param res
 */
function locals_i18n_set (req, res) {

    res.locals.i18n = {
        __: locals_i18n_get_field_value.bind(null, res.locals.locale),
        __paths: locals_i18n_paths({path: req.path, locale: res.locals.locale}),
        m: require('moment'),
        path: req.path
    };
    res.locals.i18n.m.locale(res.locals.locale)

}
/**
 *  Trova il valore di key nell'oggetto o nel locale locale
 * @param locale
 * @param o
 * @param key
 * @returns {string}
 */
function locals_i18n_get_field_value(locale, o, key) {
    key = key.split('.');
    let field = [''];
    key.forEach((k,i) => {
        if (i === 0) {
            field = o[_crea_nome_campo(k, locale)];
            if (!field || !field.trim()) {
                field = o[_crea_nome_campo(k, opzioni_i18n.defaultLocale)];
            }
        } else {
            field = field[k];
        }
    });
    return field;

}
/**
 * Elenca i path della pagina nelle lingue configurate eccetto quella corrente
 * @param conf
 * @returns {string[]}
 */
function locals_i18n_paths (conf) {

    const re = new RegExp(`\/${conf.locale}\/`);
    return opzioni_i18n.locales.filter(l => l !== conf.locale).map(l => conf.path.replace(re, `/${l}/`));

}
//	Routes
//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//
function _set_app (app) {
    _app = app
}

function _set_routes (...args) {

    if (!_app) {
        throw new Error('Metodo i18n.routes.init non chiamato o app non valida');
    }

    let err_msg = [`Questo metodo accetta un numero variabile di parametri da 2 a 4`, `Parametri passati: ${args.length}`];

    if (!args.length || args.length < 2) {
        throw new Error(err_msg.join('\n'))
    }

    let route = args[0];
    let middleware = null;
    let controller = null;
    let method = 'get';

    if (args.length === 2) {
        controller = args[1];
    }

    if (args.length === 3) {
        if (typeof(args[2]) === 'string') {
            controller = args[1];
            method = args[2];
        } else {
            middleware = args[1];
            controller = args[2];
        }
    }

    if (args.length === 4) {
        middleware = args[1];
        controller = args[2];
        method = args[3];
    }

    //  Verifico route
    if (route === null || (typeof route !== 'string' && !Array.isArray(route))) {
        err_msg.push(`le route possono essere definite con una singola stringa o un array di stringhe`);
        throw new Error(err_msg.join('\n'));
    }
    //  Verifico middleware
    if(middleware !== null && typeof middleware !== 'function' && !Array.isArray(middleware)) {
        err_msg.push(`I middleware devono essere funzioni o array di funzioni`);
        throw new Error(err_msg.join('\n'));
    }
    //  Verifico controller
    if(typeof controller !== 'function') {
        err_msg.push(`I controller devono essere funzioni`);
        throw new Error(err_msg.join('\n'));
    }
    //  Verifico metodo
    if(typeof method !== 'string'){
        err_msg.push(`Il metodo deve essere una stringa`);
        throw new Error(err_msg.join('\n'));
    }

    //	Routes
    if (!Array.isArray(route)) {
        route = [route];
    }

    //  Mappa delle route da creare
    const routes = route.reduce((a, path) => {
        opzioni_i18n.locales.forEach(l => a.push(l === opzioni_i18n.defaultLocale && opzioni_i18n.nascondi_default_locale ? `${path}` : `/${l}${path}`));
        return a;
    }, []);

    //  Elenco delle route internazionalizzate
    routes.forEach(r => {
        r = r.replace(/\/$/, '');
        let match = r.match(/\/:\w+\?/);
        if (match) {
            opzioni_i18n.routes_map.push(r.replace(match[0], ''))
        }
        opzioni_i18n.routes_map.push(r);
    });

    opzioni_i18n.routes_map = opzioni_i18n.routes_map.map(r => r.charAt(r.length-1) === '/' ? r.substring(0, r.length - 1) : r);

    //  La creazione di route con array è deprecata
    //  ciclo routes e creo routes separate
    routes.forEach(route => {
        if (middleware) {
            _app[method](route, middleware, controller);
        } else {
            _app[method](route, controller);
        }
    });

    //	Redirects
    if( opzioni_i18n.nascondi_default_locale) {
        //	Redirigo lingua default + route su route
        route.forEach(p => {
            opzioni_i18n.redirections.push('/' + opzioni_i18n.defaultLocale + p);
            _app[method]('/' + opzioni_i18n.defaultLocale + p, redirect_factory(p, opzioni_i18n.defaultLocale, 'remove'));
        })
    } else {
        //	Redirigo route su lingua default + route
        route.forEach(p => {
            opzioni_i18n.redirections.push(p);
            _app[method](p, redirect_factory (opzioni_i18n.defaultLocale + p, opzioni_i18n.defaultLocale, 'add'));
        })
    }

}
/**
 * Restituisce un controller per la redirezione sulla lingua principale
 * @param route
 * @param defaultLocale
 * @param redirection_type
 * @returns {function(*, *): *}
 */
function redirect_factory (route, defaultLocale, redirection_type) {

    return function (req, res) {

        let redirect_url;

        if (redirection_type === 'add') {
            redirect_url = `/${defaultLocale}/${req.originalUrl}`;
        } else {
            req.test = 'it';
            const re = new RegExp('^\/' + defaultLocale + '\/');
            redirect_url = '/' + req.originalUrl.replace(re, '')
        }
        if (redirect_url.length > 1) {
            redirect_url = `/${redirect_url}`;
            redirect_url = redirect_url.replace(/\/\//g, '/')
        }

        return res.redirect (301, redirect_url)

    }
}
//  Creazione campi
//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

function _crea (modello, campi, usa_selettore_lingue = false, titolo = '') {

    const headings = {};
    const fields = {};
    const autokeys = [];

    //  Determino autopath del modello
    if (modello.autokey && modello.autokey.from) {
        modello.autokey.from.forEach(e => autokeys.push(e.path));
    }

    // Generazione oggetti heading e fields
    opzioni_i18n.locales.forEach(l => {
        headings[l] = _heading_set(l, titolo,usa_selettore_lingue);
        fields[l] = {}
    });

    for (let nome_campo in campi) {

        if (campi.hasOwnProperty(nome_campo)) {

            //  Creo i campi per tutte le lingue
            opzioni_i18n.locales.forEach(l => {
                fields[l][_crea_nome_campo(nome_campo, l)] = _crea_campo(nome_campo, campi[nome_campo], l, autokeys, usa_selettore_lingue);
            });

            //  Aggiungo al modello metodo per gestione lingue
            modello.schema.methods[nome_campo] = _get_i18n_value(nome_campo, suffisso);
        }

    }

    //  Selettore lingua
    if (usa_selettore_lingue) {
        modello.add({
            sceltaLingua: {
                type: Types.Select,
                options: opzioni_i18n.locales.join(','),
                default: opzioni_i18n.defaultLocale,
                label: 'Scelta lingua',
                note: 'Salvare le eventuali modifiche prima di effettuare il cambio lingua'
            }
        })
    }

    //  Aggiungo ciascun gruppo heading + campi al modello
    opzioni_i18n.locales.forEach(l => {

        //	Heading lingua
        modello.add(headings[l]);

        //	Campi
        let keys = Object.keys(fields[l]);
        keys.forEach(k => {

            let campo = fields[l][k];
            if (campo.hasOwnProperty('heading')) {
                //	 inserisco heading
                modello.add(campo);
            } else {
                //	campo normale
                let f = {};
                f[k] = campo;
                modello.add(f);
            }
        })

        // modello.add(fields[l]);
    });

    //	Metodo statico per recuperare il nome del campo internazionalizzato
    modello.schema.statics.get_name = _get_i18n_name;

}
/**
 * Ritorna il nome del campo nome_campo internazionalizzato in base al locale passato
 * @param nome_campo
 * @param locale
 * @returns {*}
 * @private
 */
function _get_i18n_name (nome_campo, locale) {

    return _crea_nome_campo(nome_campo, locale);

}
/**
 * Ritorna il metodo per il recupero del valore del campo in lingua
 * this è relativo al modello
 * @param nome_campo
 * @param suffisso
 * @returns {function(*): *}
 * @private
 */
function _get_i18n_value (nome_campo, suffisso) {

    return function (locale) {

        let value = this[nome_campo + suffisso + locale];

        if (typeof value === 'object' && (!value.secure_url && !value.filename)) {
            let val = JSON.parse(JSON.stringify(value));
            Object.keys(val).forEach(v => {

                if (!value[v] || JSON.stringify(value[v]) === '{}') {
                    value[v] = this[nome_campo + suffisso + opzioni_i18n.defaultLocale][v];
                }

            });
        }

        if (locale !== opzioni_i18n.defaultLocale && !value) {
            value = this[nome_campo + suffisso + opzioni_i18n.defaultLocale];
        }

        return value;

    }
}
/**
 * Crea il campo in lingue
 * @param nome_campo
 * @param campo
 * @param lingua
 * @returns {*}
 * @private
 */
function _crea_campo (nome_campo, campo, lingua, autokeys, usa_selettore_lingue) {

    const nome = _crea_nome_campo(nome_campo, lingua);
    const is_default_language = (lingua === opzioni_i18n.defaultLocale);
    const obj = _cloneField(campo);

    //  Se il campo ha la proprietà initial
    //  la rimuvovo dalle lingua non default
    if (obj.initial) {

        if (is_default_language) {
            obj.required = true;
        } else {
            delete obj.initial;
            delete obj.required;
        }

    }


    if (typeof(campo) === 'object' && !campo.heading) {
        if (!campo.hasOwnProperty('type')) {

            for (let figlio in obj) {

                if (obj.hasOwnProperty(figlio)) {
                    let child = obj[figlio];
                    if (typeof(child) === 'object' && child.hasOwnProperty('type')) {

                        child.path = figlio;
                        child.label = child.label || keystone.utils.upcase(nome_campo) + ' ' + figlio;

                        //  Se il campo figlio è utilizzato come autokey
                        //  non imposto il dependsOn in modo che sia sempre visibile
                        if (usa_selettore_lingue && !_is_autokey.call(autokeys, nome + '.' + figlio)) {
                            _set_dependsOn(child, lingua);
                        }
                    }
                }
            }

        } else {

            obj.path = nome;
            obj.label = obj.label || keystone.utils.upcase(nome_campo);

            if (usa_selettore_lingue && !_is_autokey.call(autokeys, nome)) {
                _set_dependsOn(obj, lingua);
            }

        }
    } else if (typeof(campo) === 'string' || (typeof(campo) === 'object' && campo.heading)){
        //	Heading
        return _heading_set(lingua, obj, usa_selettore_lingue)
    }

    return obj;
}
function _crea_nome_campo (nome, lingua) {
    return nome + suffisso + lingua;
}
/**
 * Imposta l'header per la lingua
 * @param lingua
 * @param campo
 * @param usa_selettore_lingue
 * @returns {{heading: string}}
 * @private
 */
function _heading_set (lingua, campo, usa_selettore_lingue) {

    if (typeof(campo) === 'string') {

        let header = {
            heading: (campo ? campo + ' ' : '') + nomeLingua[lingua]
        };

        if (usa_selettore_lingue) {
            header.dependsOn = {
                'sceltaLingua': lingua
            }
        }

        return header;

    }

    if (typeof(campo) === 'object') {

        let heading;
        if (typeof(campo.heading) === 'object') {
            campo.heading = campo.heading[lingua]
        }

        if (usa_selettore_lingue) {
            if (campo.dependsOn) {
                campo.dependsOn.sceltaLingua = lingua;
            } else {
                campo.dependsOn = {
                    'sceltaLingua': lingua
                }
            }

        }
        return campo;
    }

}

/**
 * Verifica se il campo path è utilizzato per generare le autokey
 * @param path
 * @returns {boolean}
 * @private
 */
function _is_autokey (path) {

    if (!this.length) return false;

    return this.some(e => e === path);

}

function _set_dependsOn (campo, lingua) {

    if (campo.dependsOn) {
        campo.dependsOn.sceltaLingua = lingua;
    } else {
        campo.dependsOn = {sceltaLingua: lingua};
    }

}

function _cloneField(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    let temp = obj.constructor(); // give temp the original obj's constructor
    for (let key in obj) {
        temp[key] = _cloneField(obj[key]);
    }

    return temp;
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

module.exports = {
    get_conf: _get_conf,
    i18n: i18n,
    init: _init,
    middlewares: {
        redirect: _redirect,
        browse: _browse
    },
    models: {
        create_fields: _crea
    },
    routes: {
        init: _set_app,
        set: _set_routes
    }
};
