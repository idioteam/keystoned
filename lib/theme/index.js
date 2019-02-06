const fs = require('fs');
const path = require('path');
const keystone = require('keystone');
const sass = require('node-sass');

let options = {
	main_scss_file: 'site.scss',
	scss_folder_path: path.join(keystone.get('module root'), 'public', 'styles'),
	output_folder: 'generated',
};

/**
 * Controlla se la cartella esiste
 * @param folder_path
 * @returns {*}
 * @private
 */
function _check_folder (folder_path) {
	if(!fs.existsSync(folder_path)) {
		return fs.mkdirSync(folder_path);
	} else {
		return true;
	}
}
/**
 * Cerca di creare un file
 * Prima di creare il file ne esegue una copia, se esistente
 * In caso di errore nella creazione del nuovo file ripristina la copia
 * @param file_path
 * @param file_content
 * @param callback
 * @private
 */
function _crea_file (file_path, file_content, callback) {
	
	let backup_path = file_path + '.bck';
	
	if (fs.existsSync(file_path)) {
		fs.renameSync(file_path, backup_path);
	}
	
	fs.writeFile(file_path, file_content, (err) => {
		
		if (err) {
			console.log(`Errore durante la creazione del file ${file_path}`);
			console.log(err);
			fs.rename(backup_path, file_path);
		} else {
			fs.unlink(backup_path);
			if (callback && typeof callback === 'function'){
				callback();	
			}
		}
		
	})
	
}
/**
 * Copia un modello dalla cartella assets iniettando al suo interno i dati contenuti in dati
 * @param file
 * @param dati
 * @private
 */
function _model_copy (file, dati = {}) {

	fs.readFile(path.join(__dirname, 'assets', file ), (err, file_content) =>{

		if (err) {
			return console.log(`err`,  err);
		}

		file_content = file_content.toString();
		Object.keys(dati).forEach(d => file_content = file_content.replace( (new RegExp(`\\$\\{${d}\\}`, 'g')), dati[d]));
		fs.writeFile(path.join(dati.file_path, dati.output_name), file_content)
	})

}
/**
 * Compila il scss generato ed aggiorna il file css principale
 * @private
 */
function _render () {
		
	sass.render({
		file: path.join(options.scss_folder_path, options.main_scss_file),
		includePaths: [options.output_folder_path],
	}, (err, result) => {

		if (err) {
			return console.log(`Ricompilazione scss fallita\n`, err);
		}
		_crea_file(path.join(options.scss_folder_path, options.main_scss_file.replace('scss', 'css')), result.css);

	})
	
}
/**
 * Verifica la mappatura del campo della lista e lo normalizza
 * @param f
 * @returns {*}
 * @private
 */
function _field_normalize (f) {
	
	if (typeof f === 'object') {
		
		if (Array.isArray(f)) {
			
			if (f.length === 2) {
				return {
					field: f[0],
					prop: f[1]
				}
			} else {
				throw `Mappatura campo/css errata per ${JSON.stringify(f)}: l'array deve contenere 2 elementi di cui il primo corrispondente al campo della lista ed il secondo alla proprietà css`;
			}
			
		}
		
		if (f.hasOwnProperty('field') && f.hasOwnProperty('prop')) {
			return f;
		} else {
			throw `Mappatura campo/css errata per ${JSON.stringify(f)}: le proprietà 'field' e 'prop' sono obbligatorie`;
		}
		
	}

	if (typeof f === 'string') {
		
		return {
			field: f,
			prop: f
		}
		
	}

}
/**
 * Ritorna il valore del campo o null se non esistente
 * @param field
 * @returns {*}
 * @private
 */
function _eval_value (field) {

    if (!field) {
        return null;
    }

    if (typeof field === 'string') {
        return field;
    } else {
        if (field.hasOwnProperty('secure_url')) {
            return field.secure_url? `url('${field.secure_url}')` : null;
        }

    }

}

//	Metodi esportati
//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//
/**
 * Inizializza il componente e verifica che esista la cartella base
 * @param options_custom
 * @private
 */
function _config (options_custom = {}) {
	
	options = Object.assign(options, options_custom);
	options.output_folder_path = path.join(options.scss_folder_path, options.output_folder);

	//	Creo la cartella generated se non esiste
	if (!_check_folder(options.output_folder_path)) {
		
		if (!fs.existsSync(path.join(options.output_folder_path, '_' + options.output_folder + '.scss'))) {
			let _generated_model = fs.readFileSync(path.join(__dirname, 'assets', '_' + options.output_folder + '.scss'));
			fs.writeFileSync(path.join(options.output_folder_path, '_' + options.output_folder + '.scss'), _generated_model + '\n');
		}

		//	Creo cartella mixins
		fs.mkdir(path.join(options.output_folder_path, 'mixins'), () => {
			//	Copio il file mixin.scss
			_model_copy('mixins.scss', {
				output_name: 'mixins.scss',
				file_path: path.join(options.output_folder_path, 'mixins')
			})
		})
	}

}
/**
 * Imposta l'ambiente per la lista corrente e l'hook post save per la generazione del css
 * @param list
 * @param fields
 * @private
 */
function _set (list, fields) {
	
	// Normalizzazione dei dati passati
	if (!Array.isArray(fields)) {
		fields = [fields];
	}
	
	fields = fields.map(f => _field_normalize(f));
	
	//	Verifico esistenza cartella corrispondente al modello
	const list_folder_path = path.join(options.output_folder_path, list.path);
	
	if (!_check_folder(list_folder_path)) {
		_model_copy('_list.scss', {
			output_name: '_' + list.path + '.scss',
			file_name: list.path,
			file_path: list_folder_path
		});
		_model_copy('_variables.scss', {
			output_name: '_variables.scss',
			file_name: list.path,
			file_path: list_folder_path
		})
	}

	//	Leggo file _generated.scss e verifico se contiene il riferimento alla lista corrente
	let file_generated = fs.readFileSync(path.join(options.output_folder_path, '_generated.scss')).toString();

	let import_string = `@import '${list.path}/${list.path}';`;
	if (!file_generated.includes(import_string)) {
		fs.appendFileSync(path.join(options.output_folder_path, '_generated.scss'), '\n' + import_string);
		
	}
	
	//	Hook
	list.schema.post('save', function () {

		const autokey = list.options.autokey.path;
		const utente = this._req_user.email;

		list.model.find({})
			.exec(function (err, docs) {

				if (err || !docs) {
					return console.log(`Theme - query fallita\ndocs: ${docs}\nerr: ${err}`);
				}
				
				let variables = docs.map(d => {
					let slug = '';
					let inner_vars = fields.map(f => {
						return `${f.prop}: ${_eval_value(d[f.field])}`;
					});
					return `${d[autokey]}: (\n\t\t${inner_vars.join(',\n\t\t')}\n\t)`;
				});

				let file_content = `$${list.path}: (\n\t${variables.join(',\n\t')}\n);`;
				
				const banner = [
					`//`,
					`//	Lista ${list.key}`,
					`//	File generato da ${utente}`,
					`//	Data: ${(new Date())}`,
					`//`,
				];
				file_content = banner.join('\n') + '\n' + file_content;
				
				//	Scrivo file e renderizzo
				_crea_file(path.join(list_folder_path, '_variables.scss'), file_content, () => {_render()});

			})

	})
	
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

module.exports = {
	config: _config,
	set: _set,
};
