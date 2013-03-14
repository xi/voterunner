// requires socket.io and sqlite3 and express

var express = require('express')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , pg = require('pg')
  , fs = require('fs')
  , log = io.log;

var port = process.env.PORT || 5000;
app.listen(port, function() {
	log.info("Listening on " + port);
});
app.use(express.static('static'));

// routes
function markdown(file, res) {
	fs.readFile('tpl/markdown.html', 'utf8', function(err, html) {
		fs.readFile(file, 'utf8', function(err, markdown) {
			res.send(html.replace('<data/>', markdown));
		});
	});
}

app.get('/', function (req, res) {
	markdown('README.md', res);
});

app.get('/:topic/', function (req, res) {
	res.sendfile('tpl/app.html');
});

pg.connect(process.env.DATABASE_URL, function(err, db) {
	if (err) {
		log.error(err);
	} else {
		log.info('connected to database on ' + process.env.DATABASE_URL);
	}

	db.query("CREATE TABLE IF NOT EXISTS state (topic TEXT, id TEXT, name TEXT, comment TEXT, delegate TEXT, UNIQUE (topic, id))");
	db.query("CREATE TABLE IF NOT EXISTS chat (topic TEXT, id TEXT, text TEXT, t INTEGER)");

	// socket.io
	io.sockets.on('connection', function (socket) {
		socket.on('topic', function(topic) {
			socket.set('topic', topic);
			socket.join(topic);
		});

		socket.on('getState', function() {
			socket.get('topic', function(err, topic) {
				db.query('SELECT * FROM state WHERE topic = $1', [topic], function(err, result) {
					if (err) {
						log.warn('getState:state', err, result);
					} else {
						socket.emit('state', {'nodes': result.rows});
					}
				});
				db.query('SELECT * FROM chat WHERE topic = $1 ORDER BY t ASC', [topic], function(err, result) {
					if (err) {
						log.warn('getState:chat', err, result);
					} else {
						socket.emit('state', {'chat': result.rows});
					}
				});
			});
		});

		socket.on('createNode', function(id) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('createNode', id);
				var sql = "INSERT INTO state (id, name, comment, delegate, topic) VALUES ($1, 'anonymous', '', '', $2)";
				db.query(sql, [id, topic], function(err) {
					if (err) {
						log.warn("failed to apply `createNode` to state:", err.toString());
					}
				});
			});
		});
		socket.on('rmNode', function(id) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('rmNode', id);
				var sql = "DELETE FROM state WHERE id = $1 AND topic = $2";
				db.query(sql, [id, topic]);
			});
		});
		socket.on('setNodeName', function(id, name) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('setNodeName', id, name);
				var sql = "UPDATE state SET name = $3 WHERE id = $1 AND topic = $2";
				db.query(sql, [id, topic, name]);
			});
		});
		socket.on('setNodeComment', function(id, comment) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('setNodeComment', id, comment);
				var sql = "UPDATE state SET comment = $3 WHERE id = $1 AND topic = $2";
				db.query(sql, [id, topic, comment]);
			});
		});
		socket.on('setDelegate', function(id, delegate) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('setDelegate', id, delegate);
				var sql = "UPDATE state SET delegate = $3 WHERE id = $1 AND topic= $2";
				db.query(sql, [id, topic, delegate]);
			});
		});
		socket.on('rmDelegate', function(id) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('rmDelegate', id);
				var sql = "UPDATE state SET delegate = '' WHERE id = $1 AND topic = $2";
				db.query(sql, [id, topic]);
			});
		});
		socket.on('chat', function(id, text, t) {
			socket.get('topic', function(err, topic) {
				socket.broadcast.to(topic).emit('chat', id, text, t);
				var sql = "INSERT INTO chat (topic, id, text, t) VALUES ($2, $1, $3, $4)";
				db.query(sql, [id, topic, text, t]);
			});
		});
	});
});
