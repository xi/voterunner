/*
 * voterunner - quick and dirty votes and discussions
 *
 * copyright: 2013 Tobias Bengfort <tobias.bengfort@gmx.net>
 * license: AGPL-3+
 * url: http://voterunner.herokuapp.com/
 */

var url = require('url');
var process = require('process');

var express = require('express');
var http = require('http');
var app = express();
var server = http.Server(app);
var io = require('socket.io').listen(server);
var anyDB = require('any-db');
var fs = require('fs');
var log4js = require('log4js');
var MarkdownIt = require('markdown-it');

var DATABASE_URL = process.env.DATABASE_URL;
var SQLITE = DATABASE_URL.match(/^sqlite/);
var PORT = process.env.PORT || 5000;
var HOST = process.env.HOST || 'localhost';

var log = log4js.getLogger();
var md = new MarkdownIt();

app.use(express.static('static'));
server.listen(PORT, HOST, function() {
	log.info('Listening on ' + HOST + ':' + PORT);
});

var db = anyDB.createPool(DATABASE_URL, {
	max: SQLITE ? 1 : 10,
});
process.on('exit', (code) => {
	db.close();
});

var queryDB = function(sql, data) {
	if (SQLITE) {
		sql = sql.replace(/\$/g, '?');
	}

	return new Promise(function(resolve, reject) {
		var q = db.query(sql, data, function(err, res) {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
		});
	});
};

// setup table
queryDB('CREATE TABLE IF NOT EXISTS nodes (topic TEXT, id TEXT, name TEXT, comment TEXT, delegate TEXT, UNIQUE (topic, id))');

var escapeHTML = function(unsafe) {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
};

var tpl = function(file, data, res) {
	fs.readFile('tpl/' + file, 'utf8', function(err, html) {
		html = html.replace(/{{{ ([^}]*)\|markdown }}}/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return md.render(data[key]);
			} else {
				return '';
			}
		});

		html = html.replace(/{{ ([^}]*)\|json }}/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return '<div id="json-' + escapeHTML(key) + '" data-value="' + escapeHTML(JSON.stringify(data[key])) + '"></div>';
			} else {
				return '';
			}
		});

		html = html.replace(/{{ ([^}]*) }}/g, function(match, key) {
			if (data.hasOwnProperty(key)) {
				return escapeHTML(data[key].toString());
			} else {
				return '';
			}
		});

		res.send(html);
	});
};


// welcome view
app.get('/', function(req, res) {
	fs.readFile('README.md', 'utf8', function(err, markdown) {
		tpl('markdown.html', {'markdown': markdown}, res);
	});
});

// json state
app.get('/:topic.json', function(req, res) {
	var topic = req.params.topic;
	var sql = 'SELECT id, name, comment, delegate FROM nodes WHERE topic = $1';

	queryDB(sql, [topic]).then(function(result) {
		res.json(result.rows);
	}).catch(function(err) {
		res.status(500).send(err.toString());
	});
});

// app view
app.get('/:topic/:id?', function(req, res) {
	var topic = req.params.topic;

	var sql = 'SELECT id, name, comment, delegate FROM nodes WHERE topic = $1';
	queryDB(sql, [topic]).then(function(result) {
		tpl('app.html', {'nodes': result.rows, 'topic': topic}, res);
	}).catch(function(err) {
		res.status(500).send(err.toString());
	});
});

// socket.io
io.sockets.on('connection', function(socket) {
	var topic;
	var id;

	var handleMsg = function(action, sql, v1, v2) {
		// make sure that node exists, ignore error
		return queryDB('INSERT INTO nodes (topic, id) VALUES ($1, $2)', [topic, id]).catch(function() {
			return;
		}).then(function() {
			log.debug('Handeling:', action, topic, id, v1, v2);
			io.to(topic).emit(action, id, v1, v2);

			if (typeof(sql) === 'string') {
				sql = [sql];
			}

			return Promise.all(sql.map(function(s) {
				var params = [topic, id];
				var n = s.match(/\$/g).length;
				if (n >= 3) params.push(v1);
				if (n >= 4) params.push(v2);

				return queryDB(s, params);
			}));
		});
	};

	socket.on('register', function(_topic, _id) {
		log.debug('Registration:', _topic, _id);

		topic = _topic;
		id = _id;
		socket.join(topic, function(err) {
			if (err) {
				log.error(err);
			}
		});
	});

	socket.on('rmNode', function() {
		var sql = [
			'UPDATE nodes SET delegate = null WHERE topic = $1 AND delegate = $2',
			'DELETE FROM nodes WHERE topic = $1 AND id = $2',
		];
		handleMsg('rmNode', sql);
	});
	socket.on('setNodeName', function(name) {
		var sql = 'UPDATE nodes SET name = $3 WHERE topic = $1 AND id = $2';
		handleMsg('setNodeName', sql, name);
	});
	socket.on('setNodeComment', function(comment) {
		var sql = 'UPDATE nodes SET comment = $3 WHERE topic = $1 AND id = $2';
		handleMsg('setNodeComment', sql, comment);
	});
	socket.on('setDelegate', function(delegate) {
		var sql = 'UPDATE nodes SET delegate = $3 WHERE topic = $1 AND id = $2';
		handleMsg('setDelegate', sql, delegate);
	});
	socket.on('rmDelegate', function() {
		var sql = 'UPDATE nodes SET delegate = null WHERE topic = $1 AND id = $2';
		handleMsg('rmDelegate', sql);
	});

	socket.on('testClear', function(done) {
		if (topic.substr(0, 4) === 'test') {
			log.debug('Handeling:', 'testClear', topic);
			queryDB("DELETE FROM nodes WHERE topic = $1", [topic]).then(done);
		} else {
			done();
		}
	});
});
