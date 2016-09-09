#!/usr/bin/env python

# install dependencies via `pip install -r watch_requirements.txt`
# install browser extension from http://livereload.com/extensions/

from __future__ import print_function

from livereload import Server, shell
import formic

EXCLUDES = ['**/vendor/**', '**/node_modules/**', '**/data/**']
UNCOMPILED_FILES = formic.FileSet(include=['**.js', '**.css', '**.html', '**.md'], exclude=EXCLUDES + ['/app.js'])
UNCOMPILED_FILES_REQUIRING_SERVER_RESTART = formic.FileSet(include=['/app.js'], exclude=EXCLUDES)

server = Server()

def watch(file_set, shell_command=None, delay=None):
    for path in file_set:
        server.watch(path, shell_command, delay=delay)

def show(file_set):
    map(print, file_set)

# show(UNCOMPILED_FILES_REQUIRING_SERVER_RESTART)
watch(UNCOMPILED_FILES)


shell('pg_ctl start -w -D data/postgres -o "-h localhost" -l /dev/null')()

import os
SERVER_SETTINGS = dict(
    PORT='5000',
    DATABASE_URL='postgresql://%s:@localhost/voterunner' % os.environ['USER'],
)
ENV = ' '.join(map('='.join, SERVER_SETTINGS.items()))
NODE_COMMAND = shell('killall node; %(ENV)s nohup node app.js > /dev/null 2>&1 &' % locals(), shell='/bin/sh')
NODE_COMMAND()
watch(UNCOMPILED_FILES_REQUIRING_SERVER_RESTART, NODE_COMMAND, delay=1)

server.serve(liveport=35729)

# shell('pg_ctl stop -D data/postgres')()
shell('killall node')
