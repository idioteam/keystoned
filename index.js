//  Moduli per siti
function init (conf) {

    const modules = {};
    Object.keys(conf).forEach(k => {

        if (k === 'config') {
            module.exports.config = require('./lib/config')(conf[k]);
        }

        if (k === 'minify_js' && conf[k]) {
            module.exports.minify_js = require('./lib/minify-js');
            module.exports.minify_js.config(conf[k]);
        }

    })

}

module.exports = {
    init
};
