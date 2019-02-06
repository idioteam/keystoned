# sitemap
modulo dedicato alla creazione del file sitemap.xml
Esempio:
```
//  Sitemap
app.get('/sitemap.xml', function (req, res) {
    idioTools.sitemap.create(keystone, req, res, {
        filters: {
            Post: { stato: 1 },
            blogCategorie__padre: { padre: null }
        },
        ignore: idioTools.i18n.get_conf().redirections
    });
});
```
Accetta un oggetto di configurazione che accetta le seguenti chiavi:
- ***ignore*** (String[]) Un'array di stringhe (o espressioni regolari) che definiscono le route da escludere dalla sitemap. Di default sono escluse tutte le routes di keystone, quelle che cominciano con api/
- ***filters*** (Object) Consente di specificare filtri per escludere documenti. Per esempio in un blog si potrebbero filtrare i post in bozza. Il formato di ciascuna proprietà è `nome_lista: {nome_campo: valore_campo_da_escludere}`. Per esempio `{Post: {stato: 1}` filtra tutti i post il cui stato è uguale ad 1

**Nota bene**
Per fare in modo che la sitemap generi correttamente le routes è necessario che il nome di parametri corrispondano ai nomi delle liste a cui afferiscono
Esempio
```
app.get('/post/:slug', routes.views.post) // Non genera nessun url perchè non sappiamo a quale lista appartiene slug
app.get('/post/:post', routes.views.post) // Riesce a generare gli url perchè prende il campo definito come autokey nella lista Post
```
