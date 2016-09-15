#!/bin/sh

cd "$(dirname "$0")/.."
DB_DIR="$(pwd)/data/postgres"
mkdir -p $DB_DIR
if test ! -d "$DB_DIR/base"; then
	pg_ctl initdb -D "$DB_DIR"
	pg_ctl start -w -D "$DB_DIR" -o "-h localhost" -o "-k '$DB_DIR'"
	createdb -h "$DB_DIR" voterunner
	pg_ctl stop -D "$DB_DIR"
fi
