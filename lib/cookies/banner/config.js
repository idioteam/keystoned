/**
 * Created by Mat on 11/05/2015.
 *
 *  I marcatori __nome__ vengono modificati lato server
 *  I marcatori _nome_ vengono modificati lato client
 *
 */
var banner = {

	testi:{
		small: 'Questo sito utilizza alcuni cookie che migliorano la tua navigazione.<br/><a href="__path__">Vuoi saperne di pi&ugrave;?</a>',
		full: '<p class="__p-classe__">Questo sito usa cookie tecnici per offrirti un&#39esperienza di navigazione migliore e pi&ugrave; ricca e cookie di profilazione propri e di terze parti per promuovere offerte in linea con i tuoi interessi</p><p class="__p-classe__">Se vuoi saperne di pi&ugrave;, anche al fine di prestare o negare il consenso per i singoli cookie <a href="__path__">clicca qui</a></p><p class="__p-classe__">Chiudendo questo banner, o cliccando fuori da esso, acconsenti all&#39uso dei cookie.</p>'
	},
	testi_en:{
		small: 'This site uses cookies to provide a better experience and service for users.<br/><a href="__path__">Click here form more info</a>',
		full: '<p class="__p-classe__">This site uses Technical cookies per offrirti un&#39esperienza di navigazione migliore e pi&ugrave; ricca e cookie di profilazione propri e di terze parti per promuovere offerte in linea con i tuoi interessi</p><p class="__p-classe__">Se vuoi saperne di pi&ugrave;, anche al fine di prestare o negare il consenso per i singoli cookie <a href="__path__">clicca qui</a></p><p class="__p-classe__">Chiudendo questo banner, o cliccando fuori da esso, acconsenti all&#39uso dei cookie.</p>'
	},
	stile:[
		{//Chiaro
			background:          	'#FFFFFF',
			text_color:           	'#393939',
			button_border_color:	'#FFFFFF',
			link_color:           	'#393939',
			active_color:          	'#34EC53',
			border_radius:        	'10',
			backdrop_color:		 	'#000000',
			backdrop_opacity:	 	'.4',
			consenti_disattivazione:'N',
		},
		{//Scuro
			background:          	'#393939',
			text_color:           	'#FFFFFF',
			button_border_color:   	'#FFFFFF',
			link_color:           	'#FFFFFF',
			active_color:          	'#34EC53',
			border_radius:        	'10',
			backdrop_color:		 	'#000000',
			backdrop_opacity:	 	'.4',
			consenti_disattivazione:'N',
		}
	]
};


module.exports.banner = banner;
