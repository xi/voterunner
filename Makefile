all: voterunner.js style.css

voterunner.js: src/*.js
	browserify src/voterunner.js -o $@

style.css: scss/*.scss
	sassc scss/style.scss $@

clean:
	rm voterunner.js style.css
