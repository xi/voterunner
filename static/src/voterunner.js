var virtualDom = require('virtual-dom');
var h = require('virtual-dom/h');
var markdown = require('markdown-it');
var io = require('socket.io-client');


var _ = function(s) {
	return s;
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
	var name = node.name || _('anonymous');

	var dataset = {};
	if (node.expanded) {
		dataset.expanded = true;
	}

	return h('li.node#node' + node.id, {
		dataset: dataset,
	}, [
		h('div.body', [
			h('div.header', [
				h('div.votes', node.votes || '1'),
				h('a.delegate', {
					title: _('delegate to') + ' ' + name,
				}, '+'),
				h('a.expand', {
					title: _('expand'),
				}),
				h('div.name', name),
			]),
			h('div.comment', node.comment),
		]),
		h('ul.followers', tplFollowers(nodes, node.id)),
	]);
};

var template = function(nodes) {
	return h('ul', tplFollowers(nodes, null));
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

	var nodes = JSON.parse(document.querySelector('#json-nodes').dataset.value);

	var wrapper = document.querySelector('#tree');
	var tree = template(nodes);
	var element = virtualDom.create(tree);
	wrapper.innerHTML = '';
	wrapper.appendChild(element);

	var update = function() {
		var newTree = template(nodes);
		var patches = virtualDom.diff(tree, newTree);
		virtualDom.patch(element, patches);
		tree = newTree;
	};

	var user = nodes.find(function(node) {
		return node.id === ID;
	});
	if (user) {
		document.querySelector('#name input').value = user.name;
		document.querySelector('#comment textarea').value = user.comment;
		// TODO votes
		// TODO delegation
	}

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

	var socket = io.connect('/');
	socket.emit('register', TOPIC, ID);

	document.querySelector('#rm').addEventListener('click', function(event) {
		if (confirm(_("Do you really want to delete this opinion?"))) {
			socket.emit('rmNode');
			document.querySelector('#name input').value = '';
			document.querySelector('#comment textarea').value = '';
			// TODO votes
			// TODO delegation
		}
	});

	document.querySelector('#name input').addEventListener('change', function(event) {
		socket.emit('setNodeName', event.target.value);
	});

	document.querySelector('.undelegate').addEventListener('click', function(event) {
		socket.emit('rmDelegate');
	});

	document.querySelector('#comment textarea').addEventListener('change', function(event) {
		socket.emit('setNodeComment', event.target.value);
	});

	var toggleExpand = function(event) {
		var nodeElement = event.target.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(4);
		var node = getNode(id);
		node.expanded = !node.expanded;
		update();
	};

	var setDelegate = function(event) {
		var nodeElement = event.target.parentElement.parentElement.parentElement;
		var id = nodeElement.id.substr(4);
		socket.emit('setDelegate', id);
	};

	document.querySelectorAll('.expand').forEach(function(element) {
		element.addEventListener('click', toggleExpand);
	});

	document.querySelectorAll('.delegate').forEach(function(element) {
		element.addEventListener('click', setDelegate);
	});

	socket.on('rmNode', function(id) {
		nodes = nodes.filter(function(node) {
			return node.id !== id;
		});
		update();
	});
	socket.on('setNodeName', function(id, name) {
		getNode(id).name = name;
		update();
	});
	socket.on('setNodeComment', function(id, comment) {
		getNode(id).comment = comment;
		update();
	});
	socket.on('setDelegate', function(id, delegate) {
		getNode(id).delegate = delegate;
		update();
	});
	socket.on('rmDelegate', function(id) {
		getNode(id).delegate = null;
		update();
	});
});
