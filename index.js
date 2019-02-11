//  Moduli per siti
function init (conf) {

    const modules = {};
    Object.keys(conf).forEach(k => {

        module.exports.cookies = require('./lib/cookies');

        if (k === 'config') {
            module.exports.config = require('./lib/config')(conf[k]);
        }

        if (k === 'i18n' ) {
            _modules.i18n = require('./lib/i18n');
            module.exports.i18n = require('./lib/i18n');
            module.exports.i18n.init(conf[k]);
        }

        if (k === 'minify_js' && conf[k]) {
            module.exports.minify_js = require('./lib/minify-js');
            module.exports.minify_js.config(conf[k]);
        }

        if (k === 'model_queries' && conf[k]) {
            module.exports.model_queries = require('./lib/model_queries');
        }

        if (k === 'seo' && conf[k]) {
            module.exports.seo = require('./lib/seo');
            module.exports.seo.config(conf[k]);
        }

        if (k === 'sitemap' && conf[k]) {
            module.exports.sitemap = require('./lib/sitemap');
        }

        if (k === 'theme') {
            module.exports.theme = require('./lib/theme');
            module.exports.theme.config(typeof conf[k] === 'object' ? conf[k] : {})
        }
    })

}

module.exports = {
    init
};
