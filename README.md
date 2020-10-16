voterunner
==========

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
theory, not
[this](http://miriadna.com/desctopwalls/images/max/Fairy-forest.jpg)).
At first, there are no edges at all. So people start to explain why
their opinion is the one to choose. When you see some convincing
argument you can *follow* that node (*delegate your vote*).

After a while it becomes clear which competing positions exist and which
arguments are important. The whole discussion is conserved in the graph.
You can go on discussing until you reach a consensus.

While this concept is not perfect for every situation it is beautifull
in its simplicity.

How to use it
-------------

*One goal of voterunner is to experiment with this concept in practice.
Since I really just wrote it the following section is more or less
fiction.*

Your group needs to make a decision, but doing this on a mailinglist
would definitly get messy. So instead you create a discussion on
voterunner simply by typing
`http://voterunner.herokuapp.com/(your-topic)/` into the address bar of
your browser.

You are lazy, right? So of course you want the group to make the right
decision but you don’t want to do the whole discussion thing yourself.
So you will delegate your vote.

Now you can concentrate on convincing those who have not already
delegated their votes to follow you. You may also try to steer the one
you follow in the right direction.

To achieve this you work on your arguments. Try to address counter
arguments and be as precise as possible. Remember that you are a node in
a graph so you don’t need to repeat everything your followers already
said. Just make your own point very clear.

But maybe you even have an innovative idea. In that case you may revoke
the delegation. Now you compete directly with other ideas. Maybe you can
convince others, but maybe you should delegate your vote again in order
to agree on a compromise.

Install
-------

Voterunner is a [node.js](http://nodejs.org/) app using
[PostgreSQL](http://www.postgresql.org/) as a database so the following
lines will bring it up:

    $ git clone https://github.com/xi/voterunner
    $ cd voterunner
    $ npm install
    $ bin/manage_db.sh init
    $ bin/manage_db.sh start
    $ export DATABASE_URL="postgresql://:@localhost/voterunner"
    $ node app.js
        ... Listening on localhost:5000
    $ open http://localhost:5000/  # introduction
    $ open http://localhost:5000/my-topic/  # discuss on a topic

For development it may be nice to automatically restart the app and refresh the
browser whenever you make changes:

    $ pip install -r watch_requirements.txt
    $ bin/watch.py


Development
-----------

The repository contains all necessary compiled files. If you want to edit the
code yourself you will need to install [sassc](https://github.com/sass/sassc)
and [browserify](https://www.npmjs.com/package/browserify). Once these
requirements are met, you can simply run `make`.


API
---

This section is only important if you want to understand how voterunner
works. If you just plan to use it, skip this.

The communication is done using socket.io sockets.

    socket.emit(action, data1, data2, ...);
    socket.on(action, function(data1, data2, ...) {
      ...
    });

### Setup

These messages are used to set up the connection between client and
server:

`register(topic, id)`
:   register for id and topic. needs to be done before anything else.

### Change the Graph

These messages will be broadcasted to all sockets which are registered
to the same topic as the one emitting in. The emitting socket must omit
the id because it was already set when registering. If an action is performed
on a node that does not exist in the local copy, it must be created.

`rmNode([id])`
:   remove node `id` from the graph.

`setNodeName([id], name)`
:   set the name of node `id` to `name`

`setNodeComment([id], comment)`
:   set the comment of node `id` to `comment`

`setDelegate([id], id2)`
:   make node `id` follow node `id2`

`rmDelegate([id])`
:   make node `id` follow noone

License
-------

voterunner - quick and dirty votes and discussions \
Copyright (C) 2013 Tobias Bengfort <tobias.bengfort@gmx.net>

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at
your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
