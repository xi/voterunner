all: static/voterunner.js static/style.css

static/voterunner.js: static/src/*.js
	browserify static/src/voterunner.js -o $@

static/style.css: static/scss/*.scss
	sassc static/scss/style.scss $@

clean:
	rm static/voterunner.js static/style.css
