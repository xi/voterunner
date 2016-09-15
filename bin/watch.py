#!/usr/bin/env python

# install dependencies via `pip install -r watch_requirements.txt`
# install browser extension from http://livereload.com/extensions/

from __future__ import print_function

from livereload import Server, shell

UNCOMPILED_FILES = ['static/*.js', 'static/*.css', 'static/test/*', 'README.md']
JS_SRC_FILES = ['static/src/*.js']
CSS_SRC_FILES = ['static/scss/*.scss']

server = Server()


def watch(file_set, shell_command=None, delay=None):
    for path in file_set:
        server.watch(path, shell_command, delay=delay)


def show(file_set):
    map(print, file_set)


if __name__ == '__main__':
    watch(JS_SRC_FILES, shell('make static/voterunner.js static/markdown.js'))
    watch(CSS_SRC_FILES, shell('make static/style.css'))
    watch(UNCOMPILED_FILES)

    server.serve(liveport=35729)
