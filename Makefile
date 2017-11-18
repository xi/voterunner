all: static/voterunner.js static/markdown.js static/style.css

static/voterunner.js: static/src/voterunner.js
	browserify $< -o $@

static/markdown.js: static/src/markdown.js
	browserify $< -o $@

static/style.css: static/scss/*.scss
	node-sass static/scss/style.scss > $@

clean:
	rm static/voterunner.js static/markdown.js static/style.css
