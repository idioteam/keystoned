//  Moduli per siti
function init (conf) {

    const modules = {};
    Object.keys(conf).forEach(k => {

        if (k === 'config') {
            module.exports.config = require('./lib/config')(conf[k]);
        }

    })

}

module.exports = {
    init
};
