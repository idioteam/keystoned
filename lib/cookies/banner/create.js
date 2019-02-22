const banner_config = require('./config');

/**
 * Restituisce il file Javascript da inviare come banner sostituendo i date nel template
 * @param banner_style
 * @param versione_testo
 * @param path_policy
 * @param opzioni
 * @param stile
 * @param locale
 * @returns {string}
 */
function create (banner_style, versione_testo, path_policy, opzioni, stile = 2, locale = 'it') {

    let banner_template = opzioni.banner_template;
    let stile_template = opzioni.banner_css;


    const stili = set_stili(stile, versione_testo);

    // Sostituzioni
    Object.keys(stili).forEach(s => {
        banner_template = banner_template.replace(new RegExp('__' + s + '__', 'g'), stili[s]);
        stile_template = stile_template.replace(new RegExp('__' + s + '__', 'g'), stili[s]);
    });

    // Testo
    banner_template = banner_template.replace(/__testo__/g, set_testo(stili, versione_testo.tipo, locale));

    // Stile
    banner_template = banner_template.replace(/__stile__/g, stile_template);

    // Cambio il path del link per l'informativa
    // sostituisco sia il formato __path__ settato nell'informativa
    // sia il formato [path] settabile da gestione
    banner_template = banner_template.replace(/(__path__|\[path])/g, path);

    return banner_template;
}

/**
 * Recupera il testo
 * @param stili
 * @param versione
 * @param locale
 * @returns {*}
 */
function set_testo (stili, versione, locale) {
    locale = set_locale(locale);
    let testo = stili['testo_' + versione + locale];
    if (!testo || !(testo.trim())) {
        testo = banner_config.banner['testi' + locale][versione];
    }
    return testo;

}

/**
 * Imposta e normalizza gli stili
 * @param stile
 * @param versione
 */
function set_stili (stile, versione) {

    const stili = stile === 2 ? banner_style : banner_config.banner.stile[stile];

    stili.analitici = versione.analitici;
    stili.profilazione = versione.profilazione;
    stili.backdropOpacity = stili.backdropOpacity ? '.' + stili.backdropOpacity.replace(/\./g, '') : '.4';
    stili.borderRadius = (stili.borderRadius ? stili.borderRadius : 0) + 'px';

}

/**
 * Imposta il locale per recuperare i testi
 * @param locale
 * @returns {string}
 */
function set_locale (locale) {

    if (!locale || locale === 'it') {
        return '';
    } else {
        return '_' + locale;
    }

}

module.exports = create;
