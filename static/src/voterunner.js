var virtualDom = require('virtual-dom');
var h = require('virtual-dom/h');
var markdown = require('markdown-it');
var io = require('socket.io-browserify');


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
	return h('li.node#node' + node.id, {
		dataset: {
			expanded: node.expanded,
		},
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

var template = function(state) {
	return h('ul', tplFollowers(state.nodes, null));
};

var uid = function() {
	// just enough uniqueness
	var a = Math.random() * Date.now() * 0x1000;
	return Math.floor(a).toString(36);
}
var setCookie = function(key, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
	} else {
		var expires = '';
	}
	document.cookie = key + "=" + value + expires;
};

var getCookie = function(key) {
	var keyEQ = key + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(keyEQ) == 0) return c.substring(keyEQ.length, c.length);
	}
};

document.addEventListener('DOMContentLoaded', function() {
	var TOPIC = document.URL.split('/')[3];
	var ID = getCookie('id');
	if (!ID) ID = uid();
	setCookie('id', ID, 100);

	var json = document.querySelector('#json-nodes').dataset.value;
	var nodes = JSON.parse(json);
	var state = {
		nodes: nodes,
		user: {},
	};

	var wrapper = document.querySelector('#tree');
	var tree = template(state);
	var element = virtualDom.create(tree);
	wrapper.innerHTML = '';
	wrapper.appendChild(element);

	var update = function() {
		var newTree = template(state);
		var patches = virtualDom.diff(tree, newTree);
		virtualDom.patch(element, patches);
		tree = newTree;
	};

	var socket = io.connect('/');
	socket.emit('register', TOPIC, ID);

	document.querySelector('#rm').addEventListener('click', function(event) {
		if (confirm(_("Do you really want to delete this opinion?"))) {
			socket.emit('rmNode');
		}
	});

	document.querySelector('#name input').addEventListener('change', function(event) {
		socket.emit('setNodeName', event.target.value);
	});

	document.querySelector('.undelegate').addEventListener('click', function(event) {
	});

	document.querySelector('#comment textarea').addEventListener('change', function(event) {
	});

	document.querySelectorAll('.expand').forEach(function(element) {
		element.addEventListener('click', function(event) {
		});
	});

	document.querySelectorAll('.delegate').forEach(function(element) {
		element.addEventListener('click', function(event) {
		});
	});

	socket.on('rmNode', function(id) {
		rmNode(id);
	});
	socket.on('setNodeName', function(id, name) {
		setNodeName(id, name);
	});
	socket.on('setNodeComment', function(id, comment) {
		setNodeComment(id, comment);
	});
	socket.on('setDelegate', function(id, delegate) {
		setDelegate(id, delegate);
	});
	socket.on('rmDelegate', function(id) {
		rmDelegate(id);
	});
});
