/*
 * voterunner - quick and dirty votes and discussions
 *
 * copyright: 2013 Tobias Bengfort <tobias.bengfort@gmx.net>
 * license: AGPL-3+
 * url: http://voterunner.herokuapp.com/
 */

/*** gui ***/
function toggleExpand(o) {
	var node = o.parentElement
		.parentElement
		.parentElement;
	if (node.getAttribute('data-expanded')) {
		node.removeAttribute('data-expanded');
		o.title = _("expand");
	} else {
		node.setAttribute('data-expanded', 1);
		o.title = _("collapse");
	}
}


/*** helper ***/
function _(s) {
	// i18n: gettext placeholder
	return s;
}

function _root() {
	return document.querySelector('#tree ul');
}

function _rmParentVotes(o, votes) {
	if (o.className !== 'node') return;
	var v = o.getElementsByClassName('votes')[0];
	var p = o.parentElement.parentElement;
	var votes2 = parseInt(v.textContent, 10);
	if (!votes) {
		votes = votes2;
	} else {
		v.textContent = votes2 - votes;
	}
	_rmParentVotes(p, votes);
}

function _addParentVotes(o, votes) {
	if (o.className !== 'node') return;
	var v = o.getElementsByClassName('votes')[0];
	var p = o.parentElement.parentElement;
	var votes2 = parseInt(v.textContent, 10);
	if (!votes) {
		votes = votes2;
	} else {
		v.textContent = votes2 + votes;
	}
	_addParentVotes(p, votes);
}

function _addParentHighlight(o) {
	if (o.className !== 'node') return;
	o.setAttribute('data-highlight', 1);
	var p = o.parentElement.parentElement;
	_addParentHighlight(p);
}

function _rmParentHighlight(o) {
	if (o.className !== 'node') return;
	o.removeAttribute('data-highlight');
	var p = o.parentElement.parentElement;
	_rmParentHighlight(p);
}

function escapeHTML(unsafe) {
	var div = document.createElement('div');
	div.textContent = unsafe;
	return div.innerHTML;
}


/*** user ***/
function userSetName(name) {
	document.querySelector('#name input').value = name;
}

function userGetName() {
	return document.querySelector('#name input').value;
}

function userSetComment(comment) {
	document.querySelector('#comment textarea').value = comment;
}

function userGetComment() {
	return document.querySelector('#comment textarea').value;
}

function userSetVotes() {
	var node = document.querySelector('node' + ID);
	if (node) {
		var votes = node.querySelector('.votes').textContent;
		document.querySelector('#user .votes').innerText = votes;
	}
}

function userSetDelegate(id) {
	var delegate = document.querySelector('#user .delegate');
	delegate.setAttribute('data-id', id);
	userUpdateDelegate();
}

function userRemoveDelegate() {
	var delegate = document.querySelector('#user .delegate');
	delegate.removeAttribute('data-id');
	userUpdateDelegate();
}

function userUpdateDelegate() {
	var delegate = document.querySelector('#user .delegate');
	var id = delegate.getAttribute('data-id');
	if (id) {
		var node = document.querySelector('#node' + id);
		if (node) {
			var name = node.querySelector('.name').textContent;
			var comment = node.querySelector('.comment').textContent;
			delegate.textContent = name;
			delegate.title = comment;
			return;
		}
	}
	delegate.textContent = _('(no delegation)');
	delegate.removeAttribute('title');
}


/*** API ***/
function createNode(id) {
	if (!!document.querySelector('#node' + id)) return;

	var root = document.querySelector('#tree ul');

	var node = document.createElement('li');
	node.className = 'node';
	node.id = "node" + id;

	var body = document.createElement('div');
	body.className = 'body';
	node.appendChild(body);

	var header = document.createElement('div');
	header.className = 'header';
	body.appendChild(header);

	var votes = document.createElement('div');
	votes.className = 'votes';
	votes.textContent = '1';
	header.appendChild(votes);

	var _delegate = document.createElement('a');
	_delegate.className = 'delegate';
	_delegate.textContent = '+';
	_delegate.title = _('delegate to anonymous');
	_delegate.addEventListener('click', function() {
		delegate(id);
	});
	header.appendChild(_delegate);

	var expand = document.createElement('a');
	expand.className = 'expand';
	expand.title = _('expand');
	expand.addEventListener('click', function(event) {
		toggleExpand(event.currentTarget);
	});
	header.appendChild(expand);

	var name = document.createElement('div');
	name.className = 'name';
	name.textContent = _('anonymous');
	header.appendChild(name);

	var comment = document.createElement('div');
	comment.className = 'comment';
	body.appendChild(comment);

	var followers = document.createElement('ul');
	followers.className = 'followers';
	node.appendChild(followers);

	root.appendChild(node);

	if (id === ID) {
		_addParentHighlight(node);
		node.setAttribute('data-self', 1);
	}

	return node;
}

function rmNode(id) {
	var node = document.querySelector('#node' + id);
	if (!node) return;
	var old = node.parentElement.parentElement;

	// mv followers to root
	var root = _root();
	var children = node.querySelector('.followers').children;
	for (var i = 0; i < children.length; i++) {
		root.appendChild(children[i]);
	}

	// substract own votes from parents
	_rmParentVotes(node);
	userSetVotes();

	// rm this from DOM
	node.parentElement.removeChild(node);
}

function setNodeName(id, name) {
	name = name || 'anonymous';
	var node = document.querySelector('#node' + id);
	if (!node) return;
	node.querySelector('.name').textContent = name;
	node.querySelector('.delegate').title = _("delegate to ") + name;

	if (id === ID) userSetName(name);
	userUpdateDelegate();
}

function setNodeComment(id, comment) {
	var node = document.querySelector('#node' + id);
	if (!node) return;
	var o = node.querySelector('.comment');

	if (window.Showdown) {
		o.innerHTML = new Showdown.converter().makeHtml(escapeHTML(comment));
		o.setAttribute('data-type', 'markdown');
	} else {
		node.querySelector('.comment').textContent = comment;
		o.setAttribute('data-type', 'pre');
	}

	if (id === ID) userSetComment(comment);
	userUpdateDelegate();
}

function setDelegate(id, new_id) {
	var node = document.querySelector('#node' + id);
	if (!node) return;

	var n = document.querySelector('#node' + new_id);
	if (!n) return rmDelegate(id);

	// substract own votes from parents
	_rmParentVotes(node);
	if (id === ID) _rmParentHighlight(node);

	// move in DOM
	n.querySelector('ul').appendChild(node);

	// add own votes to parents
	_addParentVotes(node);
	userSetVotes();

	if (id === ID) {
		_addParentHighlight(node);
		userSetDelegate(new_id);
	}
}

function rmDelegate(id) {
	var node = document.querySelector('#node' + id);
	if (!node) return;
	var root = _root();

	// substract own votes from parents
	_rmParentVotes(node);
	if (id === ID) {
		_rmParentHighlight(node);
	}

	// append to root
	root.appendChild(node);

	if (id === ID) {
		_addParentHighlight(node);
		userRemoveDelegate();
	}
	userSetVotes();
}


/*** actions ***/
function create(fn) {
	// ensures that node exists when executing fn
	var node = document.querySelector('#node' + ID);
	if (node) {
		fn(node);
	} else {
		node = createNode(ID);
		_post('createNode', function() {
			fn(node);
		});
	}
}

function delegate(id) {
	create(function(node) {
		setDelegate(ID, id);
		_post('setDelegate', id);
	});
}

function undelegate() {
	create(function(node) {
		rmDelegate(ID);
		_post('rmDelegate');
	});
}

function setName() {
	create(function(node) {
		var name = userGetName();
		setNodeName(ID, name);
		_post('setNodeName', name);
	});
}

function setComment() {
	create(function(node) {
		var comment = userGetComment();
		setNodeComment(ID, comment);
		_post('setNodeComment', comment);
	});
}

function rm() {
	if (!confirm(_("Do you really want to delete this opinion?"))) return;

	rmNode(ID);
	_post('rmNode');

	// update user interface
	userSetName('');
	userSetComment('');
	userRemoveDelegate('');
}


/*** helper ***/
function setCookie(key, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
	} else {
		var expires = '';
	}
	document.cookie = key + "=" + value + expires;
}

function getCookie(key) {
	var keyEQ = key + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(keyEQ) == 0) return c.substring(keyEQ.length, c.length);
	}
	return null;
}

function rmCookie(key) {
	setCookie(key, '', -1);
}

function uid() {
	// just enough uniqueness
	var a = Math.random() * Date.now() * 0x1000;
	return Math.floor(a).toString(36);
}


/*** build ***/
function build() {
	var jsonNodes;

	if (jsonNodes = document.querySelector('#json-nodes')) {
		buildNodes(JSON.parse(jsonNodes.getAttribute('data-value')));
		jsonNodes.parentElement.removeChild(jsonNodes);
	}
}

function buildNodes(data) {
	for (var i = 0; i < data.length; i++) {
		createNode(data[i].id);
		if (!!data[i].name) setNodeName(data[i].id, data[i].name);
		if (!!data[i].comment) setNodeComment(data[i].id, data[i].comment);
	}
	for (var i = 0; i < data.length; i++) {
		if (data[i].delegate) {
			setDelegate(data[i].id, data[i].delegate);
		}
	}
}


/*** globals ***/
var TOPIC = document.URL.split('/')[3];
var ID = getCookie('id');
if (!ID) ID = uid();
setCookie('id', ID, 100);


/*** socket ***/
socket = io.connect('/');
socket.emit('register', TOPIC, ID);

socket.on('createNode', function(id) {
	createNode(id);
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

function _post(action, v1, v2) {
	// if callback function is used it must be the last parameter
	if (v2) socket.emit(action, v1, v2);
	else socket.emit(action, v1);
}


/*** onDOMReady ***/
document.addEventListener("DOMContentLoaded", build, false);
