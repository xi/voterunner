voterunner
==========

Voterunner combines public [delegated
voting](https://en.wikipedia.org/wiki/Liquid_democracy) with real-time
communication inspired by [etherpad](http://etherpad.org/). While this
concept is not perfect for every situation it is beautiful in its
simplicity.

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

Once everyone agrees on a single proposal you not only have a decision
but also a record of all the little arguments that lead you there.

Limitations
-----------

This uses a very simple [via](https://github.com/xi/via) backend which
comes with a set of limitations:

-	No protection against manipulation (but users can verify their own
	votes)
-	No protection against data loss
-	No builtin authentication
-	All data will be deleted after 2 weeks of inactivity

Development
-----------

You will need to install [sassc](https://github.com/sass/sassc) and
[browserify](https://www.npmjs.com/package/browserify). Once these
requirements are met, you can simply run `make` to build all files.
