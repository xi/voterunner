#!/bin/sh

cd "$(dirname "$0")/.."
mkdir -p data/postgres
if test ! -d  data/postgres/base; then
	pg_ctl initdb -D data/postgres
	pg_ctl start -w -D data/postgres -o "-h localhost"
	createdb voterunner
	pg_ctl stop -D data/postgres
fi
