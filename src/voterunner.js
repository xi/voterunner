var template = require('./template');
var utils = require('./utils');

document.addEventListener('DOMContentLoaded', function() {
	if (!location.hash) {
		location.hash = utils.randomString();
	}
	var topic = location.hash.substr(1);
	var url = 'https://via.ce9e.org/hmsg/voterunner/' + topic;
	document.title += ' - ' + topic;

	var state = {
		nodes: [],
		id: null,
		dirty: false,
	};

	var getNode = function(id) {
		var node = state.nodes.find(n => n.id === id);
		if (!node) {
			node = {
				id: id,
				delegate: null,
			};
			state.nodes.push(node);
		}
		return node;
	};

	var invalidateVotes = function() {
		state.nodes.forEach(function(node) {
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

	var update = utils.initVDom(document.querySelector('#tree'), template.template, state, function() {
		var user = state.nodes.find(n => n.id === state.id);

		document.querySelector('.user__votes').textContent = template.getVotes(state.nodes, user || {});

		if (user && user.delegate) {
			document.querySelector('.user__delegation').textContent = 'delegated to: ' + user.delegate;
		} else {
			document.querySelector('.user__delegation').textContent = '(no delegation)';
		}

		if (!state.dirty) {
			document.querySelector('.user__comment textarea').value = user ? user.comment || '' : '';
		}

		var disabled = !state.id || !navigator.onLine;
		document.querySelector('.user__rm').disabled = disabled;
		document.querySelector('.user__undelegate').disabled = disabled;
		document.querySelector('.user__comment textarea').disabled = disabled;
	});

	utils.on(document, 'click', '.node__expand', function() {
		var nodeElement = this.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(5);
		var node = getNode(id);
		node.expanded = !node.expanded;
		update(state);
	});

	utils.on(document, 'click', '.node__delegate', function() {
		var nodeElement = this.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(5);
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(['setDelegate', state.id, id]),
		});
	});

	utils.on(document, 'click', '.user__rm', function() {
		if (confirm('Do you really want to delete this opinion?')) {
			fetch(url, {
				method: 'POST',
				body: JSON.stringify(['rmNode', state.id]),
			});
			document.querySelector('.user__comment textarea').value = '';
			state.dirty = false;
		}
	});

	utils.on(document, 'input', '.user__name input', function() {
		state.id = this.value;
		state.dirty = false;
		update(state);
	});

	utils.on(document, 'click', '.user__undelegate', function() {
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(['rmDelegate', state.id]),
		});
	});

	utils.on(document, 'input', '.user__comment textarea', utils.throttle(function() {
		var comment = document.querySelector('.user__comment textarea').value;
		var node = state.nodes.find(n => n.id === state.id);
		// Do not create a new node if the comment is empty.
		// This can happen e.g. on a keydown event from the ctrl or shift keys.
		if (node || comment) {
			fetch(url, {
				method: 'POST',
				body: JSON.stringify(['setNodeComment', state.id, comment]),
			});
			state.dirty = true;
		}
	}, 1000));

	var evtSource = new EventSource(url);
	evtSource.onmessage = function(event) {
		var data = JSON.parse(event.data);
		var name = data[0];
		var id = data[1];

		if (name === 'setNodes') {
			state.nodes = data[2];
			ensureVisible(state.nodes.find(n => n.id === state.id));
		} else if (!id) {
			return;
		} else if (name === 'rmNode') {
			state.nodes = state.nodes.filter(function(node) {
				if (node.delegate === id) {
					node.delegate = null;
				}
				return node.id !== id;
			});
			invalidateVotes();
		} else if (name === 'setNodeComment') {
			getNode(id).comment = data[2];
		} else if (name === 'setDelegate') {
			getNode(id).delegate = data[2];
			invalidateVotes();
			ensureVisible(state.nodes.find(n => n.id === state.id));
		} else if (name === 'rmDelegate') {
			getNode(id).delegate = null;
			invalidateVotes();
		}
		update(state);

		if (Math.random() < 0.05) {
			invalidateVotes();
			fetch(url, {
				method: 'PUT',
				body: JSON.stringify(['setNodes', null, state.nodes]),
				headers: {'Last-Event-ID': event.lastEventId},
			});
		}
	};

	window.testClear = function(done) {
		fetch(url, {method: 'DELETE'}).then(done);
	};
});
