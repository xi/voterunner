var TIMEOUT = 400;
var ID = 'testID'

setUp = function(url, fn) {
	var iframe = document.createElement('iframe');
	iframe.onload = function() {fn(iframe)};
	iframe.url = url;
	iframe.src = url;

	iframe.tearDown = function(done) {
		var self = this;
		self.contentWindow.socket.emit('testClear', function() {
			self.parentNode.removeChild(self);
			done();
		});
	};

	iframe.reload = function(fn) {
		this.onload = function() {
			this.onload = fn;
			this.src = this.url;
		};
		this.src = '';
	};

	document.getElementById('testarea').appendChild(iframe);
};

describe('load', function() {
	var test = 'load';
	var browser;

	before(function(done) {
		setUp('/test' + test + '/', function(b) {
			browser = b;
			done();
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it('should work without error', function() {
		expect(browser.contentDocument.querySelector('#name')).to.exist;
	});
	it('should set the page title', function() {
		var title = browser.contentDocument.title;
		expect(title).to.equal('voterunner - test' + test);
	});
});

describe('setName', function() {
	var test = 'setName';
	var name = 'testName';
	var browser;
	var d, userName, node, nodeName;

	before(function(done) {
		setUp('/test' + test + '/' + ID, function(b) {
			browser = b;
			d = browser.contentDocument;

			userName = d.querySelector('#name input');
			userName.value = name;
			userName.dispatchEvent(new Event('change'));

			setTimeout(done, TIMEOUT);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it('should set user name', function() {
		expect(userName.value).to.equal(name);
	});

	it('node sould exists', function() {
		node = d.getElementById('node-' + ID);
		expect(node).to.exist;
	});

	it('should set node name', function() {
		node = d.getElementById('node-' + ID);
		nodeName = node.querySelector('.body .name').textContent;
		expect(nodeName).to.equal(name);
	});

	it('should be permanent', function(done) {
		browser.reload(function() {
			d = browser.contentDocument;
			userName = d.querySelector('#name input').value;
			expect(userName).to.equal(name);

			node = d.getElementById('node-' + ID);
			nodeName = node.querySelector('.body .name').textContent;
			expect(nodeName).to.equal(name);

			done();
		});
	});
});

describe('setComment', function() {
	var test = 'setComment';
	var comment = 'testComment';
	var browser;
	var d, userComment, node, nodeComment;

	before(function(done) {
		setUp('/test' + test + '/' + ID, function(b) {
			browser = b;
			d = browser.contentDocument;

			userComment = d.querySelector('#comment textarea');
			userComment.value = comment;
			userComment.dispatchEvent(new Event('change'));

			setTimeout(done, TIMEOUT);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it('should set user comment', function() {
		expect(userComment.value).to.equal(comment);
	});

	it('node sould exists', function() {
		node = d.getElementById('node-' + ID);
		expect(node).to.exist;
	});

	it('should set node comment', function() {
		node = d.getElementById('node-' + ID);
		nodeComment = node.querySelector('.body .comment').textContent.trim();
		expect(nodeComment).to.equal(comment);
	});

	it('should be permanent', function(done) {
		browser.reload(function() {
			d = browser.contentDocument;
			userComment = d.querySelector('#comment textarea').value;
			expect(userComment).to.equal(comment);

			node = d.getElementById('node-' + ID);
			nodeComment = node.querySelector('.body .comment').textContent.trim();
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
	var comment = 'testComment';
	var browser;
	var d, userName, userComment, userRemove;

	before(function(done) {
		setUp('/test' + test + '/' + ID, function(b) {
			browser = b;
			d = browser.contentDocument;
			browser.contentWindow.confirm = function() {return true};

			// create something to delete
			userName = d.querySelector('#name input');
			userName.value = 'testName';
			userName.dispatchEvent(new Event('change'));
			userComment = d.querySelector('#comment textarea');
			userComment.value = 'testComment';
			userComment.dispatchEvent(new Event('change'));

			userRemove = d.querySelector('#rm');
			userRemove.dispatchEvent(new Event('click'));

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

	it('should clear user name', function() {
		userName = d.querySelector('#name input').value;
		expect(userName).to.equal('');
	});

	it('should clear user comment', function() {
		userComment = d.querySelector('#comment textarea').value;
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
