'use strict';

var Banner = function(){
	
	var body = document.body,
		html = document.documentElement,
		me = this,
		cookie = new Cookies(),
		nomeCookieConsenso = 'ccBannerConfermato';
	
	this.getHeight = function(){
		return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		//return Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
	};
	this.getWidth = function(){
		return Math.max( body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth );
	};
	this.height = me.getHeight();
	this.width = me.getWidth();
	this.resize = true;
	
	var banner = {
		
		backdrop: 'ccoffee-backdrop',
		backdropStyle: {
			position: 'absolute',
			'z-index': 9999,
			width: me.width+'px',
			height: me.height+'px',
			left: 0,
			top:0,
			background: '#000000',
			opacity: 0.7
		},
		
		wrapper: 'ccoffee-wrapper',
		wrapperStyle: {
			position: 'fixed',
			'z-index': 99999,
			width: '500px',
			left: ( me.width - 500 )/2 + 'px',
			//  top: ( me.height  )/2 + 'px', //    dipenderà dalla posizione
			'text-align': 'center',
			'font-family': 'sans-serif',
			'font-size': '16px',
			'font-weight': 'normal',
			'box-shadow': '0px 0px 40px 10px rgba(0,0,0,0.5)'
		},
		wrapperStyleCenter:{
			width: '500px',
			left: ( me.width - 500 )/2 + 'px',
			//  top: ( me.height  )/2 + 'px', //    dipenderà dalla posizione
		},
		wrapperStyleTop:{
			width: '100%',
			left:0,
			top:0,
			'border-radius':0
		},
		wrapperStyleBottom:{
			width: '100%',
			left:0,
			bottom:0,
			'border-radius':0
		},
		
		inner: 'ccoffee-inner',
		innerStyle: {
			'margin-top': '30px',
			'margin-left': '30px',
			'margin-right': '30px',
			'margin-bottom': '30px'
		},
		
		linkStyle: {
			'font-weight': 'bold'
		},
		
		text: '__testo__',
		
		posizione: __posizione__,
		stile: {
			background:           '__background__',
			textColor:            '__textColor__',
			buttonBorderColor:    '__buttonBorderColor__',
			linkColor:            '__linkColor__',
			closeColor:           '__closeColor__',
			borderRadius:         '__borderRadius__'
		}
		
	};
	
	this.stile = function( oggetto ){
		
		var stile = '';
		if( oggetto ) {
			for (var key in oggetto) {
				if (oggetto.hasOwnProperty(key)) {
					stile += key + ':' + oggetto[key] + ';'
				}
			}
		}
		
		return stile;
		
	};
	/*
	 *   Crea markup ed inserisce
	 *
	 * */
	this.inserisciMarkup = function(){
		
		//var backdrop = document.createElement('div');
		//    backdrop.id = banner.backdrop;
		//    backdrop.style = me.stile( banner.backdropStyle );
		
		var wrapper = document.createElement('div');
		wrapper.id = banner.wrapper;
		wrapper.style.cssText = me.stile( banner.wrapperStyle );
		
		var inner = document.createElement('div');
		inner.id = banner.inner;
		inner.style.cssText = me.stile( banner.innerStyle );
		//inner.appendChild(document.createTextNode( banner.text ));
		inner.innerHTML = banner.text.replace(/_margin_/gi, (banner.posizione == 1 ? '16px 0' : '4px 0') );
		
		wrapper.appendChild( inner );
		//wrapper.appendChild( powered );
		
		//body.appendChild(backdrop);
		body.appendChild(wrapper);
	};
	/*
	 *   Computa gli stili dinamici
	 *
	 * */
	this.computaStili = function(){
		
		//  backdrop
		//banner.backdropStyle.style.background  = banner.stile.background;
		
		//  wrapper
		banner.wrapperStyle.background  = banner.stile.background;
		banner.wrapperStyle.color = banner.stile.textColor;
		banner.wrapperStyle['border-radius'] = banner.stile.borderRadius;
		
		if( banner.posizione != 1){
			banner.wrapperStyle[(banner.posizione == 0 ? 'top' : 'bottom')] = 0;
			banner.wrapperStyle['width'] = '100%';
			banner.wrapperStyle['left'] = '0';
			banner.wrapperStyle['border-radius'] = '0';
			
		}
		
		//  inner
		//  inserisco stile nel link
		banner.linkStyle.color = banner.stile.linkColor;
		banner.text = banner.text.replace(/<a/, '<a style="' + me.stile( banner.linkStyle ) + '"');
		
	};
	/*
	 *   Esegue cose dopo l'inserimento del banner nel markup
	 *
	 * */
	this.postInserimento = function() {
		
		var wrapper = document.getElementById(banner.wrapper),
			inner = document.getElementById(banner.inner);
		
		//  Chiude il banner e setta il cookie
		if (document.addEventListener) {
			
			html.addEventListener('click', function () {
				me.chiudiBanner(wrapper, inner);
			});
			
			wrapper.addEventListener('click', function (event) {
				event.stopPropagation();
			});
			
			if (banner.posizione == 1) {
				window.addEventListener('resize', function () {
					if (me.resize) {
						wrapper.style.left = ( me.getWidth() - 500 ) / 2 + 'px';
						wrapper.style.top = ( me.getHeight() - wrapper.offsetHeight ) / 2 + 'px';
					}
				});
			}
			
		} else {
			
			// IE 8< -> attachEvent( event, function )
			
			html.attachEvent('onclick', function () {
				me.chiudiBanner(wrapper, inner);
			});
			
			wrapper.attachEvent('onclick', function (event) {
				event.cancelBubble = true;
			});
			
			if (banner.posizione == 1) {
				window.attachEvent('onresize', function () {
					if (me.resize) {
						wrapper.style.left = ( me.getWidth() - 500 ) / 2 + 'px';
						wrapper.style.top = ( me.getHeight() - wrapper.offsetHeight ) / 2 + 'px';
					}
				});
			}
		}
		
		//  Se posizionato centrale calcolo posizione
		if (banner.posizione == 1) {
			wrapper.style.top = ( me.height - wrapper.offsetHeight ) / 2 + 'px';
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
	this.chiudiBanner = function(wrapper, inner){
		
		wrapper.style.display = 'none';
		inner.style.display = 'none';
		
		me.setCookie();
		
	};
	/*
	 *   Imposta il cookie
	 *
	 * */
	this.setCookie = function(){
		
		var d = new Date();
		d.setYear( d.getFullYear()+1);
		//  toGMTString per compatibilità con Safari
		document.cookie = nomeCookieConsenso + '=true; expires=' + d.toGMTString() + '; path=/';
		
	};
	/*
	 *   Fa tutto
	 *
	 * */
	this.init = function(){
		
		//  Se il cookie esiste non visualizzo il banner
		if( cookie.get(nomeCookieConsenso) ){
			return;
		}
		
		me.computaStili();
		me.inserisciMarkup();
		me.postInserimento();
	};
	
	this.init();
	
};
var Cookies = function(){
	
	var me = this;
	var nome = 'consensoCookies';
	
	this.controlla = function(){
		me.get(nome) ? me.chiudi() : me.mostra();
	};
	
	this.mostra = function(){
		$('#cookies').show();
	};
	
	this.chiudi = function(){
		$('#cookies').hide();
	};
	
	this.set = function(){
		var d = new Date();
		d.setYear( d.getFullYear()+1);
		//document.cookie = nome + '=true; expires=' + d.toString() + '; path=/';
		document.cookie = nome + '=true; expires=' + d.toGMTString() + '; path=/';
		me.chiudi();
	};
	
	this.get = function(name){
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2) return parts.pop().split(";").shift();
	};
	
};
var banner = new Banner();