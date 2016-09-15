#!/bin/sh

cd "$(dirname "$0")/.."
DB_DIR="$(pwd)/data/postgres"
mkdir -p $DB_DIR

start() {
	pg_ctl start -w -D "$DB_DIR" -o "-h localhost" -o "-k '$DB_DIR'"
}

stop() {
	pg_ctl stop -D "$DB_DIR"
}

if [ "$1" = 'start' ]; then
	start
elif [ "$1" = 'stop' ]; then
	stop
elif [ "$1" = 'init' ]; then
	if test ! -d "$DB_DIR/base"; then
		pg_ctl initdb -D "$DB_DIR"
		start
		createdb -h "$DB_DIR" voterunner
		stop
	else
		echo "skipping"
	fi
elif [ "$1" = 'clean' ]; then
	rm -r "$DB_DIR"
else
	echo "invalid command"
	exit 1
fi
