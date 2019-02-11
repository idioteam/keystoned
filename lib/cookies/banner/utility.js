const fs = require ('fs');
const keystone = require('keystone');
const async = require('async');
const path = require('path');
const pathBannerTemplate = "placeholders.js";
const pezziBanner = require('./default_config.js');
const app_path = keystone.get('module root') + path.sep;
const UglifyJS = require('uglify-js');

let opzioni = {
	folder: '/public/js/it-policies/',
	file: 'banner.js'
};

/**
 *  Genera il file cookie.js nella cartella /public/js da importare nei template
 */
function generaFileJs (options = {}) {

	configura_opzioni(opzioni);

	/**
	 *  Generazione file cookie.js
	 *  ==========================
	 *  1 - Carico gli stili del banner
	 *  2 - Carico i cookies e controllo se ce ne sono di profilazione/analitici
	 *  3 - Preparo il path della view
	 *  4 - Riempo i segnaposti nel template del file .js
	 *  5 - Comprimo il file in un .min.js
	 */

	function get_stili (callback) {
		keystone.list('CookiesBanner').model.find().exec(function (err, globals_styles) {

			if(err || globals_styles.length === 0) {
				return callback('/models/cookie/cookie-banner - Errore query CookieBanner: ' + (err ? err.toString() : ''))
			}

			const banner_style = {};

			globals_styles.forEach(proprieta => {
				banner_style[proprieta.chiave] = proprieta.valore;
			});
			callback(null, banner_style);
		});
	}

	function get_versione (callback) {
		keystone.list('CookiesList').model.find().exec(function (err, res) {

			if (err) {
				return callback('/models/cookie/cookie-banner - Errore query Cookie: ' + err.toString());
			}

			let versione = "small";
			if(res.length > 0) {
				const analitici = res.some( function(el) { return el.categoria === 'AN'; });
				const profilazione = res.some( function(el) { return el.categoria === 'PR'; });
				if(analitici || profilazione) versione = "full";
			}
			callback(null, versione);
		});
	}

	function get_path (callback) {
		const impostazioni = keystone.get('impostazioni') || [];
		callback(null, (impostazioni && impostazioni.policies && impostazioni.policies.cookie) ? impostazioni.policies.cookie : '/cookie-policy');
	}

	async.parallel([
		get_stili,
		get_versione,
		get_path
	], function (err, results) {

		if (err) {
			console.log('Errore durante generazione banner cookie', err);
		}

		if (!err) {
			try {
				let file_js = preparaBannerJavascript(...results, 2, 'it');
				scriviFile(file_js || "Errore file", `${opzioni.folder}${opzioni.file}`);
			}
			catch (e) {
				console.error("models/cookie/cookies-banner - Errore generaFileJs(): ", e);
			}
		}

	});

}

/**
 * Restituisce il file Javascript da inviare come banner sostituendo i date nel template
 *
 * @param versione:  "small" o "full" a seconda del tipo di banner
 * @param stile: 0 (chiaro), 1(scuro) o 2 (personalizzato)
 * @param customBannerSyle: JSON con proprietà custom
 * @param posizione: Posizione in cui visualizzare il banner
 * @param path
 */
function preparaBannerJavascript (customBannerSyle, versione, path, stile, locale){

	let testoTemplate  = fs.readFileSync(__dirname + '/' + pathBannerTemplate, 'utf8');
	if( !locale || locale === 'it' ){
		locale = '';
	}else{
		locale = '_' + locale
	}

	// Inserisco i testo
	testoTemplate = testoTemplate.replace(/__testo__/g, pezziBanner.banner['testi'+locale][versione]);

	// Inserisco gli stili
	const stili = (stile === 2 ? customBannerSyle : pezziBanner.banner.stile[stile]);
	testoTemplate = testoTemplate.replace(/__background__/g, stili.background);
	testoTemplate = testoTemplate.replace(/__textColor__/g, stili.textColor);
	testoTemplate = testoTemplate.replace(/__buttonBorderColor__/g, stili.buttonBorderColor);
	testoTemplate = testoTemplate.replace(/__linkColor__/g, stili.linkColor);
	testoTemplate = testoTemplate.replace(/__closeColor__/g, stili.closeColor);
	testoTemplate = testoTemplate.replace(/__borderRadius__/g, stili.borderRadius + 'px');

	//Imposto la posizione
	testoTemplate = testoTemplate.replace(/__posizione__/g,customBannerSyle.posizione );

	//Cambio il path del link per l'informativa
	testoTemplate = testoTemplate.replace(/__path__/g, path);

	//Restituisco il risultato
	return testoTemplate;
}

/**
 * Crea un file con il testo nella destinazione
 * @param testo
 * @param destinazione
 */
function scriviFile(testo, destinazione){

	const dest = path.join(app_path, destinazione);

	fs.writeFile(dest, testo, function(err) {

		if(err) {
			return console.error("Errore salvataggio file: ", err);
		}

		const js_file_min = UglifyJS.minify(
			fs.readFileSync(app_path + `${opzioni.folder}${opzioni.file}`).toString(),
			{
				mangle: true,
				output: {
					preamble: '// (c) Idioteam\n// ' + new Date()
				},
				compress:  {
					sequences: true,
					dead_code: true,
					conditionals: true,
					booleans: true,
					unused: true,
					if_return: true,
					join_vars: true,
					drop_console: true
				}
			}
		);

		if (js_file_min) {
			fs.writeFile(app_path + `${opzioni.folder}${opzioni.file_min}`, js_file_min.code, function (err) {
				// callback vuota, altrimenti node si lamenta
			} );
		}

	});

}
//	Opzioni
function configura_opzioni (options) {

	if (options) {
		opzioni.folder = options.folder || opzioni.folder;
		opzioni.file = options.file || opzioni.file;
	}
	opzioni.file_min = opzioni.file.replace('.js', '') + '.min.js';

	//	Crea la cartella di destinazione se non esiste
	if (!fs.existsSync(app_path + opzioni.folder)){
		fs.mkdirSync(app_path + opzioni.folder);
	}

}

module.exports.genera = generaFileJs;
