/**
 *  Gestione cookies
 *  ====================
 *  Configura i parametri del banner e dell'informativa
 */
const fs = require('fs');
const keystone = require('keystone');
const async = require('async');
const path = require('path');

const app_path = keystone.get('module root') + path.sep;

const crea_banner = require('./banner/create');
const scrivi_banner = require('./banner/to_file');

let opzioni = {
	folder: '/public/js/policies/',
	file: 'banner.js',
	banner_template: path.join(__dirname, 'banner/template.js'),
	banner_css: path.join(__dirname, 'banner/style.css'),
};

function genera_banner () {

	/**
	 *  Generazione file cookie.js
	 *  ==========================
	 */

	//	Carico stili del banner
	function get_stili (callback) {
		keystone.list('CookiesBanner').model.find().exec(function (err, globals_styles) {

			if (err) {
				return callback('/models/cookie/cookie-banner - Errore query CookieBanner: ' + (err ? err.toString() : ''))
			}

			const banner_style = {};

			globals_styles.forEach(proprieta => {
				banner_style[proprieta.chiave] = proprieta.valore;
			});

			callback(null, banner_style);
		});
	}

	// Carico i cookies e controllo se ce ne sono di profilazione/analitici
	function get_versione (callback) {
		keystone.list('CookiesList').model.find().exec(function (err, res) {

			if (err) {
				return callback('/models/cookie/cookie-banner - Errore query Cookie: ' + err.toString());
			}

			//	variabile che gestisce l'inclusione del file js del banner nel template
			keystone.set('cookies_mostra_banner', res.length);

			let versione = {
				tipo: 'small',
				analitici: false,
				profilazione: false,
				update: 0,
			};

			if(res.length > 0) {
				versione.analitici = res.some( function(el) { return el.categoria === 'AN'; });
				versione.profilazione = res.some( function(el) { return el.categoria === 'PR'; });
				let last;
				if(versione.analitici || versione.profilazione) {
					versione = 'full';
					last = res.filter( function (el) {
						return el.categoria !== 'TE';
					})
				} else {
					last = res;
				}
				versione.update = new Date(last[0].updatedAt).getTime();
			}

			callback(null, versione);
		});
	}

	// Preparo il path della view
	function get_path (callback) {
		const impostazioni = keystone.get('impostazioni') || [];
		callback(null, (impostazioni && impostazioni.policies && impostazioni.policies.cookie) ? impostazioni.policies.cookie : '/policies/cookies');
	}

	// Recupero i dati
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
				// Riempo i segnaposti nel template
				let file_js = crea_banner(...results, opzioni);
				// Minifico il file
				scrivi_banner(file_js, opzioni.destinazione);
			}
			catch (e) {
				console.error("models/cookie/cookies-banner - Errore generaFileJs(): ", e);
			}
		}

	});

}

function configura_opzioni (options) {

	if (options) {
		opzioni = Object.assign(opzioni, options);
	}

	opzioni.folder = path.join(app_path, opzioni.folder);
	opzioni.destinazione = path.join(opzioni.folder, opzioni.file);

	//	Crea la cartella di destinazione se non esiste
	check_folder(opzioni.folder);

	//	Leggo i file
	if (opzioni.banner_template) {
		fs.readFile(opzioni.banner_template, 'utf8', (err, result) => {
			if (err) {
				return console.log(`Impossibile leggere banner template: ${opzioni.banner_template}`)
			}
			opzioni.banner_template = result;
		})
	}

	if (opzioni.banner_css) {
		fs.readFile(opzioni.banner_css, 'utf8', (err, result) => {
			if (err) {
				return console.log(`Impossibile leggere banner css: ${opzioni.banner_css}`);
			}

			opzioni.banner_css = pulisci_css(result);

			if (opzioni.custom_css) {
				try {
					fs.readFile(opzioni.custom_css, 'utf8', (err, result) => {
						opzioni.banner_css += ' ' + pulisci_css(result);
					})
				} catch (e) {
					console.log(`Impossibile caricare custom css: ${opzioni.custom_css}`);
				}
			}
		})
	}



}

function pulisci_css (css) {
	return css.replace(/\/\*.*?\*\//gm, '').replace(/[\r\n\t]/g, '')
}

function check_folder (fldr) {
	if (!fs.existsSync(fldr)) {
		fs.mkdirSync(fldr);
	}
}

module.exports = {
	init: configura_opzioni,
	banner: {
		genera: genera_banner
	}
};
