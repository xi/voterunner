/*
 * voterunner - quick and dirty votes and discussions
 *
 * copyright: 2013 Tobias Bengfort <tobias.bengfort@gmx.net>
 * license: AGPL-3+
 * url: http://voterunner.herokuapp.com/
 */

var express = require('express')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , pg = require('pg')
  , fs = require('fs')
  , log = io.log // nicer log
  , conString = process.env.DATABASE_URL
  , port = process.env.PORT || 5000;

app.listen(port, function() {
	log.info("Listening on " + port);
});
app.use(express.static('static'));

// helpers
function query(sql, params, fn) {
	pg.connect(conString, function(err, db) {
		if (err) {
			log.warn("error on db connect", err.toString());
		} else {
			db.query(sql, params, function(err, result) {
				if (err) {
					log.warn("db error:", err.toString());
				} else {
					if (fn) fn(result.rows);
				}
			});
		}
	});
}

function tpl(file, data, res) {
	// `<% key %>` in template `file` will be replaced by `data.key` as json
	// `<= key =>` in template `file` will be replaced by `data.key` as string
	fs.readFile('tpl/'+file, 'utf8', function(err, html) {
		html = html.replace(/<% ([^>]*) %>/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return '<data id="json-' + key + '">' + JSON.stringify(data[key]) + '</data>';
			} else {
				return '';
			}
		});

		html = html.replace(/<= ([^>]*) =>/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return data[key].toString();
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

// setup tables
query("CREATE TABLE IF NOT EXISTS nodes (topic TEXT, id TEXT, name TEXT, comment TEXT, delegate TEXT, UNIQUE (topic, id))");
query("CREATE TABLE IF NOT EXISTS chat (topic TEXT, id TEXT, text TEXT, t INTEGER)");
query("CREATE TABLE IF NOT EXISTS online (topic TEXT, id TEXT, UNIQUE (topic, id))");

// welcome view
app.get('/', function (req, res) {
	markdown('README.md', res);
});

// json state
app.get('/:topic/json/', function(req, res) {
	var topic = req.params.topic;
	var sql = "SELECT id, name, comment, delegate FROM nodes WHERE topic = $1";

	query(sql, [topic], function(tree) {
		res.json(tree);
	});
});

// opml state
app.get('/:topic/opml/', function(req, res) {
	var topic = req.params.topic;
	var sql = "SELECT id, name, comment, delegate FROM nodes WHERE topic = $1";

	query(sql, [topic], function(tree) {
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
				s += '    <title>voterunner - ' + topic + '</title>\n';
				s += '    <dateCreated>' + new Date() + '</dateCreated>\n'
				s += '  </head>\n';
				s += '  <body>\n';
				s += opml(tree, '    ');
				s += '  </body>\n';
				s += '</opml>';
			} else {
				for (var i=0; i<tree.length; i++) {
					s += indent + '<outline';
					s += tree[i].id ? ' id="'+tree[i].id+'"' : '';
					s += tree[i].name ? ' name="'+tree[i].name+'"' : '';
					s += tree[i].comment ? ' text="'+tree[i].comment+'"' : '';
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
		res.cookie('id', req.params.id);
	}

	var sql = 'SELECT id, name, comment, delegate FROM nodes WHERE topic = $1';
	query(sql, [topic], function(nodes) {
		var sql = 'SELECT id, text, t FROM chat WHERE topic = $1 ORDER BY t ASC';
		query(sql, [topic], function(chat) {
			var sql = 'SELECT id FROM online WHERE topic = $1';
			query(sql, [topic], function(online) {
				tpl('app.html', {'nodes': nodes, 'chat': chat, 'online': online, 'topic': topic}, res);
			});
		});
	});
});

// socket.io
io.sockets.on('connection', function (socket) {
	function handleMsg(action, sql, v1, v2) {
		socket.get('topic', function(err, topic) {
			socket.get('id', function(err, id) {
				log.debug("Handeling:", action, topic, id, v1, v2);

				socket.broadcast.to(topic).emit(action, id, v1, v2);

				if (typeof(sql) === 'string') sql = [sql];
				for (var i=0; i<sql.length; i++) {
					var params = [topic, id];
					var n = sql[i].match(/\$/g).length;
					if (n >= 3) params.push(v1);
					if (n >= 4) params.push(v2);

					query(sql[i], params);
				}
			});
		});
	}

	socket.on('register', function(topic, id) {
		log.debug("Registration:", topic, id);

		socket.set('topic', topic);
		socket.set('id', id);
		socket.join(topic);

		var sql = "INSERT INTO online (topic, id) VALUES ($1, $2)";
		handleMsg('online', sql);
	});
	socket.on('disconnect', function() {
		var sql = "DELETE FROM online WHERE topic = $1 AND id = $2";
		handleMsg('offline', sql);
	});

	socket.on('createNode', function() {
		var sql = "INSERT INTO nodes (topic, id) VALUES ($1, $2)";
		handleMsg('createNode', sql);
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
	socket.on('chat', function(text, t) {
		var sql = "INSERT INTO chat (topic, id, text, t) VALUES ($1, $2, $3, $4)";
		handleMsg('chat', sql, text, t);
	});
});
