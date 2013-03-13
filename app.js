// requires socket.io and sqlite3 and express

var express = require('express')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , sqlite3 = require('sqlite3').verbose()
  , db = new sqlite3.Database('db.sqlite')
  , fs = require('fs')
  , log = io.log;

var port = process.env.PORT || 5000;
app.listen(port, function() {
	log.info("Listening on " + port);
});
app.use(express.static('static'));

db.run("CREATE TABLE IF NOT EXISTS state (topic TEXT, id TEXT, name TEXT, comment TEXT, delegate TEXT, UNIQUE (topic, id))");
db.run("CREATE TABLE IF NOT EXISTS chat (topic TEXT, id TEXT, text TEXT, t INTEGER)");

// routes
function markdown(file, res) {
	fs.readFile('markdown.html', 'utf8', function(err, html) {
		fs.readFile(file, 'utf8', function(err, markdown) {
			res.send(html.replace('<data/>', markdown));
		});
	});
}

app.get('/', function (req, res) {
	markdown('README.md', res);
});

app.get('/:topic/', function (req, res) {
	res.sendfile('app.html');
});

// socket.io
io.sockets.on('connection', function (socket) {
	socket.on('topic', function(topic) {
		socket.set('topic', topic);
		socket.join(topic);
	});

	socket.on('getState', function() {
		socket.get('topic', function(err, topic) {
			db.all('SELECT * FROM state WHERE topic = :topic', {':topic': topic}, function(err, data) {
				socket.emit('state', {'nodes': data});
			});
			db.all('SELECT * FROM chat WHERE topic = :topic ORDER BY t ASC', {':topic': topic}, function(err, data) {
				socket.emit('state', {'chat': data});
			});
		});
	});

	socket.on('createNode', function(id) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('createNode', id);
			var sql = "INSERT INTO state (id, name, comment, delegate, topic) VALUES (:id, 'anonymous', '', '', :topic)";
			db.run(sql, {':id': id, ':topic': topic}, function(err) {
				if (err) {
					log.warn("failed to apply `createNode` to state:", err.toString());
				}
			});
		});
	});
	socket.on('rmNode', function(id) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('rmNode', id);
			var sql = "DELETE FROM state WHERE id = :id AND topic = :topic";
			db.run(sql, {':id': id, ':topic': topic});
		});
	});
	socket.on('setNodeName', function(id, name) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('setNodeName', id, name);
			var sql = "UPDATE state SET name = :name WHERE id = :id AND topic = :topic";
			db.run(sql, {':id': id, ':name': name, ':topic': topic});
		});
	});
	socket.on('setNodeComment', function(id, comment) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('setNodeComment', id, comment);
			var sql = "UPDATE state SET comment = :comment WHERE id = :id AND topic = :topic";
			db.run(sql, {':id': id, ':comment': comment, ':topic': topic});
		});
	});
	socket.on('setDelegate', function(id, delegate) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('setDelegate', id, delegate);
			var sql = "UPDATE state SET delegate = :delegate WHERE id = :id AND topic= :topic";
			db.run(sql, {':id': id, ':v': delegate, ':topic': topic});
		});
	});
	socket.on('rmDelegate', function(id) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('rmDelegate', id);
			var sql = "UPDATE state SET delegate = '' WHERE id = :id AND topic = :topic";
			db.run(sql, {':id': id, ':topic': topic});
		});
	});
	socket.on('chat', function(id, text, t) {
		socket.get('topic', function(err, topic) {
			socket.broadcast.to(topic).emit('chat', id, text, t);
			var sql = "INSERT INTO chat (topic, id, text, t) VALUES (:topic, :id, :text, :t)";
			db.run(sql, {':topic': topic, ':id': id, ':text': text, ':t': t});
		});
	});
});
