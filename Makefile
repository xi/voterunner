all: static/voterunner.js static/markdown.js static/style.css

static/voterunner.js: static/src/voterunner.js
	browserify $< > $@

static/markdown.js: static/src/markdown.js
	browserify $< > $@

static/style.css: static/scss/*.scss
	node-sass static/scss/style.scss > $@

clean:
	rm static/voterunner.js static/markdown.js static/style.css
