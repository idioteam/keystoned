const UglifyJS = require('uglify-js');
const fs = require('fs');
const path = require('path');
const re = {
    blocco: '\/\/[\t -]*?idiojs:dev(.|[\r\n])*?\/\/[\t -]*?idiojs:end',
    script: /[^//|//-]script\((.*)?src=(?:'|")(.*?)(\?.*?)?(?:'|")(?:.*?)\)/gi
    // script: /[^//|//-]script\((.*)?src=(?:'|")(.*?)(\?.*?)?(?:'|")\)/gi
    // script: /[^//|//-]script\((.*)?src=(?:'|")(.*)(?:'|")\)/gi
};
let default_options = {
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: false
};
let ext = '.pug';
/**
 * Registro per la raccolta dei file da minificare
 * @constructor
 */
const Registro = function () {

    const reg = [];
    const me = this;

    //	Cerca un elemento del registro in base al nome del file
    //	Ritorna l'elemento oppure null se l'elemento non esiste
    this.trova = function(nomeFile){

        let e = null;

        reg.some( elemento => {

            if( elemento.nomeFile === nomeFile ){
                e = elemento;
                return true;
            }

        });

        return e;
    };

    //	Elimina gli elementi duplicati da un array
    this.filtra = function( arr ){
        return arr.filter((elem, pos) => {
            return arr.indexOf(elem) === pos;
        })
    };

    //	Aggiunge dati al registro
    this.add = function(nomeFile, listaFiles){

        let elemento = me.trova(nomeFile);

        if( elemento ){
            elemento.listaFiles = me.filtra( elemento.listaFiles.concat( listaFiles ) );
        }else{
            reg.push({
                nomeFile: nomeFile,
                listaFiles: listaFiles
            })
        }

    };

    this.creaFiles = function(){

        if(reg.length === 0){
            console.log('Non ho trovato nessun file da minificare!');
            console.log('Hai inserito i marcatori "//-idiojs:dev" e "//-idiojs:prod" nel template?');
            return;
        }

        reg.forEach( function(elemento){
            minificaJs(elemento.listaFiles, elemento.nomeFile);
        });

    };

    this.get = function(){
        return reg;
    }
};
/*
 * 	Ottiene la lista dei file in una cartella
 * 	Funziona ricorsivamente su tutte le sottocartelle
 * 	=================================================
 * 	@param {string} folder - cartella da leggere
 * 	@param {string} [ext] - estensione dei file da recuperare, opzionale
 *
 * */
function getFileList (folder, ext) {

    let archivio = [];

    const leggiCartella = function(folder, ext){

        let f = fs.readdirSync(folder);
        let fld = [];
        let s = [];

        //	Cartelle
        fld = f.filter(file => path.extname(file) === '');

        if( ext ){

            if( ext.indexOf('.') === -1 ){
                ext = '.' + ext;
            }

            //	File con estensione ext
            f = f.filter( file => path.extname( file ) === ext);

            //	Aggiungo percorso
            f = f.map(file => path.join(folder, file));

        }

        if(fld.length > 0){

            fld.forEach(function(fl){
                leggiCartella( path.join(folder,fl), ext )
            })
        }

        archivio = archivio.concat(f);
        return archivio

    };

    return leggiCartella(folder, ext);
}
/*
 * 	Verifica se esiste una cartella
 *   ===============================
 *   @param {string} fldrPath - path cartella da verificare
 *   @param {boolean} creaCartella - se true crea la cartella
 *
 * */
function folderExists( fldrPath, creaCartella ){

    try {
        fs.statSync( fldrPath );
        return true;
    }catch(er){
        if( creaCartella ){
            createFolder( fldrPath );
        }
        return creaCartella;
    }

}
/*
 * 	Crea una cartella
 * 	=================
 * 	@param {string} percorso - path della cartella da creare
 *
 * */
function createFolder( percorso ){

    let cartella = '';
    percorso = percorso.split( '/' );
    percorso.forEach(p => {
        cartella += ( cartella.length === 0 ? '' : '/' ) + p;
        try{
            fs.mkdirSync( cartella );
        }catch(er){

        }
    })

}
/*
 * 	Estrae i file javascript referenziati all'interno del blocco js:dev
 * 	===================================================================
 * 	@param {string} file - testo in cui cercare
 *
 * */
function getFileListFromTemplate(file){

    let files = [];
    const blocco = new RegExp(re.blocco, 'g');
    const src = new RegExp(re.script);
    let match = blocco.exec(file);
    let m = null;


    //	Questo è necessario perchè la regexp è globale ed alla seconda iterazione rimane settato il lastindex precedente. Vengono quindi persi dei risultati
    //	L'alternativa è localizzare la regexp: src = new RegExp(re.script). In questo caso, siccome costruisco una regexp da un'altra regexp non devo specificare i flag perchè eredita quelli della regexp originale
    src.lastIndex = 0;

    while (( m = src.exec(match[0])) !== null) {

        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }

        files.push( path.join('public', m[2].split('?')[0]));
    }

    return files;

}
/*
 * 	Estrae il file referenziato all'interno del blocco js:prod
 * 	==========================================================
 * 	@param {string} file - testo in cui cercare
 *
 * */
function getProductionFileName( file ){

    let nome = '';
    const blocco = new RegExp(re.blocco.replace(':dev', ':prod'), 'g');
    let src = re.script;
    let match = blocco.exec(file);
    let scripts = match ? src.exec(match[0]) : null;

    src.lastIndex = 0;

    if( scripts ){
        return path.join('public', scripts[2]);
    }else{
        return 'public/js/scripting.min.js'
    }

}
/*
 * 	Utilità per il log
 * 	==================
 * 	@param {string} msg - testo del log
 * 	@errore {boolean} errore - se true stampa errore altrimenti info
 * */
function logga(msg, errore){
    msg = new Array( msg.length +1).join('-') + '\n' + msg + '\n' + new Array( msg.length +1).join('-') + '\n';
    errore ? console.error( msg ) : console.log( msg )
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

/*
 * 	Minifica i file javascript
 * 	==========================
 * 	@param {Array} listaFiles - lista dei file javascript da minificare
 * 	@param {string} [output='public/js/scripts.min.js'] - percorso del file di output
 *
 * */
function minificaJs( listaFiles, output ){

    if( !output ){
        output = 'public/js/scripts.min.js';
    }

    const js_files = listaFiles.map(l => fs.readFileSync(l).toString());

    const result = UglifyJS.minify(js_files, {
        mangle: true,
        output: {
            preamble: '// (c) Idioteam\n// ' + new Date()
        },
        compress: default_options
    });

    //	Verifico che esista la cartella di output e scrivo il file
    try{
        folderExists(path.dirname(output), true);
        fs.writeFileSync(output, result.code);

        logga( 'File "' + output + '" creato correttamente' )

    }catch(er){

        logga( er, true )

    }

}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

function _config (opzioni = {}) {

    if (opzioni && opzioni.ext) {
        ext = ('.' + opzioni.ext).replace('..', '.');
        delete opzioni.ext;
    }

    default_options = Object.assign(default_options, opzioni)

}

function _minify_folder (folder, output) {

    let files = getFileList( folder, '.js' );

    if( files && files.length ){

        //	Aggiungo il folder all'elenco dei file
        let ff = files.map( function (file) {
            return folder + '/' + file;
        });

        minificaJs( ff, output );

    }else{

        logga( 'Nessun file javascript nella cartella "' + folder + '"\no cartella non esistente', true )

    }
}

function _minify () {

    let files = [];
    let layouts = getFileList('templates/layouts', '.pug', 'layouts')
        .concat(getFileList('templates/views', '.pug'));

    const registro = new Registro();

    layouts.forEach(layout => {

        let file = fs.readFileSync(layout).toString();
        if(new RegExp(re.blocco,'g').exec(file)) {
            files = getFileListFromTemplate(file, 'dev');

            if (files && files.length) {
                registro.add(getProductionFileName(file), files)
            }
        }

    });

    registro.creaFiles();
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

module.exports = {
    config: _config,
    minify: _minify,
    minify_folder: _minify_folder
};
