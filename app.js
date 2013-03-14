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
	// embed `data` as json in a template
	fs.readFile('tpl/'+file, 'utf8', function(err, html) {
		html = html.replace(/<% ([^>]*) %>/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return '<data id="json-' + key + '">' + JSON.stringify(data[key]) + '</data>';
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

// welcome view
app.get('/', function (req, res) {
	markdown('README.md', res);
});

// app view
app.get('/:topic/', function (req, res) {
	var topic = req.params.topic;

	var sql = 'SELECT id, name, comment, delegate FROM nodes WHERE topic = $1';
	query(sql, [topic], function(nodes) {
		var sql = 'SELECT id, text, t FROM chat WHERE topic = $1 ORDER BY t ASC';
		query(sql, [topic], function(chat) {
			tpl('app.html', {'nodes': nodes, 'chat': chat}, res);
		});
	});
});

// socket.io
io.sockets.on('connection', function (socket) {
	socket.on('topic', function(topic) {
		socket.set('topic', topic);
		socket.join(topic);
	});

	function handleMsg(action, sql, id, v1, v2) {
		log.debug("Handeling " + action, id, v1, v2);

		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit(action, id, v1, v2);

			var params = [topic, id];
			var n = sql.match(/\$/g).length;
			if (n >= 3) params.push(v1);
			if (n >= 4) params.push(v2);

			query(sql, params);
		});
	}

	socket.on('createNode', function(id) {
		var sql = "INSERT INTO nodes (topic, id, name, comment, delegate) VALUES ($1, $2, 'anonymous', '', '')";
		handleMsg('createNode', sql, id);
	});
	socket.on('rmNode', function(id) {
		var sql = "DELETE FROM nodes WHERE topic = $1 AND id = $2";
		handleMsg('rmNode', sql, id);
	});
	socket.on('setNodeName', function(id, name) {
		var sql = "UPDATE nodes SET name = $3 WHERE topic = $1 AND id = $2";
		handleMsg('setNodeName', sql, id, name);
	});
	socket.on('setNodeComment', function(id, comment) {
		var sql = "UPDATE nodes SET comment = $3 WHERE topic = $1 AND id = $2";
		handleMsg('setNodeComment', sql, id, comment);
	});
	socket.on('setDelegate', function(id, delegate) {
		var sql = "UPDATE nodes SET delegate = $3 WHERE topic = $1 AND id = $2";
		handleMsg('setDelegate', sql, id, delegate);
	});
	socket.on('rmDelegate', function(id) {
		var sql = "UPDATE nodes SET delegate = '' WHERE topic = $1 AND id = $2";
		handleMsg('rmDelegate', sql, id);
	});
	socket.on('chat', function(id, text, t) {
		var sql = "INSERT INTO chat (topic, id, text, t) VALUES ($1, $2, $3, $4)";
		handleMsg('chat', sql, id, text, t);
	});
});
