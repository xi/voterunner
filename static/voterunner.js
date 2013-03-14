/*
 * voterunner - quick and dirty votes and discussions
 *
 * copyright: 2013 Tobias Bengfort <tobias.bengfort@gmx.net>
 * license: AGPL-3+
 * url: http://voterunner.herokuapp.com/
 */

/*** gui ***/
function toggleExpand(o) {
	o = o.parentElement;
	o = o.parentElement;
	o = o.parentElement;
	if (o.getAttribute('data-expanded')) {
		o.removeAttribute('data-expanded');
	} else {
		o.setAttribute('data-expanded', 1);
	}
}


/*** helper ***/
function _root() {
	var root = document.getElementById('tree');
	return root.getElementsByTagName('ul')[0];
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

function _get() {
	var node = document.getElementById('node'+ID);
	if (!node) {
		node = createNode(ID);
		_post('createNode');
	}
	return node;
}


/*** user ***/
function userSetName(name) {
	document.getElementById('name').getElementsByTagName('input')[0].value = name;
}

function userGetName() {
	var name = document.getElementById('name');
	name = name.getElementsByTagName('input')[0];
	return name.value;
}

function userSetComment(comment) {
	document.getElementById('comment').getElementsByTagName('textarea')[0].value = comment;
}

function userGetComment() {
	var comment = document.getElementById('comment');
	comment = comment.getElementsByTagName('textarea')[0];
	return comment.value;
}

function userSetVotes() {
	var votes = document.getElementById('node'+ID).getElementsByClassName('votes')[0].textContent; // TODO bug
	document.getElementById('user').getElementsByClassName('votes')[0].innerText = votes;
}

function userSetDelegation(id) {
	var delegation = document.getElementById('user').getElementsByClassName('delegation')[0];
	delegation.setAttribute('data-id', id);
	userUpdateDelegation();
}

function userUnsetDelegation() {
	var delegation = document.getElementById('user').getElementsByClassName('delegation')[0];
	delegation.removeAttribute('data-id');
	userUpdateDelegation();
}

function userUpdateDelegation() {
	var delegation = document.getElementById('user').getElementsByClassName('delegation')[0];
	var id = delegation.getAttribute('data-id');
	if (id) {
		var name = document.getElementById('node'+id).getElementsByClassName('name')[0].textContent;
		var comment = document.getElementById('node'+id).getElementsByClassName('comment')[0].textContent;
		delegation.textContent = name;
		delegation.setAttribute('title', comment);
	} else {
		delegation.textContent = '(no delegation)';
		delegation.removeAttribute('title');
	}
}

function addChatMsg(id, text) {
	var name = document.getElementById('node'+id);
	if (name) {
		name = name.getElementsByClassName('name')[0].textContent;
	} else {
		name = 'anonymous';
	}

	var ul = document.getElementById('chat').getElementsByTagName('ul')[0];
	var li = document.createElement('li');

	var scroll = ul.scrollTop + ul.offsetHeight === ul.scrollHeight;

	li.textContent = name + ': ' + text;
	ul.appendChild(li);

	// scroll to bottom
	if (scroll) li.scrollIntoView();
}

/*** API ***/
function createNode(id) {
	if (!!document.getElementById('node'+id)) return;

	var root = document.getElementById('tree');
	root = root.getElementsByTagName('ul')[0];

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

	var delegate = document.createElement('a');
	delegate.className = 'delegate';
	delegate.textContent = '+';
	delegate.title = 'delegate to anonymous';
	delegate.setAttribute('onclick', 'delegate("' + id + '")');
	header.appendChild(delegate);

	var expand = document.createElement('a');
	expand.className = 'expand';
	expand.setAttribute('onclick', 'toggleExpand(this)');
	header.appendChild(expand);

	var name = document.createElement('span');
	name.className = 'name';
	name.textContent = 'anonymous';
	header.appendChild(name);

	var comment = document.createElement('p');
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
	var o = document.getElementById('node'+id);
	var old = o.parentElement.parentElement;

	// mv followers to root
	var root = _root();
	var children = o.getElementsByClassName('followers')[0].children;
	for (var i=0; i<children.length; i++) {
		root.appendChild(children[i]);
	}

	// substract own votes from parents
	_rmParentVotes(o);

	// rm this from DOM
	o.remove();

	userSetVotes();
}

function setNodeName(id, name) {
	name = name || 'anonymous';
	var node = document.getElementById('node'+id);
	node.getElementsByClassName('name')[0].textContent = name;
	node.getElementsByClassName('delegate')[0].title = "delegate to " + name;

	if (id === ID) userSetName(name);
	userUpdateDelegation();
}

function setNodeComment(id, comment) {
	var node = document.getElementById('node'+id);
	node.getElementsByClassName('comment')[0].textContent = comment;

	if (id === ID) userSetComment(comment);
	userUpdateDelegation();
}

function setDelegate(id, new_id) {
	var o = document.getElementById('node'+id);

	// substract own votes from parents
	_rmParentVotes(o);
	if (id === ID) _rmParentHighlight(o);

	// move in DOM
	var n = document.getElementById('node'+new_id);
	n = n.getElementsByTagName('ul')[0];
	n.appendChild(o);

	// add own votes to parents
	_addParentVotes(o);

	if (id === ID) {
		_addParentHighlight(o);
		userSetDelegation(new_id);
	}
	userSetVotes();
}

function rmDelegate(id) {
	var o = document.getElementById('node'+id);
	var root = _root();

	// substract own votes from parents
	_rmParentVotes(o);
	if (id === ID) _rmParentHighlight(o);

	// append to root
	root.appendChild(o);

	if (id === ID) {
		_addParentHighlight(o);
		userUnsetDelegation();
	}
	userSetVotes();
}


/*** actions ***/
function delegate(id) {
	node = _get();
	setDelegate(ID, id);
	_post('setDelegate', id);
}

function undelegate() {
	node = _get();
	rmDelegate(ID);
	_post('rmDelegate');
}

function setName() {
	_get();
	name = userGetName();
	setNodeName(ID, name);
	_post('setNodeName', name);
}

function setComment() {
	_get();
	comment = userGetComment();
	setNodeComment(ID, comment);
	_post('setNodeComment', comment);
}

function chat(text) {
	addChatMsg(ID, text.value);
	_post('chat', text.value);
	text.value = '';
}

/*** helper ***/
function setCookie(key, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	} else {
		var expires = '';
	}
	document.cookie = key+"="+value+expires;
}

function getCookie(key) {
	var keyEQ = key + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1, c.length);
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
	var jsonNodes = document.getElementById('json-nodes');
	buildNodes(JSON.parse(jsonNodes.textContent));
	jsonNodes.parentElement.removeChild(jsonNodes);

	var jsonChat = document.getElementById('json-chat');
	buildChat(JSON.parse(jsonChat.textContent));
	jsonChat.parentElement.removeChild(jsonChat);

	var jsonOnline = document.getElementById('json-online');
	// TODO
	jsonOnline.parentElement.removeChild(jsonOnline);
}

function buildNodes(data) {
	for (var i=0; i<data.length; i++) {
		createNode(data[i].id);
		if (!!data[i].name) setNodeName(data[i].id, data[i].name);
		if (!!data[i].comment) setNodeComment(data[i].id, data[i].comment);
	}
	for (var i=0; i<data.length; i++) {
		if (data[i].delegate) {
			setDelegate(data[i].id, data[i].delegate);
		}
	}
}

function buildChat(data) {
	for (var i=0; i<data.length; i++) {
		addChatMsg(data[i].id, data[i].text);
	}
}


/*** globals ***/
var TOPIC = document.documentURI.split('/')[3];
var ID = getCookie('id');
if (!ID) {
	ID = uid();
	setCookie('id', ID);
}


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
socket.on('chat', function(id, text) {
	addChatMsg(id, text);
});

function _post(action, v1, v2) {
	socket.emit(action, v1, v2);
}


/*** onDOMReady ***/
window.onDOMReady = function(fn) {
	document.addEventListener("DOMContentLoaded", fn, false);
};

window.onDOMReady(function() {
	document.title += " - " + TOPIC;;
	build();
});
