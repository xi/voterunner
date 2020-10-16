var preact = require('preact');
var h = require('preact').h;
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
		node.votes = 1 + nodes
			.filter(n => n.delegate === node.id)
			.map(n => getVotes(nodes, n))
			.reduce((sum, n) => sum + n, 0);
	}

	return node.votes;
};

var getDelegationChain = function(nodes, node) {
	if (!node.delegationChain) {
		if (node.delegate) {
			var delegate = nodes.find(n => n.id === node.delegate);
			var delegationChain = getDelegationChain(nodes, delegate);
			node.delegationChain = [node.delegate].concat(delegationChain);
		} else {
			node.delegationChain = [];
		}
	}

	return node.delegationChain;
};

var getName = function(node) {
	return node.name || _('anonymous');
};

var tplFollowers = function(nodes, id, ID) {
	return nodes
		.filter(n => n.delegate === id)
		.sort((a, b) => getVotes(nodes, b) - getVotes(nodes, a))
		.map(n => tplNode(nodes, n, ID));
};

var tplNode = function(nodes, node, ID) {
	var classList = [];
	if (node.expanded) {
		classList.push('is-expanded');
	}
	if (node.id === ID) {
		classList.push('node--self');
	}

	var delegateAttrs = {};
	if (node.id === ID || getDelegationChain(nodes, node).includes(ID)) {
		delegateAttrs.disabled = true;
	}

	return h('li', {
		key: 'node-' + node.id,
		id: 'node-' + node.id,
		className: 'node ' + classList.join(' '),
		role: 'treeitem',
		'aria-expanded': '' + !!node.expanded,
	}, [
		h('article', {
			className: 'node__body',
		}, [
			h('header', {
				className: 'node__header bar',
			}, [
				h('button', {
					className: 'node__expand bar__item bar__item--button bar__item--left',
					title: _(node.expanded ? 'collapse' : 'expand'),
				}, node.expanded ? '\u25BC' : '\u25B6'),
				h('button', {
					className: 'node__delegate bar__item bar__item--button bar__item--right',
					title: _('delegate to ') + getName(node),
					attributes: delegateAttrs,
				}, '\u2795'),
				h('div', {className: 'node__votes bar__item bar__item--right'}, '' + getVotes(nodes, node)),
				h('div', {className: 'node__name bar__item' + (!node.expanded && node.comment ? '' : ' bar__item--grow')}, getName(node)),
				!node.expanded && node.comment && h('div', {className: 'node__preview bar__item bar__item--grow'}, node.comment.substr(0, 100)),
			]),
			node.expanded && h('div', {
				className: 'node__comment',
				dangerouslySetInnerHTML: {
					__html: md.render(node.comment || ''),
				},
			}),
		]),
		h('ul', {
			className: 'tree',
			role: 'group',
		}, tplFollowers(nodes, node.id, ID)),
	]);
};

var template = function(nodes, ID) {
	return h('ul', {
		className: 'tree',
		role: 'tree',
	}, tplFollowers(nodes, null, ID));
};

var initVDom = function(wrapper, nodes, ID, afterRender) {
	wrapper.innerHTML = '';
	var tree = template(nodes, ID);
	var element = preact.render(tree, wrapper);
	afterRender();

	return function(newState) {
		var newTree = template(newState, ID);
		preact.render(newTree, wrapper, element);
		afterRender();
	};
};

var uid = function() {
	// just enough uniqueness
	var a = Math.random() * Date.now() * 0x1000;
	return Math.floor(a).toString(36);
};
var setCookie = function(key, value, days) {
	localStorage[key] = value;
};

var getCookie = function(key) {
	return localStorage[key];
};

document.addEventListener('DOMContentLoaded', function() {
	var TOPIC = document.URL.split('/')[3];
	var ID = document.URL.split('/')[4];
	if (!ID) ID = getCookie('id');
	if (!ID) ID = uid();
	setCookie('id', ID, 100);

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
		document.querySelector('.user__votes').textContent = getVotes(nodes, user || {});

		if (user && user.delegate) {
			var delegatee = getNode(user.delegate);
			document.querySelector('.user__delegation').textContent = _('delegated to: ') + getName(delegatee);
		} else {
			document.querySelector('.user__delegation').textContent = _('(no delegation)');
		}
	};

	var toggleExpand = function(event) {
		var nodeElement = event.target.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(5);
		var node = getNode(id);
		node.expanded = !node.expanded;
		update(nodes);
	};

	var setDelegate = function(event) {
		var nodeElement = event.target.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(5);
		socket.emit('setDelegate', id);
	};

	var update = initVDom(document.querySelector('#tree'), nodes, ID, function() {
		updateUser();

		document.querySelectorAll('.node__expand').forEach(function(element) {
			element.addEventListener('click', toggleExpand);
		});

		document.querySelectorAll('.node__delegate').forEach(function(element) {
			element.addEventListener('click', setDelegate);
		});
	});

	document.querySelector('.user__rm').addEventListener('click', function(event) {
		if (confirm(_('Do you really want to delete this opinion?'))) {
			socket.emit('rmNode');
			document.querySelector('.user__name input').value = '';
			document.querySelector('.user__comment textarea').value = '';
		}
	});

	document.querySelector('.user__name input').addEventListener('change', function(event) {
		socket.emit('setNodeName', event.target.value);
	});

	document.querySelector('.user__undelegate').addEventListener('click', function(event) {
		socket.emit('rmDelegate');
	});

	var pushComment = throttle(function() {
		var comment = document.querySelector('.user__comment textarea').value;
		var node = nodes.find(n => n.id === ID);
		// Do not create a new node if the comment is empty.
		// This can happen e.g. on a keydown event from the ctrl or shift keys.
		if (node || comment) {
			socket.emit('setNodeComment', comment);
		}
	}, 1000);

	document.querySelector('.user__comment textarea').addEventListener('change', pushComment);
	document.querySelector('.user__comment textarea').addEventListener('keydown', pushComment);

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
