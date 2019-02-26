const fs = require('fs');
const uglify_js = require('uglify-js');
/**
 * Salva il banner e lo minifica
 * @param banner_content
 * @param destinazione
 */
function to_file (banner_content, destinazione) {


    fs.writeFile(destinazione, banner_content, function(err) {

        if(err) {
            return console.error("Errore salvataggio file: ", err);
        }

        const js_file_min = uglify_js.minify(
            fs.readFileSync(destinazione).toString(),
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
            fs.writeFile(destinazione.replace('.js', '.min.js'), js_file_min.code, function (err) {
                // callback vuota, altrimenti node si lamenta
            } );
        }

    });

}

module.exports = to_file;
