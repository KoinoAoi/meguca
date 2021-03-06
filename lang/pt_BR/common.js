/*
 * Shared by the server and client
 */

var lang = {
	anon: 'Anônimo',
	search: 'Pesquisa',
	show: 'Exibir',
	hide: 'Esconder',
	report: 'Reportar',
	focus: 'Focar',
	expand: 'Expandir',
	last: 'Últimos',
	see_all: 'Ver todos',
	bottom: 'Rodapé',
	expand_images: 'Expandir Imagens',
	live: 'ao vivo',
	catalog: 'Catálogo',
	return: 'Retornar',
	top: 'Topo',
	reply: 'Postar',
	newThread: 'Novo tópico',
	locked_to_bottom: 'Travado ao rodapé',
	you: '(You)',
	done: 'Feito',
	send: 'Send',

	// Time-related
	week: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
	year: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set',
		'Out', 'Nov', 'Dez'],
	just_now: 'agora mesmo',
	unit_minute: 'minuto',
	unit_hour: 'hora',
	unit_day: 'dia',
	unit_month: 'mês',
	unit_year: 'ano',

	// Moderation language map
	mod: {
		clearSelection: ['Clear', 'Clear selected posts'],
		spoilerImages: ['Spoiler', 'Spoiler selected post images'],
		deleteImages: ['Del Img', 'Delete selected post images'],
		deletePosts: ['Del Post', 'Delete selected posts'],
		lockThread: ['Lock', 'Lock selected threads'],
		toggleMnemonics: ['Mnemonics', 'Toggle mnemonic display'],
		sendNotification: [
			'Notification',
			'Send notifaction message to all clients'
		],
		dispatchFun: ['Fun', 'Execute arbitrary JavaScript on all clients'],
		renderPanel: ['Panel', 'Toggle administrator panel display'],
		modLog: ['Log', 'Show moderation log'],
		placeholders: {
			msg: 'Message'
		},
		
		// Correspond to websocket calls in common/index.js
		7: 'Image spoilered',
		8: 'Image deleted',
		9: 'Post deleted',

		// Formatting function for moderation messages
		formatLog: function (act) {
			return lang.mod[act.kind] + ' by ' + act.ident;
		}
	},

	// Format functions
	pluralize: function(n, noun) {
		// For words ending with 'y' and not a vovel before that
		if (n != 1
			&& noun.slice(-1) == 'y'
			&& ['a', 'e', 'i', 'o', 'u'].indexOf(noun.slice(-2, -1)
				.toLowerCase()) < 0) {
			noun = noun.slice(0, -1) + 'ie';
		}
		return n + ' ' + noun + (n == 1 ? '' : 's');
	},
	capitalize: function(word) {
		return word[0].toUpperCase() + word.slice(1);
	},
	// 56 minutos atrás
	ago: function(time, unit) {
		return lang.pluralize(time, unit) + ' atrás';
	},
	// 47 respostas and 21 images omited
	abbrev_msg:  function(omit, img_omit, url) {
		var html = lang.pluralize(omit, 'postagen');
		if (img_omit)
			html += ' e ' + lang.pluralize(img_omit, 'imagen');
		html += ' omitidas';
		if (url) {
			html += ' <span class="act"><a href="' + url + '" class="history">'
				+ lang.see_all + '</a></span>';
		}
		return html;
	}
};

module.exports = lang;
