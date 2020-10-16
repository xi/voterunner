voterunner
==========

what is this?
-------------

This app tries to allow for quick and dirty votes and discussions. It is
basically the core concept behind
[votorolla](http://zelea.com/project/votorola/home.xht) mixed with the
interface of [etherpad](http://etherpad.org/). Technically, it is a lot
of client side code using a [via](https://github.com/xi/via) server.

The voting mechanism
--------------------

Votorolla is a complex liquid democracy project. But the core idea is
simple:

Every opinion is a node in a tree. At first, there are no edges at all.
So people start to explain why their opinion is the one to choose. When
you see some convincing argument you can *support* that node (*delegate
your vote*).

After a while it becomes clear which competing positions exist and which
arguments are important. The whole discussion is conserved in the graph.
You can go on discussing until you reach a consensus.

While this concept is not perfect for every situation it is beautiful
in its simplicity.

How to use it
-------------

*One goal of voterunner is to experiment with this concept in practice.
Since I really just wrote it the following section is more or less
fiction.*

Your group needs to make a decision, but doing this on a mailinglist
would definitely get messy. So instead you create a discussion on
voterunner simply by typing
`https://voterunner.example.com/#your-topic` into the address bar of
your browser.

You are lazy, right? So of course you want the group to make the right
decision but you don't want to do the whole discussion thing yourself.
So you will delegate your vote.

Now you can concentrate on convincing those who have not already
delegated their votes to support you. You may also try to steer the one
you support in the right direction.

To achieve this you work on your arguments. Try to address counter
arguments and be as precise as possible. Remember that you are a node in
a graph so you don't need to repeat everything your supporters already
said. Just make your own point very clear.

But maybe you even have an innovative idea. In that case you may revoke
the delegation. Now you compete directly with other ideas. Maybe you can
convince others, but maybe you should delegate your vote again in order
to agree on a compromise.

Development
-----------

You will need to install [sassc](https://github.com/sass/sassc) and
[browserify](https://www.npmjs.com/package/browserify). Once these
requirements are met, you can simply run `make` to build all files.
