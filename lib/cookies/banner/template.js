'use strict';
var Banner = function (silent) {

	var body = document.body;
	var html = document.documentElement;
	var me = this;
	var nomeCookieConsenso = 'consenso-cookies';

	this.getHeight = function () {
		return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	};
	this.getWidth = function () {
		return Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
	};
	this.height = me.getHeight();
	this.width = me.getWidth();
	this.resize = true;
	var prefix = 'cookie-banner-';
	var banner = {

		backdrop: prefix + 'backdrop',
		backdrop_visible: __backdrop__,

		wrapper: prefix + 'wrapper',
		wrapperStyle: {
			width: '500px',
			left: (me.width - 500) / 2 + 'px',
		},
		wrapperStyleCenter: {
			width: '500px',
			left: (me.width - 500) / 2 + 'px',
		},
		wrapperStyleTop: {
			'width': '100%',
			'left': 0,
			'top': 0,
			'border-radius': 0,
		},
		wrapperStyleBottom: {
			'width': '100%',
			'left': 0,
			'bottom': 0,
			'border-radius': 0,
		},

		inner: prefix + 'inner',

		text: '__testo__',

		posizione: __posizione_banner__,
		stile: {
			linkColor:            '__link_color__',
			borderRadius:         '__border_radius__'
		},
		consenti_disattivazione: '__consenti_disattivazione__',
		analitici: __analitici__,
		profilazione: __profilazione__,
		update: __update__

	};

	this.stile = function (oggetto) {

		var stile = '';
		if (oggetto) {
			for (var key in oggetto) {
				if (oggetto.hasOwnProperty(key)) {
					stile += key + ':' + oggetto[key] + ';';
				}
			}
		}

		return stile;

	};
	/*
	 *   Crea markup ed inserisce
	 *
	 * */
	this.inserisciMarkup = function () {

		var wrapper = document.createElement('div');
		wrapper.id = banner.wrapper;
		wrapper.style.cssText = me.stile(banner.wrapperStyle);

		var inner = document.createElement('div');
		inner.id = banner.inner;
		inner.innerHTML = banner.text.replace(/__p-classe__/gi, (banner.posizione === 1 ? 'centered' : ''));
		if (banner.consenti_disattivazione === 'S') {
			inner.append(me.check('analitici', banner.analitici));
			inner.append(me.check('profilazione', banner.profilazione));
		}

		wrapper.appendChild(inner);

		var style = document.createElement('style');
		style.innerText = '__stile__';
		body.appendChild(style);
		body.appendChild(wrapper);

		if (banner.backdrop_visible) {
			var backdrop = document.createElement('div');
			backdrop.id = banner.backdrop;
			body.appendChild(backdrop);
		}

	};
	this.check = function (label, status) {

		if (status) {
			var w = document.createElement('div');
			var l = document.createElement('label');
			l.innerText = 'Voglio disabilitare i cookie ' + (label === 'analitici' ? '' : 'di ') + label;
			l.htmlFor = 'cookie_' + label;
			var sw = document.createElement('span');
			sw.className = 'opt-switch';
			var c = document.createElement('input');
			c.id = 'cookie_' + label;
			c.type = 'checkbox';
			var s = document.createElement('span');
			s.className = 'opt-slider round';
			sw.append(c);
			sw.append(s);
			l.append(sw);
			w.append(l);
			return w;
		} else {
			return '';
		}
	};
	/*
	 *   Computa gli stili dinamici
	 *
	 * */
	this.computaStili = function () {


		//  wrapper
		banner.wrapperStyle['border-radius'] = banner.stile.borderRadius;

		if (banner.posizione !== 1) {
			banner.wrapperStyle[(banner.posizione === 0 ? 'top' : 'bottom')] = 0;
			banner.wrapperStyle.width = '100%';
			banner.wrapperStyle.left = '0';
			banner.wrapperStyle['border-radius'] = '0';
		}

	};
	/*
	 *   Esegue cose dopo l'inserimento del banner nel markup
	 *
	 * */
	this.postInserimento = function () {

		var wrapper = document.getElementById(banner.wrapper);
		var backdrop = document.getElementById(banner.backdrop);
		var inner = document.getElementById(banner.inner);
		var addEvent = document.addEventListener ? 'addEventListener' : 'attachEvent';

		html[addEvent]('click', function () {
			me.chiudiBanner(wrapper, inner, backdrop);
		});

		wrapper[addEvent]('click', function (event) {
			event.stopPropagation();
		});

		if (banner.posizione === 1) {
			window[addEvent]('resize', function () {
				if (me.resize) {
					wrapper.style.left = (me.getWidth() - 500) / 2 + 'px';
					wrapper.style.top = (me.getHeight() - wrapper.offsetHeight) / 2 + 'px';
				}
			});
		}

		//  Se posizionato centrale calcolo posizione
		if (banner.posizione === 1) {
			wrapper.style.top = (me.height - wrapper.offsetHeight) / 2 + 'px';
		}

		//  Se viewport > dimensione banner
		if (me.getWidth() < wrapper.clientWidth) {

			me.resize = false;
			wrapper.style.width = '80%';
			wrapper.style.left = '10%';
			wrapper.style.top = '10%';
			wrapper.style.fontSize = '10px';
			if (me.getHeight() < wrapper.clientHeight) {
				wrapper.style.position = 'absolute';
			}
		}

	};
	/*
	 *   Chiusura
	 *
	 * */
	this.chiudiBanner = function (wrapper, inner, backdrop) {

		wrapper.style.display = 'none';
		inner.style.display = 'none';

		if (backdrop) {
			backdrop.style.display = 'none';
		}

		if (document.location.pathname !== '__path__') {
			me.setCookie();
		}

	};
	/*
	 *   Imposta il cookie
	 *
	 * */
	this.setCookie = function () {

		var d = new Date();
		d.setYear(d.getFullYear() + 1);
		var check_an = document.getElementById('cookie_analitici');
		var check_pr = document.getElementById('cookie_profilazione');
		var cookie_val = {
			cd: new Date().getTime(), //	confirmation date
			an: 'A',
			pr: 'A',
		};
		if ((banner.analitici || banner.profilazione) && banner.consenti_disattivazione === 'S' && (check_an || check_pr)) {
			if (check_an) {
				cookie_val.an = (banner.analitici ? check_an.checked : true) ? 'D' : 'A';
			}
			if (check_pr) {
				cookie_val.pr = (banner.profilazione ? check_pr.checked : true) ? 'D' : 'A';
			}
		}
		document.cookie = nomeCookieConsenso + '=' + JSON.stringify(cookie_val) + '; expires=' + d.toGMTString() + '; path=/';
		if (cookie_val.an === 'A' || cookie_val.pr === 'A') {
			location = location;
		}
	};
	/*
	 *   Fa tutto
	 *
	 * */
	this.init = function () {

		//  Non visualizzo il banner se
		//	il cookie esiste e
		//	è un oggetto con un campo cd contenente una data
		//	e non esiste la data di aggiornamento del banner
		//	oppure la data di aggiornamento del banner è più remota della data di aggiornamento del co
		var c = me.get(nomeCookieConsenso);
		if (c) {
			try {
				c = JSON.parse(c);
				if (c.cd && (!banner.update || banner.update < c.cd)) {
					return;
				}

			} catch (e) { }
		}

		me.computaStili();
		me.inserisciMarkup();
		me.postInserimento();
	};

	this.get = function (name) {
		var value = '; ' + document.cookie;
		var parts = value.split('; ' + name + '=');
		if (parts.length === 2) return parts.pop().split(';').shift();
	};

	if (!silent) {
		this.init();
	}

};
//	Non visualizzo il banner nella pagina della cookie policy
if (document.location.pathname !== '__path__') {
	new Banner();
}

