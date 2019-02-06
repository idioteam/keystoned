# seo
Questo modulo si occupa di gestione aspetti legati alla seo.
Contiente metodi che possono essere applicati
- ai modelli
- alle routes
- ai templates (mixins)

##  configurazione
quando il modulo viene incluso accetta un oggetto di configurazione con le seguenti opzioni:
- ***query_page*** (String) nome del parametro che rappresenta la pagina nella query string. *default: 'p'*
- ***params_page*** (String) nome del paramentro che rappresenta la pagina nei params della route *default: 'p'*
- ***twitter_cards*** (Boolean) se attivare o meno le twitter card. *default: true*
- ***open_graph*** (Boolean) se attivare o meno le open graph. *default: true*

## seo.add (oggetto)
Metodo che consente di aggiungere ad un modello i campi della seo.
Attraverso questo metodo vengono aggiunti 3 campi
- seo_page_title -> consente di inserire il titolo della pagina
- seo_meta_description -> consente di inserire meta description
- seo_page_thumbnail -> consente di specificare una thumbnail da utilizzare per microformat, opengraph, twitter card ed altri compinenti simili

Il metodo accetta un oggetto come argomento che può essere direttamente la lista (modello) alla quale aggiungere i campi oppure un oggetto contenente un elenco di campi. Questa seconda opzione consente di utilizzare questo modulo congiuntamente al modulo i18n.
Esempio con lista:
```
const Lista = new keystone.List('Lista');
Lista.add(...);
seo.add(Lista);
```
Esempio con multilingua
```
constLista = new keystone.List('Lista');
//  campi da internazionalizzare
const campi = {
    titolo: {type: String},
    descrizione:{type: String}
}
//  Aggiungo i campi seo ai campi da internazionalizzare
seo.add(campi);
//  Passo la lista dei campi al metodo di internazionalizzazione
i18n.models.create_fields(Lista, campi);
```

## seo.complete(configurazione)
Questo metodo deve essere invocato nei controller delle routes per inviare informazioni aggiuntive al template che verranno incluse attraverso i mixins.
Il metodo accetta un oggetto di configurazione che consente di specificare quali informazioni stampare.
Lista delle chiavi:
- ***data*** (Object): accetta il documento completo o un suo frammento (sotto forma di oggetto). Estrae dall'oggetto passato il valore dei campi seo_ page_title, seo_meta_description, seo_page_thumbnail tenendo conto della lingua
- ***title*** (String): consente di forzare il titolo della pagina in quanto ha precedenza su quello eventualmente estratto da data
- ***description*** (String): consente di forzare la meta description della pagina in quanto ha precedenza su quella eventualmente estratto da data
- ***thumb*** (String): consente di forzare il thumb della pagina in quanto ha precedenza su quella eventualmente estratto da  data
- ***canonical*** (String): un url relativo che rappresenta l'url canonical della pagina corrente
- ***schema_org*** (Boolean): inserisce o meno il codice ld+json che include lo schema Website e Organization. In futuro si potrà passare una stringa corrispondente ad uno schema preciso da stampare
- ***total_pages*** (Integer): consente di specificare, in una lista paginata, il numero totale delle pagine in modo da inserire i link next e prev
- ***pagination*** (Object): consente di specificare la configurazione della paginazione per le routes che hanno i parametri di paginazione impliciti (p.es. quando la route base è la prima pagina). Deve contenere le seguenti proprietà
```
pagination: {
    name: 'page',           //      nome del parametro
    value: 1,               //      numero della pagina
    type: 'query || params' //  parametro nella query string o nei params
}
```

## mixin seo()
Inserisce i dati configurati dal plugin nella pagina. Attualmente può inserire i seguenti dati se esistono:
- meta description
- hreflang (se pagina multilingua)
- next e prev (se esiste paginazione)
- canonical url
- open graph
- twitter card
- schema.org
Il page title viene assegnato alla variabile title già presente nel layout di default
Per utilizzare il mixin includere il file `/mixins/it-seo/seo`
Richiamare il mixin nel blocco `head`
