voterunner
==========

tl;dr
-----

[Try it!](http://voterunner.herokuapp.com/{your-topic}/)

what is this?
-------------

This app tries to allow for quick and dirty votes and discussions. It is
basically the core concept behind
[votorolla](http://zelea.com/project/votorola/home.xht) mixed with the
interface of [etherpad](http://etherpad.org/). Technically, it is a lot
of client side code with a bit of [socket.io](http://socket.io) magic on
the server.

The voting mechanism
--------------------

Votorolla is a complex liquid democracy project. But the core idea is
simple:

Every Person is a node in a forest (the disjoint union of trees in graph
theory, not [this](http://miriadna.com/desctopwalls/images/max/Fairy-forest.jpg)).
At first, there are no edges at all. So people start to explain why
their opinion is the one to choose. When you see some convincing
argument you can *follow* that node (*delegate your vote*).

After a while it becomes clear which competing positions exist and which
arguments are important. The whole discussion is conserved in the graph.
You can go on discussing until you reach a consensus.

While this concept is not perfect for every situation it is beautifull 
in its simplicity.

Install
-------

voterunner is a [node.js](http://nodejs.org/) app so the following lines
will bring it up:

```.shell
$ git clone https://git.gitorious.org/electomat/voterunner.git
$ cd voterunner
$ npm install
$ node app.js
      info  - socket.io started
      info  - Listening on 5000
```

API
---

This section is only important if you want to understand how voterunner
works. If you just plan to use it, skip this.

The communication is done using socket.io sockets.

    socket.emit(action, data1, data2, ...);
    socket.on(action, function(data1, data2, ...) {
      ...
    });

### setup

These messages are used to set up the connection between client and
server:

`topic(topic)`
:   register for a topic. needs to be done before anything else.

`getState()`
:   request current state from server (this is done by clients on
    connection)

`state(data)`
:   answer to `getState`. `data` may optionally have the properties
    `data.nodes` and `data.chat`, e.g.

        data = {
            "nodes": [{
                "id": "8mmxndo8da",
                "name": "max",
                "comment": "smoking is unhealthy",
                "delegate": "k6gsn1hlsh"
            },{
                "id": "k6gsn1hlsh",
                "name": "alice",
                "comment": "everyone is free to do what she wants",
                "delegate": ""
            }],
            "chat": [{
                "id": "8mmxndo8da",
                "text": "@alice I guess you are right."
            }]
        }

### change the Graph

These messages will be broadcasted to all sockets which are registered
to the same topic as the one emitting in:

`createNode(id)`
:   add node `id` to the graph

`rmNode(id)`
:   remove node `id` from the graph.

`setNodeName(id, name)`
:   set the name of node `id` to `name`

`setNodeComment(id, comment)`
:   set the comment of node `id` to `comment`

`setDelegate(id, new)`
:   make node `id` follow node `new`

`rmDelegate(id)`
:   make node `id` follow noone

`chat(id, text)`
:   add the chat message `text` by `id`

License
-------

voterunner - quick and dirty votes and discussions \
Copyright (C) 2013  Tobias Bengfort <tobias.bengfort@gmx.net>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
