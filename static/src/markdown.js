var MarkdownIt = require('markdown-it');

var md = new MarkdownIt();
var element = document.getElementById('markdown');
element.innerHTML = md.render(element.textContent);
