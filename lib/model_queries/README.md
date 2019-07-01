# model_queries
Questo modulo crea una cache all'interno di un modello consentendo di salvare i risultati di query statiche.

## model_queries.init (Modello)
Il metodo ``init`` aggiunge al modello due metodi statici per la gestione della cache delle query
Inoltre aggiunge due hook per invalidare la cache salvata quando vengono modificati i dati della lista (creazione, modifica, eliminazione di un qualsiasi documento della collection)
Questo metodo può essere richiamato dopo che la lista è stata registrata
Esempio:
```
const keystoned = require('keystoned')
const Post = new keystone.List('Post', {....
    ...
});
Post.register();
keystoned.model_queries.init(Post);
```

Successivamente all'esecuzione di ``init`` vengono aggiunti alla lista due metodi statici:
- Lista.schema.statics.query.set
- Lista.schema.statics.query.get

## Lista.schema.statics.query.set (cache_id, query)
Questo metodo crea nella cache della lista un oggetto identificato da cache_id al quale associa la query ed il suo risultatato
Esempio:
```
Post.register();
keystoned.model_queries.init(Post);
Post.schema.statics.query.set('last_post', Post.model.findOne({}).sort('createdAt')); // Memorizza la query per ottenere il post più recente
```
## Lista.schema.statics.query.get (cache_id)
Questo metodo, utilizzabile principalmente nelle routes, consente di richiamare una query salvata.
Alla prima esecuzione verrà eseguita la query ed i risultati saranno salvati nella cache corrispondente, alle esecuzioni successive verrà restituito il valore della cache.
In entrambi i casi il metodo ritorna una promise in modo da poter gestire abbastanza normalmente sia il caso di successo sia il caso di errore.
Esempio
```
...

view.on('init', function (next) {

    Post.schema.statics.query.get('last_post').then(
        (r) => {
            locals.last_post = r;
            next();
        },
        (err) => {
            next(err);
        }
    )

});

...
```

With async/await

```
...

view.on('init', async function (next) {

    try {
        locals.last_post = await Post.schema.statics.query.get('last_post');
        next();
    }
    catch (e) {
        next(e);
    }

});

...
```