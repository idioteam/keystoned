const keystone = require('keystone');
const Types = keystone.Field.Types;
const url = require('url');
const FIELDS_NAME = {
    title: 'seo_page_title',
    meta_description: 'seo_meta_description',
    page_thumb: 'seo_page_thumbnail'
};
let options = {
    params_page: 'page',
    query_page: 'page',
    twitter_cards: true,
    open_graph: true,
};
const base_prefetch = ['https://res.cloudinary.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
let i18n;
let i18n_options;
try {
    i18n = require('../i18n');
    i18n_options = i18n.get_conf();
} catch (e) {
    console.log(`e`,  e);
}

function _complete (locals, configuration) {

    const IT_Globals = keystone.get('Impostazioni');

    if (configuration.total_pages) {

        //	verifico
        if (configuration.pagination) {
            this.stato.pagination = true;
            this.pagination.parameter = {
                name: configuration.pagination.name,
                value: configuration.pagination.value,
                type: configuration.pagination.type
            };

            this.pagination.implicit = configuration.pagination.implict !== undefined ? configuration.pagination.implicit : true;

        }

        _set_pagination.call(this, configuration.total_pages);
    }

    if (configuration.data) {

        if (typeof configuration.data[FIELDS_NAME.title] === 'function') {

            this.meta.title = configuration.data[FIELDS_NAME.title](locals.locale);
            this.meta.description = configuration.data[FIELDS_NAME.meta_description](locals.locale);

            if (configuration.data[FIELDS_NAME.page_thumb]) {
                let thumb = configuration.data[FIELDS_NAME.page_thumb](locals.locale);
                if (thumb && thumb.secure_url) {
                    this.meta.thumb = thumb.secure_url;
                }
            }

        } else {

            //	 no multilingua
            if (configuration.data[FIELDS_NAME.title]) {
                this.meta.title = configuration.data[FIELDS_NAME.title]
            }

            if (configuration.data[FIELDS_NAME.meta_description]) {
                this.meta.description = configuration.data[FIELDS_NAME.meta_description]
            }

            if (configuration.data[FIELDS_NAME.page_thumb] && configuration.data[FIELDS_NAME.page_thumb].secure_url) {
                this.meta.thumb = configuration.data[FIELDS_NAME.page_thumb].secure_url
            }

        }

    }

    //	Se settati direttamente sovrascrivono i dati
    if (configuration.description) {
        this.meta.description = configuration.description;
    }
    if (configuration.title) {
        this.meta.title = configuration.title;
    }

    if (configuration.thumb) {
        this.meta.thumb = configuration.thumb;
    }

    //	Fallback title
    if (!this.meta.title && IT_Globals && IT_Globals.seo.title) {
        this.meta.title = IT_Globals.seo.title
    }
    //	Fallback description
    if (!this.meta.description && IT_Globals && IT_Globals.seo.description) {
        this.meta.description = IT_Globals.seo.description
    }
    // Fallback thumb
    if (!this.meta.thumb && IT_Globals && IT_Globals.logo.social) {
        this.meta.thumb = IT_Globals.logo.social
    }

    locals.title = this.meta.title;

    if (options.twitter_cards) {
        this.twitter_card = {
            card: 'summary',
            description: this.meta.description,
            title: this.meta.title,
            image: this.meta.thumb
        }
    }

    if (options.open_graph) {
        this.open_graph = {
            url: this.full_url,
            description: this.meta.description,
            title: this.meta.title,
            image: this.meta.thumb,
            type: 'article',
            site_name: this.main_url
        }
    }

    if (configuration.schema_org) {
        this.schema = {};

        if (IT_Globals) {

            this.schema.website = {
                '@context': 'http://schema.org',
                '@type': 'WebSite',
                'name': IT_Globals.sito.nome,
                'url': this.main_url
            };

            this.schema.organization = {
                '@context': 'http://schema.org',
                '@type': 'Organization',
                'name': IT_Globals.azienda.nome,
                'url': this.main_url,
                'email': IT_Globals.contatti.email,
                'telephone': IT_Globals.contatti.telefono,
                'faxNumber': IT_Globals.contatti.fax,
                'address': {
                    '@context': 'http://schema.org',
                    '@type': 'PostalAddress',
                    'addressLocality': IT_Globals.indirizzo.comune, //
                    'addressCountry': IT_Globals.indirizzo.stato, //
                    'postalCode': IT_Globals.indirizzo.cap, //
                    'streetAddress': IT_Globals.indirizzo.via //
                }
            };
            //	Logo
            if (IT_Globals.logo.social) {
                this.schema.organization.logo = {
                    '@type': 'ImageObject',
                    'url': IT_Globals.logo.social,
                    'width': '200',
                    'height': '200'
                }
            }
            //	sameAs
            let sameAs = Object.keys(IT_Globals.social).map(s => IT_Globals.social[s]).filter(s => s.length);
            if (sameAs.length) {
                this.schema.organization.sameAs = sameAs
            }
        }
    }

    if (configuration.canonical) {
        this.canonical = `${this.main_url}${configuration.canonical}`;
    }
}

function _set_pagination (total_pages) {

    if (!this.pagination.parameter) return;

    let base_url;

    if (this.pagination.parameter.type) {

        base_url = this.full_url.split('?');
        base_url[0] = base_url[0].split('/').map(f => f === this.pagination.parameter.value.toString() ? `[${this.pagination.parameter.name}]` : f).join('/');

        if (base_url.length === 2) {
            base_url = base_url.join('?');
        } else {
            base_url = base_url[0];
            if (this.pagination.implicit) {
                base_url += `?${this.pagination.parameter.name}=1`;
            }
        }
    }

    //	se parametro implicito e valore = 1
    //	imposto canonical
    if (this.pagination.implicit && this.pagination.parameter.value === 1) {
        this.canonical = base_url.split('?')[0];
    }

    if (this.pagination.parameter.value <= total_pages && this.pagination.parameter.value > 0)
    {

        if (this.pagination.parameter.value < total_pages) {
            // this.pagination.next = base_url;
            this.pagination.next = base_url
                .replace(`${this.pagination.parameter.name}=${this.pagination.parameter.value}`, `${this.pagination.parameter.name}=${this.pagination.parameter.value +1}`)
                .replace(`[${this.pagination.parameter.name}]`, this.pagination.parameter.value +1)
        }
        if (this.pagination.parameter.value > 1 ) {
            // this.pagination.prev = base_url;
            this.pagination.prev = base_url
                .replace(`${this.pagination.parameter.name}=${this.pagination.parameter.value}`, `${this.pagination.parameter.name}=${this.pagination.parameter.value -1}`)
                .replace(`[${this.pagination.parameter.name}]`, this.pagination.parameter.value -1)
        }
    }
}

function _hreflang_set (req, seo) {

    let path_current = req.path + (seo.query_string ? '?' + seo.query_string : '');

    if(path_current.charAt(path_current.length - 1) === '/') {
        path_current = path_current.substring(0, path_current.length - 1)
    }

    path_current = path_current.replace(/^\//, '').split('/');

    const path = {
        lang: '',
        path: '',
        rest: '',
        pars: ''
    };

    if(path_current[0].length === 2) {
        path.lang = '/' + path_current[0];
        path.path = path_current[1] ? '/' + path_current[1] : '';
        path_current.splice(0,2);
    } else {
        path.path = path_current[0] ? '/' + path_current[0] : '';
        path_current.splice(0,1);
    }

    path.rest = '/' + path_current.map(p => 'par').join('/');
    path.pars = ('/' + path_current.join('/')).replace(/\/$/, '');
    const current_path = req.route.path.replace(/\/$/, '');
    const crea_hreflang = i18n_options.routes_map.some(r => r === current_path);

    if (crea_hreflang) {
        seo.stato.locale = true;
        seo.hreflang = i18n_options.locales.map(l => ({
            href:`${seo.main_url}${((l === i18n_options.defaultLocale && i18n_options.nascondi_default_locale) ? '' : '/' + l)}${path.path + path.pars}`,
            locale: l
        }));
        //	x-default
        seo.hreflang.push({
            href: `${seo.main_url}${(i18n_options.nascondi_default_locale ? '' : '/' + i18n_options.defaultLocale)}${path.path + path.pars}`,
            locale: 'x-default'
        })
    }

}

function _add (lista) {

    const heading = 'SEO';
    const title = {};
    const description = {};
    const thumb = {};

    title[FIELDS_NAME.title] = {type: String, label: 'Page title', note: '50/60 caratteri max'};
    description[FIELDS_NAME.meta_description] = {type: Types.Textarea, label: 'Meta description', note: '50/300 caratteri'};
    thumb[FIELDS_NAME.page_thumb] = {type: Types.CloudinaryImage, label: 'Page thumb', note: 'Utilizzata per social link'};

    if (lista.constructor.name === 'List') {
        lista.add(
            heading,
            title,
            description,
            thumb
        )
    } else {
        Object.assign(lista, {seoheading: heading}, title, description, thumb);
    }
}

function _config (opzioni) {
    options = Object.assign(options, opzioni);
    if (options.prefetch) {
        if (!Array.isArray(options.prefetch)) {
            options.prefetch = [options.prefetch]
        }
    } else {
        options.prefetch = []
    }
    options.prefetch.push(...base_prefetch);
}


function _seo_middleware (req, res, next) {

    const query_keys = Object.keys(req.query);

    let seo = {
        main_url: url.format({
            protocol: req.protocol,
            host: keystone.get("env") !== 'production' ? req.headers.host : req.hostname,
        }),
        full_url: url.format({
            protocol: req.protocol,
            host: keystone.get("env") !== 'production' ? req.headers.host : req.hostname,
            //pathname: req.originalUrl
            pathname: req.path,
            search: req.originalUrl.replace(req.path, '')
        }),
        query_string: query_keys.length ? query_keys.map(k => `${k}=${req.query[k]}`).join('&') : null,
        meta: {
            description: null,
            title: null,
            thumb: null
        },
        stato: {
            locale: false,
            pagination: false,
            query: false,
        },
        options: options,
        pagination: {},
        canonical: null,
        prefetch: options.prefetch

    };

    seo.complete = _complete.bind(seo, res.locals);

    //	has locale
    if (i18n && i18n_options) {

        _hreflang_set(req, seo);

    }

    // has query
    if (query_keys.length !== 0) {

        const contains_navigation = query_keys.filter(k => k === options.query_page);

        if (contains_navigation.length !== query_keys.length ) {
            seo.stato.query = true;
        }

    }
    // has pagination
    if (req.query[options.query_page] || req.params[options.params_page]) {

        pagination_set.call(seo, req, res)

    }

    res.locals.seo = seo;
    next();
}

function pagination_set (req, res) {

    this.stato.pagination = true;
    this.pagination.implicit = true;
    this.pagination.parameter = {
        name: req.query[options.query_page] ? options.query_page : options.params_page,
        value: (req.query[options.query_page] || req.params[options.params_page]) * 1,
        type: req.query[options.query_page] ? 'query' : 'params'
    }

}

function _middleware (req, res, next) {
    _seo_middleware(req, res, next);
}

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

module.exports = {
    add: _add,
    config: _config,
    middleware: _middleware
};
