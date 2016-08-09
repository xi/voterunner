/*
 * voterunner - quick and dirty votes and discussions
 *
 * copyright: 2013 Tobias Bengfort <tobias.bengfort@gmx.net>
 * license: AGPL-3+
 * url: http://voterunner.herokuapp.com/
 */

var url = require('url');

var express = require('express');
var http = require('http');
var app = express();
var server = http.Server(app);
var io = require('socket.io').listen(server);
var pg = require('pg');
var fs = require('fs');
var log4js = require('log4js');

var DATABASE_URL = process.env.DATABASE_URL;
var PORT = process.env.PORT || 5000;

var log = log4js.getLogger();

app.use(express.static('static'));
server.listen(PORT, function() {
	log.info("Listening on " + PORT);
});

var parseDatabaseUrl = function(databaseUrl) {
	var params = url.parse(databaseUrl);
	var auth = params.auth.split(':');

	return {
		user: auth[0],
		password: auth[1],
		host: params.hostname,
		port: params.port,
		database: params.pathname.split('/')[1],
	};
}

var db = new pg.Pool(parseDatabaseUrl(DATABASE_URL));

var throwErr = function(err) {
	if (err) throw err;
}

// setup table
db.query("CREATE TABLE IF NOT EXISTS nodes (topic TEXT, id TEXT, name TEXT, comment TEXT, delegate TEXT, UNIQUE (topic, id))", throwErr);

function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function tpl(file, data, res) {
	// `<% key %>` in template `file` will be replaced by `data.key` as json
	// `<= key =>` in template `file` will be replaced by `data.key` as string
	fs.readFile('tpl/'+file, 'utf8', function(err, html) {
		html = html.replace(/<% ([^>]*) %>/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return '<div id="json-' + key + '" data-value="' + escapeHTML(JSON.stringify(data[key])) + '"></div>';
			} else {
				return '';
			}
		});

		html = html.replace(/<= ([^>]*) =>/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return escapeHTML(data[key].toString());
			} else {
				return '';
			}

		});

		res.send(html);
	});
}

function markdown(file, res) {
	fs.readFile(file, 'utf8', function(err, markdown) {
		tpl('markdown.html', {'markdown': markdown}, res);
	});
}


// welcome view
app.get('/', function (req, res) {
	markdown('README.md', res);
});

// json state
app.get('/:topic/json/', function(req, res) {
	var topic = req.params.topic;
	var sql = "SELECT id, name, comment, delegate FROM nodes WHERE topic = $1";

	db.query(sql, [topic], function(err, result) {
		if (err) return res.status(500).send(err.toString());
		res.json(result.rows);
	});
});

// opml state
app.get('/:topic/opml/', function(req, res) {
	var topic = req.params.topic;
	var sql = "SELECT id, name, comment, delegate FROM nodes WHERE topic = $1";

	db.query(sql, [topic], function(err, result) {
		if (err) return res.status(500).send(err.toString());

		var tree = result.rows;

		for (var i=0; i<tree.length; i++) {
			tree[i].followers = [];
		}

		function insert(tree, node) {
			for (var i=0; i<tree.length; i++) {
				if (tree[i].id === node.id) continue;
				if (tree[i].id === node.delegate) {
					tree[i].followers.push(node);
					return true;
				}
				if (insert(tree[i].followers, node)) {
					return true;
				}
			}
		}

		var n = tree.length;
		for (var i=0; i<n; i++) {
			var node = tree.shift();
			if (!insert(tree, node)) {
				tree.push(node);
			}
		}

		function opml(tree, indent) {
			var s = '';
			if (!indent) {
				s += '<?xml version="1.0" encoding="UTF-8"?>\n';
				s += '<opml version="1.0">\n';
				s += '  <head>\n';
				s += '    <title>voterunner - ' + escapeHTML(topic) + '</title>\n';
				s += '    <dateCreated>' + escapeHTML(new Date().toString()) + '</dateCreated>\n'
				s += '  </head>\n';
				s += '  <body>\n';
				s += opml(tree, '    ');
				s += '  </body>\n';
				s += '</opml>';
			} else {
				for (var i=0; i<tree.length; i++) {
					s += indent + '<outline';
					s += tree[i].id ? ' id="' + escapeHTML(tree[i].id) + '"' : '';
					s += tree[i].name ? ' name="' + escapeHTML(tree[i].name) + '"' : '';
					s += tree[i].comment ? ' text="' + escapeHTML(tree[i].comment) + '"' : '';
					s += '>\n'
					s += opml(tree[i].followers, indent + '  ');
					s += indent + '</outline>\n';
				}
			}
			return s;
		}

		res.send(opml(tree));
	});
});

// app view
app.get('/:topic/:id?', function (req, res) {
	var topic = req.params.topic;

	if (req.params.id) {
		if (req.params.id === 'clear') {
			res.clearCookie('id');
		} else {
			res.cookie('id', req.params.id);
		}
	}

	var sql = 'SELECT id, name, comment, delegate FROM nodes WHERE topic = $1';
	db.query(sql, [topic], function(err, result) {
		if (err) return res.status(500).send(err.toString());
		tpl('app.html', {'nodes': result.rows, 'topic': topic}, res);
	});
});

// socket.io
io.sockets.on('connection', function (socket) {
	var topic;
	var id;

	var ensureNode = function(fn) {
		// fn will be called with an err objects as first parameter if this node
		// already exists
		db.query("INSERT INTO nodes (topic, id) VALUES ($1, $2)", [topic, id], fn);
	};

	function handleMsg(action, sql, v1, v2) {
		ensureNode(function() {
			log.debug("Handeling:", action, topic, id, v1, v2);
			io.to(topic).emit(action, id, v1, v2);

			if (typeof(sql) === 'string') sql = [sql];
			for (var i=0; i<sql.length; i++) {
				var params = [topic, id];
				var n = sql[i].match(/\$/g).length;
				if (n >= 3) params.push(v1);
				if (n >= 4) params.push(v2);

				db.query(sql[i], params, throwErr);
			}
		});
	}

	socket.on('register', function(_topic, _id) {
		log.debug("Registration:", _topic, _id);

		topic = _topic;
		id = _id;
		socket.join(topic, function(err) {
			if (err) {
				log.error(err);
			}
		});
	});

	socket.on('createNode', function(fn) {
		var sql = "INSERT INTO nodes (topic, id) VALUES ($1, $2)";
		log.debug("Handeling:", 'createNode', topic, id);
		io.to(topic).emit('createNode', id);
		db.query(sql, [topic, id], fn); // not possible with handleMsg()
	});
	socket.on('rmNode', function() {
		var sql = [
			"UPDATE nodes SET delegate = null WHERE topic = $1 AND delegate = $2",
			"DELETE FROM nodes WHERE topic = $1 AND id = $2"
		];
		handleMsg('rmNode', sql);
	});
	socket.on('setNodeName', function(name) {
		var sql = "UPDATE nodes SET name = $3 WHERE topic = $1 AND id = $2";
		handleMsg('setNodeName', sql, name);
	});
	socket.on('setNodeComment', function(comment) {
		var sql = "UPDATE nodes SET comment = $3 WHERE topic = $1 AND id = $2";
		handleMsg('setNodeComment', sql, comment);
	});
	socket.on('setDelegate', function(delegate) {
		var sql = "UPDATE nodes SET delegate = $3 WHERE topic = $1 AND id = $2";
		handleMsg('setDelegate', sql, delegate);
	});
	socket.on('rmDelegate', function() {
		var sql = "UPDATE nodes SET delegate = null WHERE topic = $1 AND id = $2";
		handleMsg('rmDelegate', sql);
	});
});
