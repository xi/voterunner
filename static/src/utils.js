var preact = require('preact');

var throttle = function(fn, timeout) {
	var called, blocked;

	var result = function() {
		if (blocked) {
			called = true;
		} else {
			fn();
			blocked = true;
			called = false;

			setTimeout(function() {
				blocked = false;

				if (called) {
					result();
				}
			}, timeout);
		}
	};

	return result;
};

var on = function(element, eventType, selector, fn) {
	element.addEventListener(eventType, function(event) {
		var target = event.target.closest(selector);
		if (target && element.contains(target)) {
			return fn.call(target, event);
		}
	});
};

var initVDom = function(wrapper, template, state, afterRender) {
	wrapper.innerHTML = '';
	var tree = template(state);
	var element = preact.render(tree, wrapper);
	afterRender();

	return function(newState) {
		var newTree = template(newState);
		preact.render(newTree, wrapper, element);
		afterRender();
	};
};

var randomString = function() {
	var a = Math.random() * Date.now() * 0x1000;
	return Math.floor(a).toString(36);
};

var setCookie = function(key, value, days) {
	localStorage[key] = value;
};

var getCookie = function(key) {
	return localStorage[key];
};

module.exports = {
	throttle: throttle,
	on: on,
	initVDom: initVDom,
	randomString: randomString,
	setCookie: setCookie,
	getCookie: getCookie,
};
