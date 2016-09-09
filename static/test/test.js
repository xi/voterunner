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
	}

	iframe.reload = function(fn) {
		this.onload = function() {
			this.onload = fn;
			this.src = this.url;
		}
		this.src = '';
	}

	document.getElementById('testarea').appendChild(iframe);
}

describe("load", function() {
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

	it("should work without error", function() {
		expect(browser.contentDocument.getElementById('name')).to.exist;
	});
	it("should set the page title", function() {
		var title = browser.contentDocument.title;
		expect(title).to.equal('voterunner - test' + test);
	});
});

describe("setName", function() {
	var test = 'setName'
	  , name = 'testName';
	var browser;
	var d, userName, node, nodeName;

	before(function(done) {
		setUp('/test' + test + '/testID', function(b) {
			browser = b;
			d = browser.contentDocument;

			userName = d.getElementById('name').getElementsByTagName('input')[0];
			userName.value = name
			userName.dispatchEvent(new Event('change'));

			setTimeout(function() {done()}, 200);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it("should set user name", function() {
		expect(userName.value).to.equal(name);
	});

	it("node sould exists", function() {
		node = d.getElementById('node'+'testID');
		expect(node).to.exist;
	});

	it("should set node name", function() {
		node = d.getElementById('node'+'testID');
		nodeName = node.getElementsByClassName('body')[0].getElementsByClassName('name')[0].textContent;
		expect(nodeName).to.equal(name);
	});

	it("should be permanent", function(done) {
		browser.reload(function() {
			d = browser.contentDocument;
			userName = d.getElementById('name').getElementsByTagName('input')[0].value;
			expect(userName).to.equal(name);

			node = d.getElementById('node'+'testID');
			nodeName = node.getElementsByClassName('body')[0].getElementsByClassName('name')[0].textContent;
			expect(nodeName).to.equal(name);

			done();
		});
	});
});

describe("setComment", function() {
	var test = 'setComment'
	  , comment = 'testComment';
	var browser;
	var d, userComment, node, nodeComment;

	before(function(done) {
		setUp('/test' + test + '/testID', function(b) {
			browser = b;
			d = browser.contentDocument;

			userComment = d.getElementById('comment').getElementsByTagName('textarea')[0];
			userComment.value = comment;
			userComment.dispatchEvent(new Event('change'));

			setTimeout(function() {done()}, 200);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it("should set user comment", function() {
		expect(userComment.value).to.equal(comment);
	});

	it("node sould exists", function() {
		node = d.getElementById('node'+'testID');
		expect(node).to.exist;
	});

	it("should set node comment", function() {
		node = d.getElementById('node'+'testID');
		nodeComment = node.getElementsByClassName('body')[0].getElementsByClassName('comment')[0].textContent.trim();
		expect(nodeComment).to.equal(comment);
	});

	it("should be permanent", function(done) {
		browser.reload(function() {
			d = browser.contentDocument;
			userComment = d.getElementById('comment').getElementsByTagName('textarea')[0].value;
			expect(userComment).to.equal(comment);

			node = d.getElementById('node'+'testID');
			nodeComment = node.getElementsByClassName('body')[0].getElementsByClassName('comment')[0].textContent.trim();
			expect(nodeComment).to.equal(comment);

			done();
		});
	});
});

describe("setDelegate", function() {
	// TODO
});

describe("removeDelegate", function() {
	// TODO
});

describe("remove", function() {
	var test = 'remove'
	  , comment = 'testComment';
	var browser;
	var d, userName, userComment, userRemove;

	before(function(done) {
		setUp('/test' + test + '/testID', function(b) {
			browser = b;
			d = browser.contentDocument;
			browser.contentWindow.confirm = function() {return true};

			// create something to delete
			userName = d.getElementById('name').getElementsByTagName('input')[0];
			userName.value = 'testName';
			userName.dispatchEvent(new Event('change'));
			userComment = d.getElementById('comment').getElementsByTagName('textarea')[0];
			userComment.value = 'testComment';
			userComment.dispatchEvent(new Event('change'));

			userRemove = d.getElementById('rm');
			userRemove.dispatchEvent(new Event('click'));

			setTimeout(function() {done()}, 200);
		});
	});

	after(function(done) {
		browser.tearDown(done);
	});

	it("should remove node", function() {
		var node = d.getElementById('node'+'testID');
		expect(node).to.not.exist;
	});

	it("should clear user name", function() {
		userName = d.getElementById('name').getElementsByTagName('input')[0].value;
		expect(userName).to.equal('');
	});

	it("should clear user comment", function() {
		userComment = d.getElementById('comment').getElementsByTagName('textarea')[0].value;
		expect(userComment).to.equal('');
	});

	it("should be permanent", function(done) {
		browser.reload(function() {
			d = browser.contentDocument;

			var node = d.getElementById('node'+'testID');
			expect(node).to.not.exist;

			done();
		});
	});
});

describe("chat", function() {
	var test = 'chat'
	  , name = 'testName'
	  , msg = 'testMessage';
	var browser;
	var d, chatInput, chatList;

	before(function(done) {
		setUp('/test' + test + '/testID', function(b) {
			browser = b;
			d = browser.contentDocument;

			var userName = d.getElementById('name').getElementsByTagName('input')[0];
			userName.value = name;
			userName.onchange();

			setTimeout(function() {
				chatInput = d.getElementById('chat').getElementsByTagName('input')[0];
				chatInput.value = msg;
				chatInput.form.onsubmit({preventDefault: function() {}});

				setTimeout(function() {done()}, 100);
			}, 200);
		});
	});

	after(function(done) {
		browser.tearDown();
		done();
	});

	it("should clear the input field", function() {
		expect(chatInput.value).to.equal('');
	});

	it("should create a new chat message", function() {
		chatList = d.getElementById('chat').getElementsByTagName('ul')[0].children;
		expect(chatList).to.not.have.length(0);
		expect(chatList[chatList.length-1].textContent).to.equal(name + ': ' + msg);
	});

	it("should be permanent", function(done) {
		browser.reload(function() {
			d = browser.contentDocument;

			chatList = d.getElementById('chat').getElementsByTagName('ul')[0].children;
			expect(chatList).to.not.have.length(0);
			expect(chatList[chatList.length-1].textContent).to.equal(name + ': ' + msg);

			done();
		});
	});
});
