var virtualDom = require('virtual-dom');
var h = require('virtual-dom/h');
var MarkdownIt = require('markdown-it');
var io = require('socket.io-client');

var md = new MarkdownIt();

var _ = function(s) {
	return s;
};

var throttle = function(fn, timeout) {
	var called, blocked;

	var result = function() {
		if (blocked) {
			called = true;
		} else {
			fn();
			blocked = true;
			called = false;

			setTimeout(function() {
				blocked = false;

				if (called) {
					result();
				}
			}, timeout);
		}
	};

	return result;
};

var getVotes = function(nodes, node) {
	if (!node.votes) {
		node.votes = 1 + nodes.filter(function(follower) {
			return follower.delegate === node.id;
		}).map(function(follower) {
			return getVotes(nodes, follower);
		}).reduce(function(a, b) {
			return a + b;
		}, 0);
	}

	return node.votes;
};

var getName = function(node) {
	return node.name || _('anonymous');
};

var tplFollowers = function(nodes, id) {
	var _tplNode = function(node) {
		return tplNode(nodes, node);
	};
	return nodes.filter(function(node) {
		return node.delegate === id;
	}).map(_tplNode);
};

var tplNode = function(nodes, node) {
	var dataset = {};
	if (node.expanded) {
		dataset.expanded = true;
	}

	return h('li.node#node' + node.id, {
		dataset: dataset,
	}, [
		h('div.body', [
			h('div.header', [
				h('div.votes', '' + getVotes(nodes, node)),
				h('a.delegate', {
					title: _('delegate to') + getName(node),
				}, '+'),
				h('a.expand', {
					title: _('expand'),
				}),
				h('div.name', getName(node)),
			]),
			h('div.comment', {
				innerHTML: md.render(node.comment || ''),
			}),
		]),
		h('ul.followers', tplFollowers(nodes, node.id)),
	]);
};

var template = function(nodes) {
	return h('ul', tplFollowers(nodes, null));
};

var initVDom = function(wrapper, state, afterRender) {
	var tree = template(state);
	var element = virtualDom.create(tree);
	wrapper.innerHTML = '';
	wrapper.appendChild(element);
	afterRender();

	return function(newState) {
		var newTree = template(newState);
		var patches = virtualDom.diff(tree, newTree);
		virtualDom.patch(element, patches);
		tree = newTree;
		afterRender();
	};
};

var uid = function() {
	// just enough uniqueness
	var a = Math.random() * Date.now() * 0x1000;
	return Math.floor(a).toString(36);
}
var setCookie = function(key, value, days) {
	localStorage[key] = value;
};

var getCookie = function(key) {
	return localStorage[key];
};

document.addEventListener('DOMContentLoaded', function() {
	var TOPIC = document.URL.split('/')[3];
	var ID = getCookie('id');
	if (!ID) ID = uid();
	setCookie('id', ID, 100);

	var socket = io.connect('/');
	socket.emit('register', TOPIC, ID);

	var nodes = JSON.parse(document.querySelector('#json-nodes').dataset.value);

	var getNode = function(id) {
		var node = nodes.find(function(node) {
			return node.id === id;
		});
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
		});
	};

	var ensureVisible = function(node) {
		if (node && node.delegate) {
			var delegatee = getNode(node.delegate);
			delegatee.expanded = true;
			ensureVisible(delegatee);
		}
	};

	var user = nodes.find(function(node) {
		return node.id === ID;
	});
	if (user) {
		document.querySelector('#name input').value = user.name;
		document.querySelector('#comment textarea').value = user.comment;
		ensureVisible(user);
	}

	var updateUser = function() {
		document.querySelector('#user .votes').textContent = getVotes(nodes, user || {});

		if (user && user.delegate) {
			var delegatee = getNode(user.delegate);
			document.querySelector('#user .delegate').textContent = getName(delegatee);
		} else {
			document.querySelector('#user .delegate').textContent = _('(no delegation)');
		}
	};

	var toggleExpand = function(event) {
		var nodeElement = event.target.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(4);
		var node = getNode(id);
		node.expanded = !node.expanded;
		update(nodes);
	};

	var setDelegate = function(event) {
		var nodeElement = event.target.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(4);
		socket.emit('setDelegate', id);
	};

	var update = initVDom(document.querySelector('#tree'), nodes, function() {
		updateUser();

		document.querySelectorAll('.expand').forEach(function(element) {
			element.addEventListener('click', toggleExpand);
		});

		document.querySelectorAll('.delegate').forEach(function(element) {
			element.addEventListener('click', setDelegate);
		});
	});

	document.querySelector('#rm').addEventListener('click', function(event) {
		if (confirm(_("Do you really want to delete this opinion?"))) {
			socket.emit('rmNode');
			document.querySelector('#name input').value = '';
			document.querySelector('#comment textarea').value = '';
		}
	});

	document.querySelector('#name input').addEventListener('change', function(event) {
		socket.emit('setNodeName', event.target.value);
	});

	document.querySelector('.undelegate').addEventListener('click', function(event) {
		socket.emit('rmDelegate');
	});

	var pushComment = throttle(function() {
		var comment = document.querySelector('#comment textarea').value;
		socket.emit('setNodeComment', comment);
	}, 1000);

	document.querySelector('#comment textarea').addEventListener('change', pushComment);
	document.querySelector('#comment textarea').addEventListener('keydown', pushComment);

	socket.on('rmNode', function(id) {
		nodes = nodes.filter(function(node) {
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
