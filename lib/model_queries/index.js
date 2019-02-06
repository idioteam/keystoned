/**
 * Crea l'oggetto per la gestione della cache della query cache_id
 * @param cache_id
 * @param query
 * @private
 */
function _query_set (cache_id, query) {

    const _self = this;
    _self.cache_store[cache_id] = {
        query: query,
        data: null,
        executed: false
    }

}
/**
 * Verifica l'esistenza della cheche della query cache_id
 * ritorna la cache se esistente
 * esegue la query e ne memorizza i risultati se la cache non esiste
 * @param cache_id
 * @returns {Promise<any>}
 * @private
 */
function _query_get (cache_id) {

    const _self = this;

    let cached = _self.cache_store[cache_id];
    if (cached && cached.executed) {
        return new Promise(
            function (resolve, reject) {
                resolve(cached.data);
            }
        );
    } else {
        return new Promise(
            function (resolve, reject) {
                cached.query.exec(function(err, result) {

                    if (err) {
                        return reject(err);
                    }
                    cached.data = result;
                    cached.executed = true;
                    return resolve(result)

                })
            }
        )
    }

}
/**
 * Invalida le cache esistenti
 * @private
 */
function _updated () {
    let _self = this;
    Object.keys(_self.cache_store).forEach(k => _self.cache_store[k].executed = false)
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//


function init_schema (lista) {

    const schema = lista.schema;
    const statics = lista.schema.statics;

    //	oggetto cache
    statics.cache_store = {};

    //	Variabili e metodi di controllo
    //	-------------------------------

    statics.updated = _updated.bind(statics);

    schema.post('save', function () {
        statics.updated()
    });

    schema.post('remove', function () {
        statics.updated()
    });

    statics.query = {
        set: _query_set.bind(statics),
        get: _query_get.bind(statics)
    }

}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//


module.exports = {
    init: init_schema
};
