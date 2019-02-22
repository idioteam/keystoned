'use strict';
var Banner = function () {

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
		consenti_disattivazione: __consenti_disattivazione__,
		analitici: __analitici__,
		profilazione: __profilazione__

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
		if (banner.consenti_disattivazione) {
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

		me.setCookie();

	};
	/*
	 *   Imposta il cookie
	 *
	 * */
	this.setCookie = function () {

		var d = new Date();
		d.setYear(d.getFullYear() + 1);
		document.cookie = nomeCookieConsenso + '=confirmation date ' + (new Date()).toGMTString() + '; expires=' + d.toGMTString() + '; path=/';
		if (banner.analitici || banner.profilazione) {
			var an = (banner.analitici ? document.getElementById('cookie_analitici').checked : true) ? 'D' : 'A';
			var pr = (banner.profilazione ? document.getElementById('cookie_profilazione').checked : true) ? 'D' : 'A';
			document.cookie = 'preferenze-cookies=AN' + an + 'PR' + pr + '; expires=' + d.toGMTString() + '; path=/';
			if (an === 'A' || pr === 'A') {
				location = location;
			}
		}
	};
	/*
	 *   Fa tutto
	 *
	 * */
	this.init = function () {

		//  Se il cookie esiste non visualizzo il banner
		if (me.get(nomeCookieConsenso)) {
			return;
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

	this.init();

};
new Banner();
