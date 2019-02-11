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
	let banner_css = {};
	let versione = "small";

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
	async.series([
		function(callback) {
			keystone.list('CookiesBanner').model.find().exec(function (err, globals_styles) {

				if(err || globals_styles.length === 0) {
					return console.error('/models/cookie/cookie-banner - Errore query CookieBanner: ', err);
				}

				const banner_style = {};

				globals_styles.forEach(proprieta => {
					banner_style[proprieta.chiave] = proprieta.valore;
				});

				banner_css = banner_style;
				callback(null);
			});
		},
		function(callback) {
			keystone.list('CookiesList').model.find().exec(function (err, res) {
				if(err) { console.error('/models/cookie/cookie-banner - Errore query Cookie: ', err); return; }
				if(res.length > 0) {
					const analitici = res.some( function(el) { return el.categoria === 'AN'; });
					const profilazione = res.some( function(el) { return el.categoria === 'PR'; });
					if(analitici || profilazione) versione = "full";
				}
				callback(null);
			});
		},
		function(callback) {
			const IT_Globals = keystone.get('it-globals') || [];
			let it_globals_cookie = (IT_Globals && IT_Globals.policies && IT_Globals.policies.cookie) ? IT_Globals.policies.cookie : '/cookie-policy';
			try {
				let file_js = preparaBannerJavascript(versione, 2, banner_css, banner_css.posizione, it_globals_cookie, 'it');
				scriviFile(file_js || "Errore file", `${opzioni.folder}${opzioni.file}`);
			}
			catch (e) {
				console.error("models/cookie/cookies-banner - Errore generaFileJs(): ", e);
			}
			callback(null);
		}
	]);

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
function preparaBannerJavascript (versione, stile, customBannerSyle, posizione, path, locale){

	let testoTemplate  = fs.readFileSync(__dirname + '/' + pathBannerTemplate, 'utf8');
	if( !locale || locale === 'it' ){
		locale = '';
	}else{
		locale = '_' + locale
	}
	//Sostituisco i segnaposto
	if (versione === "small") {
		testoTemplate = testoTemplate.replace(/__testo__/g, pezziBanner.banner['testi'+locale].small);
	}
	else {
		testoTemplate = testoTemplate.replace(/__testo__/g, pezziBanner.banner['testi'+locale].full);
	}

	//Sostituisco i CSS - stile standard
	if (stile === 0 || stile === 1){
		testoTemplate = testoTemplate.replace(/__background__/g, pezziBanner.banner.stile[stile].background);
		testoTemplate = testoTemplate.replace(/__textColor__/g, pezziBanner.banner.stile[stile].textColor);
		testoTemplate = testoTemplate.replace(/__buttonBorderColor__/g, pezziBanner.banner.stile[stile].buttonBorderColor);
		testoTemplate = testoTemplate.replace(/__linkColor__/g, pezziBanner.banner.stile[stile].linkColor);
		testoTemplate = testoTemplate.replace(/__closeColor__/g, pezziBanner.banner.stile[stile].closeColor);
		testoTemplate = testoTemplate.replace(/__borderRadius__/g, pezziBanner.banner.stile[stile].borderRadius);
	}
	else {
		testoTemplate = testoTemplate.replace(/__background__/g, customBannerSyle.background);
		testoTemplate = testoTemplate.replace(/__textColor__/g, customBannerSyle.textColor);
		testoTemplate = testoTemplate.replace(/__buttonBorderColor__/g, customBannerSyle.buttonBorderColor);
		testoTemplate = testoTemplate.replace(/__linkColor__/g, customBannerSyle.linkColor);
		testoTemplate = testoTemplate.replace(/__closeColor__/g, customBannerSyle.closeColor);
		testoTemplate = testoTemplate.replace(/__borderRadius__/g, customBannerSyle.borderRadius + "px");
	}

	//Imposto la posizione
	testoTemplate = testoTemplate.replace(/__posizione__/g,posizione );

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
			fs.writeFile(app_path + `${opzioni.folder}${opzioni.file_min}`, js_file_min.code);
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

//module.exports.scriviFile = scriviFile;
//module.exports.preparaBannerJavascript = preparaBannerJavascript;
module.exports.genera = generaFileJs;
