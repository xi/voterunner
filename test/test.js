/* global describe, before, after, it, expect */

var TIMEOUT = 400;
var ID = 'testID';

var trigger = function(target, type) {
	target.dispatchEvent(new Event(type, {bubbles: true}));
};

var setUpUser = function(browser, id) {
	var d = browser.contentDocument;
	var userName = d.querySelector('.user__name input');
	userName.value = id;
	trigger(userName, 'input');
};

var setUp = function(topic, fn) {
	var iframe = document.createElement('iframe');
	iframe.url = '/#test' + topic;

	iframe.onload = function() {
		setUpUser(this, ID);
		fn(iframe);
	};

	iframe.tearDown = function(done) {
		this.contentWindow.testClear(() => {
			this.parentNode.removeChild(this);
			done();
		});
	};

	iframe.reload = function(fn) {
		this.onload = function() {
			this.onload = function() {
				setUpUser(this, ID);
				setTimeout(fn, TIMEOUT);
			};
			this.src = this.url;
		};
		this.src = '';
	};

	document.getElementById('testarea').appendChild(iframe);
	iframe.src = iframe.url;
};

describe('load', function() {
	var test = 'load';
	var browser;

	before(function(done) {
		setUp(test, function(b) {
			browser = b;
			done();
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it('should work without error', function() {
		expect(browser.contentDocument.querySelector('.user__name')).to.exist;
	});
	it('should set the page title', function() {
		var title = browser.contentDocument.title;
		expect(title).to.equal('voterunner - test' + test);
	});
});

describe('setComment', function() {
	var test = 'setComment';
	var comment = 'testComment';
	var browser;
	var d, userComment, node, nodeComment, nodeExpand;

	before(function(done) {
		setUp(test, function(b) {
			browser = b;
			d = browser.contentDocument;

			userComment = d.querySelector('.user__comment textarea');
			userComment.value = comment;
			trigger(userComment, 'input');

			setTimeout(done, TIMEOUT);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it('should set user comment', function() {
		expect(userComment.value).to.equal(comment);
	});

	it('node sould exist', function() {
		node = d.getElementById('node-' + ID);
		expect(node).to.exist;
	});

	it('should set node comment', function() {
		node = d.getElementById('node-' + ID);
		nodeExpand = node.querySelector('.node__expand');
		trigger(nodeExpand, 'click');
		nodeComment = node.querySelector('.node__comment').textContent.trim();
		expect(nodeComment).to.equal(comment);
	});

	it('should be permanent', function(done) {
		browser.reload(function() {
			d = browser.contentDocument;
			userComment = d.querySelector('.user__comment textarea').value;
			expect(userComment).to.equal(comment);

			node = d.getElementById('node-' + ID);
			nodeExpand = node.querySelector('.node__expand');
			trigger(nodeExpand, 'click');
			nodeComment = node.querySelector('.node__comment').textContent.trim();
			expect(nodeComment).to.equal(comment);

			done();
		});
	});
});

describe('setDelegate', function() {
	// TODO
});

describe('removeDelegate', function() {
	// TODO
});

describe('remove', function() {
	var test = 'remove';
	var browser;
	var d, userComment, userRemove;

	before(function(done) {
		setUp(test, function(b) {
			browser = b;
			d = browser.contentDocument;
			browser.contentWindow.confirm = () => true;

			// create something to delete
			userComment = d.querySelector('.user__comment textarea');
			userComment.value = 'testComment';
			trigger(userComment, 'input');

			userRemove = d.querySelector('.user__rm');
			trigger(userRemove, 'click');

			setTimeout(done, TIMEOUT);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it('should remove node', function() {
		var node = d.getElementById('node-' + ID);
		expect(node).to.not.exist;
	});

	it('should clear user comment', function() {
		userComment = d.querySelector('.user__comment textarea').value;
		expect(userComment).to.equal('');
	});

	it('should be permanent', function(done) {
		browser.reload(function() {
			d = browser.contentDocument;

			var node = d.getElementById('node-' + ID);
			expect(node).to.not.exist;

			done();
		});
	});
});
