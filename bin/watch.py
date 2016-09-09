#!/usr/bin/env python

# install dependencies via `pip install -r watch_requirements.txt`
# install browser extension from http://livereload.com/extensions/

from __future__ import print_function

from livereload import Server, shell
import formic

EXCLUDES = ['**/vendor/**', '**/node_modules/**', '**/data/**']
UNCOMPILED_FILES = formic.FileSet(include=['**.css', '**.html', '**.md'], exclude=EXCLUDES)
JS_APP_FILES = formic.FileSet(include=['**.js'], exclude=EXCLUDES +['/app.js', '/static/voterunner.js'])
COMBINED_JS_APP_FILES = formic.FileSet(include=['/static/voterunner.js'])
NODE_APP_FILES = formic.FileSet(include=['app.js'])
SCSS_FILES = formic.FileSet(include=['**.scss'], exclude=EXCLUDES)
CSS_FILES = formic.FileSet(include=['**.css'], exclude=EXCLUDES)

server = Server()

def watch(file_set, shell_command=None, delay=None):
    for path in file_set:
        server.watch(path, shell_command, delay=delay)

def show(file_set):
    map(print, file_set)

show(NODE_APP_FILES)

watch(JS_APP_FILES, shell('echo FIXME: how does the combining work? dependency missing?'), delay='forever')
watch(COMBINED_JS_APP_FILES)
watch(UNCOMPILED_FILES)
watch(SCSS_FILES, shell('echo FIXME: which scss compilere shold be used? dependency missing?'), delay='forever')
watch(CSS_FILES)

shell('pg_ctl start -w -D data/postgres -o "-h localhost" -l /dev/null')()

import os
SERVER_SETTINGS = dict(
    PORT='5000',
    DATABASE_URL='postgresql://%s:@localhost/voterunner' % os.environ['USER'],
)
ENV = ' '.join(map('='.join, SERVER_SETTINGS.items()))
NODE_COMMAND = shell('killall node; %(ENV)s nohup node app.js > /dev/null 2>&1 &' % locals(), shell='/bin/sh')
NODE_COMMAND()
watch(NODE_APP_FILES, NODE_COMMAND, delay=1)

server.serve(liveport=35729)

# shell('pg_ctl stop -D data/postgres')()
# shell('killall node')()
