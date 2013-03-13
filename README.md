# voterunner

## tl;dr

Try it on <http://voterunner.herokuapp.com/{your-topic}/>!

## what is this?

This app tries to allow for quick and dirty votes and discussions.

It is basically the concept behind [votorolla](http://zelea.com/project/votorola/home.xht)
mixed with the interface of [etherpad](http://etherpad.org/).
Technically, it is a lot of client side code with a bit of 
[socket.io](http://socket.io) magic on the server.

## Install

voterunner is a [node.js](http://nodejs.org/) app so the following lines will bring it up:

	$ git clone https://git.gitorious.org/electomat/voterunner.git
	$ cd voterunner
	$ npm install
	$ node app.js
	      info  - socket.io started
	      info  - Listening on 5000

## API

## License

voterunner - quick and dirty votes and discussions
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
