var io = require('socket.io-client');
var template = require('./template');
var utils = require('./utils');

document.addEventListener('DOMContentLoaded', function() {
	var TOPIC = document.URL.split('/')[3];
	var ID = document.URL.split('/')[4];
	if (!ID) ID = utils.getCookie('id');
	if (!ID) ID = utils.randomString();
	utils.setCookie('id', ID, 100);

	var socket = io.connect('/');
	window.socket = socket;  // make available for tests
	socket.emit('register', TOPIC, ID);

	var nodes = JSON.parse(document.querySelector('#json-nodes').dataset.value);

	var getNode = function(id) {
		var node = nodes.find(n => n.id === id);
		if (!node) {
			node = {
				id: id,
				delegate: null,
			};
			nodes.push(node);
		}
		return node;
	};

	var invalidateVotes = function() {
		nodes.forEach(function(node) {
			node.votes = null;
			node.delegationChain = null;
		});
	};

	var ensureVisible = function(node) {
		if (node && node.delegate) {
			var delegatee = getNode(node.delegate);
			delegatee.expanded = true;
			ensureVisible(delegatee);
		}
	};

	var user = nodes.find(n => n.id === ID);
	if (user) {
		document.querySelector('.user__name input').value = user.name;
		document.querySelector('.user__comment textarea').value = user.comment;
		ensureVisible(user);
	}

	var updateUser = function() {
		document.querySelector('.user__votes').textContent = template.getVotes(nodes, user || {});

		if (user && user.delegate) {
			var delegatee = getNode(user.delegate);
			document.querySelector('.user__delegation').textContent = 'delegated to: ' + template.getName(delegatee);
		} else {
			document.querySelector('.user__delegation').textContent = '(no delegation)';
		}
	};

	var update = utils.initVDom(document.querySelector('#tree'), template.template, nodes, ID, function() {
		updateUser();
	});

	utils.on(document, 'click', '.node__expand', function() {
		var nodeElement = this.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(5);
		var node = getNode(id);
		node.expanded = !node.expanded;
		update(nodes);
	});

	utils.on(document, 'click', '.node__delegate', function() {
		var nodeElement = this.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(5);
		socket.emit('setDelegate', id);
	});

	utils.on(document, 'click', '.user__rm', function() {
		if (confirm('Do you really want to delete this opinion?')) {
			socket.emit('rmNode');
			document.querySelector('.user__name input').value = '';
			document.querySelector('.user__comment textarea').value = '';
		}
	});

	utils.on(document, 'change', '.user__name input', function() {
		socket.emit('setNodeName', this.value);
	});

	utils.on(document, 'click', '.user__undelegate', function() {
		socket.emit('rmDelegate');
	});

	utils.on(document, 'input', '.user__comment textarea', utils.throttle(function() {
		var comment = document.querySelector('.user__comment textarea').value;
		var node = nodes.find(n => n.id === ID);
		// Do not create a new node if the comment is empty.
		// This can happen e.g. on a keydown event from the ctrl or shift keys.
		if (node || comment) {
			socket.emit('setNodeComment', comment);
		}
	}, 1000));

	socket.on('rmNode', function(id) {
		nodes = nodes.filter(function(node) {
			if (node.delegate === id) {
				node.delegate = null;
			}
			return node.id !== id;
		});
		invalidateVotes();
		update(nodes);
	});
	socket.on('setNodeName', function(id, name) {
		getNode(id).name = name;
		update(nodes);
	});
	socket.on('setNodeComment', function(id, comment) {
		getNode(id).comment = comment;
		update(nodes);
	});
	socket.on('setDelegate', function(id, delegate) {
		getNode(id).delegate = delegate;
		invalidateVotes();
		ensureVisible(user);
		update(nodes);
	});
	socket.on('rmDelegate', function(id) {
		getNode(id).delegate = null;
		invalidateVotes();
		update(nodes);
	});
});
