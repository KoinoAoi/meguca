/*
 * Websocket controller and connection notifier
 */

let main = require('./main'),
	{$, _, common, config, connSM, state, SockJS} = main;

let socket, attempts, attemptTimer;

function send(msg) {
	// need deferral or reporting on these lost messages...
	if (connSM.state != 'synced' && connSM.state != 'syncing')
		return;
	if (socket.readyState != SockJS.OPEN) {
		if (console)
			console.warn("Attempting to send while socket closed");
		return;
	}

	msg = JSON.stringify(msg);
	if (config.DEBUG)
		console.log('<', msg);
	socket.send(msg);
}
main.reply('send', send);

function on_message(e) {
	if (config.DEBUG)
		console.log('>', e.data);
	main.follow(function() {
		let data = JSON.parse(e.data);
		for (let msg of data) {
			const op = msg.shift(),
				type = msg.shift();

			// Some handlers are optional and/or dynamic. Ignore them silently.
			const handler = main.dispatcher[type];
			if (!handler)
				return;
			if (common.is_pubsub(type) && op in state.syncs)
				state.syncs[op]++;
			handler(msg, op);
		}
	});
}

let $sync = $('#sync');
function sync_status(msg) {
	$sync.text(msg);
}

connSM.act('load + start -> conn', function () {
	sync_status('Connecting');
	attempts = 0;
	connect();
});

function connect() {
	if (socket) {
		socket.onclose = null;
		socket.onmessage = null;
	}
	if (window.location.protocol == 'file:') {
		console.log("Page downloaded locally; refusing to sync.");
		return;
	}
	socket = new_socket();
	socket.onopen = connSM.feeder('open');
	socket.onclose = connSM.feeder('close');
	socket.onmessage = on_message;
	if (config.DEBUG)
		window.socket = socket;
}

function new_socket() {
	let transports = [
		'xdr-streaming',
		'xhr-streaming',
		'iframe-eventsource',
		'iframe-htmlfile',
		'xdr-polling',
		'xhr-polling',
		'iframe-xhr-polling',
		'jsonp-polling'
	];
	if (config.USE_WEBSOCKETS)
		transports.unshift('websocket');
	return new SockJS(config.SOCKET_URL || config.SOCKET_PATH, null, {
		transports
	});
}

connSM.act('conn, reconn + open -> syncing', function () {
	sync_status('Syncing');
	const connID = common.random_id();
	var page = state.page;
	page.set('connID', connID);
	send([
		common.SYNCHRONIZE,
		connID,
		page.get('board'),
		state.syncs,
		page.get('live'),
		document.cookie
	]);
});

connSM.act('syncing + sync -> synced', function () {
	sync_status('Synced');
	attemptTimer = setTimeout(function () {
		attemptTimer = 0;
		reset_attempts();
	}, 10000);
});

function reset_attempts() {
	if (attemptTimer) {
		clearTimeout(attemptTimer);
		attemptTimer = 0;
	}
	attempts = 0;
}

connSM.act('* + close -> dropped', function (e) {
	if (socket) {
		socket.onclose = null;
		socket.onmessage = null;
	}
	if (config.DEBUG)
		console.error('E:', e);
	if (attemptTimer) {
		clearTimeout(attemptTimer);
		attemptTimer = 0;
	}
	sync_status('Dropped');
	attempts++;
	var n = Math.min(Math.floor(attempts/2), 12),
		wait = 500 * Math.pow(1.5, n);
	// wait maxes out at ~1min
	setTimeout(connSM.feeder('retry'), wait);
});

connSM.act('dropped + retry -> reconn', function () {
	connect();
	/* Don't show this immediately so we don't thrash on network loss */
	setTimeout(function () {
		if (connSM.state == 'reconn')
			sync_status('Reconnecting');
	}, 100);
});

connSM.act('* + invalid, desynced + close -> desynced', function (msg) {
	msg = (msg && msg[0]) ? 'Out of sync: ' + msg[0] : 'Out of sync';
	sync_status(msg);
	if (attemptTimer) {
		clearTimeout(attemptTimer);
		attemptTimer = 0;
	}
	socket.onclose = null;
	socket.onmessage = null;
	socket.close();
	socket = null;
	if (config.DEBUG)
		window.socket = null;
});

function window_focused() {
	var s = connSM.state;
	if (s == 'desynced')
		return;
	// might have just been suspended;
	// try to get our SM up to date if possible
	if (s == 'synced' || s == 'syncing' || s == 'conn') {
		var rs = socket.readyState;
		if (rs != SockJS.OPEN && rs != SockJS.CONNECTING) {
			connSM.feed('close');
			return;
		}
		else if (navigator.onLine === false) {
			connSM.feed('close');
			return;
		}
	}
	connSM.feed('retry');
}

$(function () {
	_.defer(connSM.feeder('start'));
	// Check for connectivity each time tab visibility changes to visible
	// A bit of an overhead, but should prevent unregistered disconnects,
	// especially on mobile
	document.addEventListener("visibilitychange", function (e) {
		if (e.target.hidden)
			return;
		setTimeout(window_focused, 20);
	});
	window.addEventListener('online', function () {
		reset_attempts();
		connSM.feed('retry');
	});
	window.addEventListener('offline', connSM.feeder('close'));
});
