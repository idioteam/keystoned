# theme
Questo modulo permette di aggiornare il css del sito utilizzando dati provenienti dai modelli.

## theme.init (conf = {})
Il metodo ``init`` inizializza il componente impostando le opzioni principali.
Le opzioni di default sono le seguenti e possono essere riscritte passandole come proprietà del parametro conf.
```
main_scss_file ('site.scss')        //  il file scss da ricompilare dopo l'aggiornamento
scss_folder_path ('public/styles')  //  la cartella contenente i file scss
output_folder: ('generated')        //  il nome della cartella dentro la quale verranno creati i file coi dati provenienti dai modelli
```
Il metodo crea all'interno della cartella ``scss_folder_path`` la cartella ``output_folder`` (default 'public/styles/generated') contenente i file e le cartelle necessarie al funzionamento del componente:
```
+--public/styles
   +--generated
      +--(nome_modello)
      |  +--_nome_modello.scss
      |  +--_variables.scss
      +--mixins
      |  +--mixins.scss
      +--_generated.scss
```

Il file ``_generated.scss`` viene utilizzato per importare tutti file generati automaticamente in modo da rendere più facile l'importazione nel file generale (da fare manualmente)
Il file ``mixins/mixins.scss`` verrà automaticamente importato all'interno dei file generati.
La cartella (nome_modello) non viene generata, ma rappresenta la struttura che viene creata utilizzando il metodo ``set``.

## theme.set (modello, campi)
Il metodo ``set`` consente di attivare la funzionalità di autogenerazione dei css.
Il parametro *modello* corrisponde ad un modello (keystone.list), mentre il parametro *campi* è un array di oggetti che mappa i campi da gestire durante la generazione del css.
Esempio:
```
ITm.theme.init(Gallery, [{field: 'bg_color', prop: 'background-color'}, {field: 'bg_image', prop: 'background-image'}]);
```
Ciascun elemento di *campi* può essere:
- un oggetto in cui *field* rappresenta il nome del campo del modello e *prop* il nome della proprietà css da associargli. L'esempio precedente mappa il campo 'bg_image' sulla proprietà 'background-image'.
- un array di 2 elementi in cui il primo rappresenta *field* ed il secondo rappresenta *prop*. In questo caso l'esempio precedente sarebbe ['bg_image', 'background_image']
- una stringa se il nome del campo e della proprietà css coincidono. Questo caso non si applica all'esempio precedente, ma potrebbe essere utilizzato per un campo 'color' che rappresenti la proprietà 'color'

Il metodo crea anche una cartella col nome corrispondente al modello all'interno della cartella 'public/styles/generated' e inserisce al suo interno 2 file
1. _variables.scss in questo file verrà creata una mappa dei dati provenienti dal modello che verrà aggiornata ad ogni salvataggio di un documento del modello.
2. _nome_modello.scss: questo file viene preparato per l'utente e al suo interno viene importato il file mixins/mixins.scss ed il file _variables.scss presente nella stessa cartella. Una volta creato il file non viene più cancellato ed è possibile inserire al suo interno tutto il css che si desidera

Infine importa nel file public/styles/generated/_generated.scss il file _nome_modello.scss.

> ### il file 'nome_modello/_variables.scss'
Questo file contiene una mappa che viene ricreata ad ogni salvataggio del modello.
Ipotizzando di avere un modello Gallery, configurato come da esempio precedente, con al suo interno i seguenti documenti:

```
    {
        slug: 'doc1',
        titolo: 'Prova1',
        bg_color: '#FFF',
        bg_image: null
    },{
        slug: 'doc2',
        titolo: 'Prova2',
        bg_color: 'black',
        bg_image: {
            ... oggetto CloudinaryImage
        }
    }
```
> All'interno del file _variables verrà creata la seguente mappa

```
$galleries: (
    doc1: (
        background-color: #FFF,
        background-image: null
    ),
    doc2: (
        background-color: black,
        background-image: url('path_corrispondente_al_secure_url_del_oggetto_CloudinaryImage')
    ),
)
```
> Notare che le mappe di scss sono assolutamente non tipizzate e tendono ad accettare qualsiasi cosa. Questo è comodo (p.es. si posso utilizzare diversi formati per i colori #FFF, white, rgb(255,255,255)), ma anche pericoloso perché è facile incappare in errori in fase di compilazione.

> ### il file 'nome_modello/_nome_modello.scss'
Questo file è quello in cui l'utente può inserire il codice scss nel quale utilizzare la mappa contenuta nel file '_variables.scss'.
Il modello generato alla prima esecuzione è il seguente

```
@import '_variables';
@import '../mixins/mixins';
.galleries {
    @include generate($galleries); // il mixin generate è presente nel file '../mixins/mixins.scss'
}
```
> Il file delle variabili e quello del mixin sono già state importate, inoltre viene già impostata una classe corrispondente al nome del modello e viene richiamato il mixin generate al quale viene passata la mappa contenuta nel file _variables.scss.
Questo produce il seguente risultato

```
.galleries {}
.galleries .doc1 {
    background-color: #FFF;
    //  le proprietà con valore null non vengono generate!
}
.galleries .doc2 {
    background-color: black;
    background-image: url('path_corrispondente_al_secure_url_del_oggetto_CloudinaryImage');
}
```
> Chiaramente se il risultato desiderato è più complesso questo codice può essere eliminato in parte o del tutto. L'unica cosa indispensabile è l'import del file delle variabili.