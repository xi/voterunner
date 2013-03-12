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

function _post(action, id, v) {
	var params = 'action=' + encodeURI(action);
	params += '&id=' + encodeURI(id);
	params += '&v=' + encodeURI(v);

	var http = new XMLHttpRequest();
	http.open('POST', 'api/post.php', true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.setRequestHeader("Content-length", params.length);
	http.setRequestHeader("Connection", "close");
	http.send(params);
}

function _get() {
	var node = document.getElementById('node' + ID);
	if (!node) {
		node = createNode(ID);
		_post('createNode', ID);
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
	var votes = document.getElementById('node'+ID).getElementsByClassName('votes')[0].textContent;
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
		var name = document.getElementById('node' + id).getElementsByClassName('name')[0].textContent;
		var comment = document.getElementById('node' + id).getElementsByClassName('comment')[0].textContent;
		delegation.textContent = name;
		delegation.setAttribute('title', comment);
	} else {
		delegation.textContent = '(no delegation)';
		delegation.removeAttribute('title');
	}
}

function addChatMsg(user, text) {
	var ul = document.getElementById('chat').getElementsByTagName('ul')[0];
	var li = document.createElement('li');

	var scroll = ul.scrollTop + ul.offsetHeight === ul.scrollHeight;

	li.textContent = user + ': ' + text;
	ul.appendChild(li);

	// scroll to bottom
	if (scroll) li.scrollIntoView();
}

/*** API ***/
function createNode(id) {
	if (!!document.getElementById('node' + id)) return;

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
	var o = document.getElementById('node' + id);
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
	var node = document.getElementById('node' + id);
	node.getElementsByClassName('name')[0].textContent = name;
	node.getElementsByClassName('delegate')[0].title = "delegate to " + name;

	if (id === ID) userSetName(name);
	userUpdateDelegation();
}

function setNodeComment(id, comment) {
	var node = document.getElementById('node' + id);
	node.getElementsByClassName('comment')[0].textContent = comment;

	if (id === ID) userSetComment(comment);
	userUpdateDelegation();
}

function setDelegate(id, new_id) {
	var o = document.getElementById('node' + id);

	// substract own votes from parents
	_rmParentVotes(o);
	if (id === ID) _rmParentHighlight(o);

	// move in DOM
	var n = document.getElementById('node' + new_id);
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
	var o = document.getElementById('node' + id);
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
	_post('setDelegate', ID, id);
}

function undelegate() {
	node = _get();
	rmDelegate(ID);
	_post('rmDelegate', ID);
}

function setName() {
	_get();
	name = userGetName();
	setNodeName(ID, name);
	_post('setNodeName', ID, name);
}

function setComment() {
	_get();
	comment = userGetComment();
	setNodeComment(ID, comment);
	_post('setNodeComment', ID, comment);
}

function chat(text) {
	var name = userGetName();
	_post('chat', name, text.value);
	text.value = '';
}

/*** helper ***/
function setCookie(key, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	} else {
		var expires = "";
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
	setCookie(key, "", -1);
}

function uid() {
	// just enough uniqueness
	var a = Math.random() * Date.now() * 0x1000;
	return Math.floor(a).toString(36);
}


/*** build ***/
function build() {
	// get current state
	var http = new XMLHttpRequest();
	http.open('GET', 'api/state.php', true);
	http.onreadystatechange = function() {
		if(http.readyState==4) {
			if(http.status==200) {
				var data = JSON.parse(http.responseText);
				setCookie('t', data.t);

				buildNodes(data.tree);
				buildChat(data.chat);
			}
		}
	};
	http.send(null);
}

function buildNodes(data) {
	for (var i=0; i<data.length; i++) {
		createNode(data[i].id);
		if (!!data[i].name) setNodeName(data[i].id, data[i].name);
		if (!!data[i].comment) setNodeComment(data[i].id, data[i].comment);
		if (!!data[i].delegate) setDelegate(data[i].id, data[i].delegate);
		buildNodes(data[i].followers);
	}
}

function buildChat(data) {
	for (var i=0; i<data.length; i++) {
		addChatMsg(data[i].id, data[i].v);
	}
}


/*** main ***/
var ID = getCookie('id');
if (!ID) {
	ID = uid();
	setCookie('id', ID);
}

window.onDOMReady = function(fn) {
	document.addEventListener("DOMContentLoaded", fn, false);
};

window.onDOMReady(function() {
	build();

	function msg(ev) {
		if (parseInt(ev.lastEventId, 10) > parseInt(getCookie('t', 10))) {
			setCookie('t', ev.lastEventId);
			data = JSON.parse(ev.data);
			if (data.id !== ID) {
				return data;
			}
		}
	}

	if (!!window.EventSource) {
		var source = new EventSource('api/queue.php');
	} else {
		alert("ERROR: Your Browser does not support Server-Sent Events.");
	}

	source.addEventListener('createNode', function(ev) {
		ev = msg(ev);
		if (ev) createNode(ev.id);
	});
	source.addEventListener('rmNode', function(ev) {
		ev = msg(ev);
		if (ev) rmNode(ev.id);
	});
	source.addEventListener('setNodeName', function(ev) {
		ev = msg(ev);
		if (ev) setNodeName(ev.id, ev.v);
	});
	source.addEventListener('setNodeComment', function(ev) {
		ev = msg(ev);
		if (ev) setNodeComment(ev.id, ev.v);
	});
	source.addEventListener('setDelegate', function(ev) {
		ev = msg(ev);
		if (ev) setDelegate(ev.id, ev.v);
	});
	source.addEventListener('rmDelegate', function(ev) {
		ev = msg(ev);
		if (ev) rmDelegate(ev.id);
	});
	source.addEventListener('chat', function(ev) {
		data = msg(ev);
		if (data) addChatMsg(data.id, data.v);
	});
});
