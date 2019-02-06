/**
 * Basato su keystone-express-sitemap
 * Modificato per risolvere path con parametri multipli (e correlati)
 */

const sitemap = require('express-sitemap');
const async = require('async');

const idioSitemap = function(keystone, req, res){

    let map = {};

    let route = {};
    let query_cache = {};

    let dynamicRoutes = [];
    let dateFormatString = 'YYYY-MM-DD';

    let re_remove_regExp_from_par = /\(\\+[a-z0-9\{\}\[\]\+^$]+\)/g;

    const findKeystoneList = function(string) {
        //remove dynamic parameter marker from string
        string = string.replace(':', '').toLowerCase();
        string = string.split('__')[0];

        const lists = Object.keys(keystone.lists).map(function(l) {
            return l.toLowerCase();
        });

        const listIndex = lists.indexOf(string);

        if (listIndex >= 0) {
            return keystone.list(Object.keys(keystone.lists)[listIndex]);
        }
        else {
            return null;
        }
    };

    const parseRoutes = function(){

        //	Ottengo tutte le route definite
        const routes = keystone.app._router.stack || keystone.app.routes.get;

        if( routes && routes.length > 0) {

            routes.forEach(function (r, i) {
                // express 4.x.x route objects have path property
                // express 3.x.x route objects have route.path property
                let path = r.path ? r.path : (r.route ? r.route.path : null);

                // remove any kestyone admin paths (/keystone/)// remove any kestyone admin paths (/keystone/)
                if (path != null && path.match(/keystone\*{0,1}$|keystone\/|\/\*$|sitemap\.xml|\/api\//) == null) {
                    let ignored = false;

                    //check routes against the ignored routes, if applicable
                    if (options && options.ignore && Object.prototype.toString.call(options.ignore) === '[object Array]') {
                        for (let ig in options.ignore) {
                            if (path.match(options.ignore[ig]) !== null) {
                                // if (path === options.ignore[ig] || path.match(options.ignore[ig]) !== null) {
                                ignored = true;
                                break;
                            }

                        }

                    }

                    if (ignored) {
                        return false;
                    }

                    // check for dynamic routes (with parameters identified by :[parameter name])
                    if (path.indexOf(':') > 0) {
                        path = path.replace(re_remove_regExp_from_par, '');

                        dynamicRoutes.push(path);

                        //	casomai ci fossero parametri opzionali
                        if(path.indexOf('?') !== -1){

                            let basePath = path.split(/\/:[a-zA-Z0-9_]+\?/);
                            basePath = basePath.join('');

                            if (!basePath.includes(':')){
                                map[basePath] = ['get'];
                                route[basePath] = {};
                            }else{
                                dynamicRoutes.push(basePath);
                            }

                        }

                    }
                    // route is a static route, add to routes that will be parsed into sitemap
                    else {

                        map[path] = ['get'];
                        route[path] = {};
                    }
                }
            });
        }

        // If there are dynamic routes, move to asynchronous function to query database for all routes that would follow that pattern. If not, finish up and generate sitemap.
        if (dynamicRoutes.length > 0) {
            asyncAddListRoutes();
        }
        else {
            createXmlFile();
        }

    };

    //-----------------------------------------//
    //-  customizzazione
    //-----------------------------------------//
    /**
     * Per ciascuna route dinamica vengono analizzati i parametri ed estratti i documenti
     * coi dati raccolti viene poi creato il path sostituendo i valori ai parametri a partire dall'ultimo parametro
     */
    const asyncAddListRoutes = function() {

        async.map(dynamicRoutes, estraiParametri, function(err, result) {

            result.forEach(function(risultato){

                if( risultato.parametri[0] !== null ){

                    const pathPars = getDynamicPars(risultato.path).reverse();
                    //	per ogni route crea i path in base ai documenti estratti
                    compilaPath(risultato, pathPars);

                }

            });
            //	output finale
            createXmlFile();
        });

    };

    const estraiParametri = function(path, callback){

        //	prende i parametri della route, li splitta e per ognuno ottenere i documenti
        let dynamicPaths = (path.substring(0,1) === '/' ? path.substring(1) : path)
            .split('/')
            .reduce(function(memo,path){
                if(path.indexOf(':') !== -1){
                    memo.push(path.replace('?', ''))
                }
                return memo;
            },[]);

        async.map(dynamicPaths, estraiDocumenti, function(err, risultati){
            callback(err, {path: path, parametri: risultati})
        })

    };

    const estraiDocumenti = function(parametro, cb){
        const par_name = parametro.replace(':','');
        const lista = findKeystoneList(par_name);

        if(lista){

            if (query_cache[parametro]) {
                cb(err, query_cache[parametro]);
            } else {

                let projection = {_id: 1, updatedAt: 1};
                let autokey = getAutokey(lista);
                let relazioni = getListeCorrelate(lista);

                if (autokey) {
                    projection[autokey] = 1;
                }

                if (relazioni) {
                    relazioni.forEach(function (relazione) {
                        projection[relazione.field] = 1;
                    })
                }

                let query = {};

                //	Filtri sulle liste
                if (options && options.filters && options.filters[lista.key]) {
                    if (typeof options.filters[lista.key] === 'function') {
                        query = Object.assign(query, options.filters[lista.key]());
                    } else {
                        query = Object.assign(query, options.filters[lista.key]);
                    }
                }

                //	Filtri sui parametri
                if (options && options.filters && options.filters[par_name]) {
                    if (typeof options.filters[par_name] === 'function') {
                        query = Object.assign(query, options.filters[par_name]());
                    } else {
                        query = Object.assign(query, options.filters[par_name]);
                    }
                }

                lista.model.find(
                    query,
                    projection
                )
                    .lean()
                    .exec(function (err, risultati) {

                        query_cache[parametro] = {
                            id: parametro,
                            rel: relazioni,
                            risultati: risultati
                        };

                        cb(err, query_cache[parametro]);

                    })
            }
        }else{
            // cb('Lista ' + parametro + ' non trovata', null);
            //	Se ritorno un errore esce
            cb(null, null);
        }

    };
    /**
     * Compila la route in base ai risultati trovati
     * @param oggetto -> set di risultati
     * @param parametri -> parametri della route
     */
    const compilaPath = function(oggetto, parametri){

        let path = oggetto.path;
        let parametro = parametri.shift();

        let base = getParametro.call(oggetto.parametri, parametro );

        if( base && base.id ){

            //	trovo il campo autopath della lista corrente
            let autokeyListaCorrente = getAutokey( findKeystoneList(base.id) );

            base.risultati.forEach(function (documento) {

                let lPath = costruisciPath(path, parametro, documento[autokeyListaCorrente]);

                lPath = getRelazione(base.rel, oggetto.parametri, lPath, documento, parametro);
                if (lPath && !lPath.includes(':')) {
                    map[lPath] = ['get'];
                    route[lPath] = {
                        lastmod: documento.updatedAt ? documento.updatedAt.format(dateFormatString) : null
                    };
                }

            })
        }
    };
    /**
     * Per ogni relazione alla
     * @param rel -> set di relazioni
     * @param oggetto -> elenco dei parametri
     * @param path -> path parziale da completare
     * @param documento -> documento corrente
     * @param parametro -> il parametro attualmente valutato
     * @returns {*}
     */
    const getRelazione = function (rel, oggetto, path, documento, parametro) {

        if (!parametro) return path;

        rel.forEach(function (relazione) {

            let listaCollegata;
            let nome_relazione;

            if (parametro.includes('__')) {
                nome_relazione = parametro.replace('?','');
            } else {
                nome_relazione = ':' + relazione.refList
            }
            listaCollegata = getParametro.call(oggetto, nome_relazione);

            if(listaCollegata && listaCollegata.id){

                const autokey = getAutokey( findKeystoneList(listaCollegata.id) );

                for(let l = 0, len = listaCollegata.risultati.length; l < len; l++){

                    if( documento[relazione.field] && listaCollegata.risultati[l]._id.toString() === documento[relazione.field].toString()){
                        path = costruisciPath(path, nome_relazione, listaCollegata.risultati[l][autokey]);
                        let estrai_parametro = path.split('/').filter(p => p.includes(':')).pop();
                        path = getRelazione(listaCollegata.rel, oggetto, path, listaCollegata.risultati[l], estrai_parametro);
                        break;
                    }

                }

            }

        });

        return path;

    };

    const costruisciPath = function(path, parametro, valore){

        let p = path.split('/');
        path = '';
        parametro = parametro.toLowerCase();

        p.forEach(function(frammento,i){
            path += (i > 0 ? '/' : '') + (frammento.replace(/\?$/,'').toLowerCase() === parametro ? valore : frammento);
        });
        return path;
    };

    const getParametro = function(parametro){

        if(!parametro) return [];
        parametro =  parametro.toLowerCase().replace(/\?$/,'');

        //	ciclo gli elementi per trovare la proprietà con id corrispondente al parametro
        for(let i = 0, len = this.length; i < len; i++){
            if (this[i]) {
                if (this[i].id.toLowerCase() === parametro) return this[i];
            }
        }

    };

    const getDynamicPars = function(path){
        return (path.substring(0,1) === '/' ? path.substring(1) : path).split('/').filter(function(path){
            return path.indexOf(':') !== -1;
        });
    };

    const getAutokey = function(lista){
        return lista.options.autokey && lista.options.autokey.path ? lista.options.autokey.path : '_id';
    };

    const getListeCorrelate = function(lista){

        const risultati = [];

        for( let f in lista.fields ){

            if( lista.fields.hasOwnProperty(f) ){

                if(lista.fields[f].type === 'relationship' ){
                    risultati.push({
                        field: f,
                        refList: lista.fields[f].options.ref,
                        autokey: getAutokey(findKeystoneList(lista.fields[f].options.ref))
                    });
                }

            }

        }

        return risultati;

    };

    //-----------------------------------------//
    //-  Fine customizzazione
    //-----------------------------------------//

    const create = function(ks, rq, rs, opt) {
        // set variables to be used by all other KeystoneSitemap functions
        keystone = ks;
        req = rq;
        res = rs;
        options = opt;

        query_cache = {};
        map = {};
        route = {};

        //	verifico che le route da ignorare siano espressioni regolari
        if (opt.ignore) {

            if (!Array.isArray(opt.ignore)) {
                opt.ignore = [opt.ignore]
            }

            opt.ignore = opt.ignore.map(i => {
                if (i instanceof RegExp === false) {
                    return new RegExp(`^${i}`)
                } else {
                    return i
                }
            })

        }

        parseRoutes();

    };

    const createXmlFile = function(){
        //express 3.x.x does not define req.hostname, only req.host
        //express 4.x.x has separate parameters for hostname and protocol
        const host = req.hostname ? req.hostname : req.host;

        sitemap({
            map: map,
            route: route,
            url: host,
            http: req.protocol,
            cache: 0
        }).XMLtoWeb(res);
    };

    return {
        create: create
    }

};

module.exports = idioSitemap();
