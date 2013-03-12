// requires socket.io and sqlite3 and express

var express = require('express')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , sqlite3 = require('sqlite3').verbose()
  , db = new sqlite3.Database('public/db.sqlite');


app.listen(8000);
app.use(express.static('static'))

db.run("CREATE TABLE IF NOT EXISTS state (id TEXT UNIQUE, name TEXT, comment TEXT, delegate TEXT)");
db.run("CREATE TABLE IF NOT EXISTS chat (id TEXT, text TEXT)");


// routes
app.get('/', function (req, res) {
  res.sendfile('tpl/app.htm');
});

app.get('/state/', function (req, res) {
	var sql = 'SELECT * FROM state';
	db.all(sql, function(err, data) {
		res.json(data);
	});
});

app.get('/chat/', function (req, res) {
	var sql = 'SELECT * FROM chat';
	db.all(sql, function(err, data) {
		res.json(data);
	});
});


// socket.io
io.sockets.on('connection', function (socket) {
	socket.on('createNode', function(data) {
		socket.broadcast.emit('createNode', data);
		db.run("INSERT INTO state (id, name, comment, delegate) VALUES (:id, 'anonymous', '', '')", {':id': data.id});
	});
	socket.on('rmNode', function(data) {
		socket.broadcast.emit('rmNode', data);
		db.run("DELETE FROM state WHERE id = :id", {':id': data.id});
	});
	socket.on('setNodeName', function(data) {
		socket.broadcast.emit('setNodeName', data);
		db.run("UPDATE state SET name = :v WHERE id = :id", {':id': data.id, ':v': data.v});
	});
	socket.on('setNodeComment', function(data) {
		socket.broadcast.emit('setNodeComment', data);
		db.run("UPDATE state SET comment = :v WHERE id = :id", {':id': data.id, ':v': data.v});
	});
	socket.on('setDelegate', function(data) {
		socket.broadcast.emit('setDelegate', data);
		db.run("UPDATE state SET delegate = :v WHERE id = :id", {':id': data.id, ':v': data.v});
	});
	socket.on('rmDelegate', function(data) {
		socket.broadcast.emit('rmDelegate', data);
		db.run("UPDATE state SET delegate = '' WHERE id = :id", {':id': data.id});
	});
	socket.on('chat', function(data) {
		socket.broadcast.emit('chat', data);
		db.run("INSERT INTO chat (id, text) VALUES (:id, :v)", {':id': data.id, ':v': data.v});
	});
});
