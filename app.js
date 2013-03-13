// requires socket.io and sqlite3 and express

var express = require('express')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , sqlite3 = require('sqlite3').verbose()
  , db = new sqlite3.Database('public/db.sqlite');


app.listen(8001);
app.use(express.static('static'));

db.run("CREATE TABLE IF NOT EXISTS state (topic TEXT, id TEXT, name TEXT, comment TEXT, delegate TEXT, UNIQUE (topic, id))");
db.run("CREATE TABLE IF NOT EXISTS chat (topic TEXT, id TEXT, text TEXT)");


// routes
app.get('/', function (req, res) {
	res.sendfile('tpl/welcome.htm');
});

app.get('/:topic/', function (req, res) {
	res.sendfile('tpl/app.htm');
});

app.get('/:topic/state/', function (req, res) {
	var sql = 'SELECT * FROM state WHERE topic = ' + req.params.topic;
	db.all(sql, function(err, data) {
		res.json(data);
	});
});

app.get('/:topic/chat/', function (req, res) {
	var sql = 'SELECT * FROM chat WHERE topic = ' + req.params.topic;
	db.all(sql, function(err, data) {
		res.json(data);
	});
});


// socket.io
io.sockets.on('connection', function (socket) {
	socket.on('createNode', function(data) {
		socket.broadcast.emit('createNode', data);
		var sql = "INSERT INTO state (id, name, comment, delegate, topic) VALUES (:id, 'anonymous', '', '', :topic)";
		db.run(sql, {':id': data.id, ':topic': data.topic}, function(err) {
			if (err) {
				console.warn("failed to apply `createNode` to state:", data, err.toString());
			}
		});
	});
	socket.on('rmNode', function(data) {
		socket.broadcast.emit('rmNode', data);
		var sql = "DELETE FROM state WHERE id = :id AND topic = :topic";
		db.run(sql, {':id': data.id, ':topic': data.topic});
	});
	socket.on('setNodeName', function(data) {
		socket.broadcast.emit('setNodeName', data);
		var sql = "UPDATE state SET name = :v WHERE id = :id AND topic = :topic";
		db.run(sql, {':id': data.id, ':v': data.v, ':topic': data.topic});
	});
	socket.on('setNodeComment', function(data) {
		socket.broadcast.emit('setNodeComment', data);
		var sql = "UPDATE state SET comment = :v WHERE id = :id AND topic = :topic";
		db.run(sql, {':id': data.id, ':v': data.v, ':topic': data.topic});
	});
	socket.on('setDelegate', function(data) {
		socket.broadcast.emit('setDelegate', data);
		var sql = "UPDATE state SET delegate = :v WHERE id = :id AND topic= :topic";
		db.run(sql, {':id': data.id, ':v': data.v, ':topic': data.topic});
	});
	socket.on('rmDelegate', function(data) {
		socket.broadcast.emit('rmDelegate', data);
		var sql = "UPDATE state SET delegate = '' WHERE id = :id AND topic = :topic";
		db.run(sql, {':id': data.id, ':topic': data.topic});
	});
	socket.on('chat', function(data) {
		socket.broadcast.emit('chat', data);
		var sql = "INSERT INTO chat (id, text, topic) VALUES (:id, :text, :topic)";
		db.run(sql, {':id': data.id, ':text': data.v, ':topic': data.topic});
	});
});
