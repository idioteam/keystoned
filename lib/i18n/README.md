# i18n

Questo modulo consente di gestire l'internazionalizzazione.

## i18n.init
una volta richiesto l'oggetto va inizializzato utilizzando la funzioni init che accetta un oggetto di paramentri tra cui:
```
 cookie ('lang')        // definisce il nome del cookie utilizzato per lo store della lingua
 defaultLocale ('it')   // lingua di default
 directory ('locales')  // cartella in cui creare i dizionari statici delle lingue
 extension ('.json')    // estensione dei dizionari
 locales (['it','en'])  // lingue configurate
 objectNotations (true) // definisce se le chiavi dei dizionari possono essere innestate (e quindi utilizzabili con l dot notation)
```

Dopo l'inizializzazione è possibile utilizzare i metodi esposti che sono raggruppati in tre gruppi:
- i18n.middlewares
- i18n.models
- i18n.routes

## i18n.middlewares
Vengono esposti due middleware (browse e redirect che possono essere richiamati prima dei middleware impostati da keystone. Vanno chiamati come metodi e non passati a keystone.pre
```
i18n.middlewares.browse();
keystone.pre('routes', middleware.initLocals);
```
Entrambi i middleware aggiungono alle res.locals:
```
locals.defaultLocale    //  string          lingua di default;
locals.locales          //  string[]        lingue configurate
locals.i18n.__          //  fn(obj, key)    ritorna il valore di obj[key] utilizzando il locale corrente.
                                            key supporta la dot notation ed è una stringa
locals.i18n.__paths     //  string[]        il path corrente nelle altre lingue
locals.i18n.m           //  moment          configura moment applicandogli il locale corrente
locals.path             //  string          path corrente
```

### i18n.middlewares.browse()
Questo middleware consente di navigare un sito per il quale è stata creata una route per ogni lingua gestita (vedi i18n.routes)
Gestisce il locale e lo imposta coerentemente con la route.

### i18n.middleware.redirect()
Questo middleware setta il locale in base ad un cookie senza necessità di specificare diverse route.

## i18n.model
Viene esposto il metodo create_fields che consente di creare una copia dei campi passati per ciascuna lingua gestita

### i18n.model.create_fields(modello, campi, usa_selettore_lingue = false, titolo = '')
Il metodo, da utilizzare nella definizione di un modello, consente di creare una copia dei campi per ciascuna lingua gestita
Parametri:
- modello: il modello a cui applicare i campi
- campi: oggetto contenente i campi da internazionalizzare. Contiene la normale definizione dei campi.
- usa_selettore_lingue (false) se true (attualmente deprecato) inserisce un campo che permette di visualizzare solo i campi della lingua corrispondente. Questa opzione, anche se migliore dal punto di vista della UX funziona male perchè costringe a salvare i dati prima di ogni cambio della lingua
- titolo ('') consente di aggiungere un titolo per gli header delle lingue che di default riportano il nome della lingua.

Esempio
```
i18n.models.create_fields(
	Enquiry,
	{
		h: {heading: 'prova'},
		test_title: { type: String },
		h2: {heading: {it:'heading italiano', en:'english header'}, dependsOn:{ phone: '3'}},
		test_content: {
			brief: { type: Types.Html, wysiwyg: true, height: 150 },
			extended: { type: Types.Html, wysiwyg: true, height: 400 },
		},
	},
	false
);
```

> #### Definizione degli headers
Mentre i campi possono essere definiti "normalmente", per utilizzare gli headers è necessario definirli come oggetti.
Sono possibili 3 configurazioni:
- come stringa ``header: 'testo header'`` in questo caso il testo dell'header è statico e verrà utilizzato per tutte le lingue
- come oggetto ``header: {heading: 'testo header'}`` questo caso è uguale al precedente
- come oggetto localizzato ``header: {heading: {it:'heading italiano', en:'english header'}}`` in questo caso per ciascuna lingua verrà utilizzato l'header corrispondente

> #### Metodi aggiunti alla lista
Per ogni campo tradotto viene creato un metodo col nome corrispondente al campo creato che accetta come unico argomento il locale e che ritorna il valore del campo nella lingua specificato dal locale.
Esempio: dato il documento
```
{
    titolo_i8n_it: 'Titolo italiano',
    titolo_i8n_en: 'Titolo inglese'
}
```
il metodo ``results.titolo(locale)``  ritorna 'Titolo italiano'
**NB** questi metodi non sono accessibili se la query viene eseguita con .lean() o con l'aggregation framework. In questi casi è possibile utilizzare ``locals.i18n.__(obj, key)`` direttamente nella vista

> Inoltre viene aggiunto allo schema un metodo statico **get_name** che accetta il nome di un campo ed il locale che ritorna il nome di un campo internazionalizzato
```
    Modello.schema.statics.get_name('titolo', locale) // ritorna 'titolo_i18n_en' se locale === 'en'
```

## i18n.routes
espone metodi per creare routes col prefisso delle lingue gestite.

### i18n.routes.init (app)
questo metodo accetta come parametro la app alla quale sarà possibile aggiungere le routes. Deve essere richiamato prima del metodo set.

### i18n.routes.set (...args)
Questo metodo consente di specificare una route da internazionalizzare.
Il metodo cerca di ricalcare l'utilizzo di app.get di express per cui ha un numero di argomenti variabili.
La differenza più sensibile è che il metodo (nel senso di verbo HTTP) va specificato sempre come ultimo argomento. L'ultimo argomento viene considerato un metodo quando è stringa, altrimenti è considerato un controller. Quando il metodo non viene specificato viene settato di default a 'get'
Le seguenti configurazioni sono valide:
```
i18n.routes.set(route, controller);                     //  metodo = get
i18n.routes.set(route, controller, metodo);             //  metodo = metodo
i18n.routes.set(route, middleware, controller)          //  metodo = get
i18n.routes.set(route, middleware, controller, metodo)  //  metodo = metodo
```
La route può essere definita in tutti i pattern permessi da Express e può essere una stringa o un'array di stringhe se si vuole assegnare a più route lo stesso middleware/controller/metodo
Esempio
```
i18n.routes.set(['test', 'prova'], middleware.xyz, controller.qwe, 'post');
```
equivale a
```
app.post('/it/test', middleware.xyz, controller.qwe);
app.post('/en/test', middleware.xyz, controller.qwe);
app.post('/it/prova', middleware.xyz, controller.qwe);
app.post('/en/prova', middleware.xyz, controller.qwe);
```
Per ciascuna route passata (nell'esempio test e prova) viene anche creata una route che redirige sulla lingua di default ('/it/test' e '/it/prova').