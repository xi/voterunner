var h = require('preact').h;

var getVotes = function(nodes, node) {
	if (!node.votes) {
		node.votes = 1 + nodes
			.filter(n => n.delegate === node.id)
			.map(n => getVotes(nodes, n))
			.reduce((sum, n) => sum + n, 0);
	}

	return node.votes;
};

var getDelegationChain = function(nodes, node) {
	if (!node.delegationChain) {
		if (node.delegate) {
			var delegate = nodes.find(n => n.id === node.delegate);
			var delegationChain = getDelegationChain(nodes, delegate);
			node.delegationChain = [node.delegate].concat(delegationChain);
		} else {
			node.delegationChain = [];
		}
	}

	return node.delegationChain;
};

var getName = function(node) {
	return node.name || 'anonymous';
};

var tplFollowers = function(nodes, id, ID) {
	return nodes
		.filter(n => n.delegate === id)
		.sort((a, b) => getVotes(nodes, b) - getVotes(nodes, a))
		.map(n => tplNode(nodes, n, ID));
};

var tplNode = function(nodes, node, ID) {
	var classList = [];
	if (node.expanded) {
		classList.push('is-expanded');
	}
	if (node.id === ID) {
		classList.push('node--self');
	}

	return h('li', {
		key: 'node-' + node.id,
		id: 'node-' + node.id,
		className: 'node ' + classList.join(' '),
		role: 'treeitem',
		'aria-expanded': '' + !!node.expanded,
	}, [
		h('article', {
			className: 'node__body',
		}, [
			h('header', {
				className: 'node__header bar',
			}, [
				h('button', {
					className: 'node__expand bar__item bar__item--button bar__item--left',
					title: node.expanded ? 'collapse' : 'expand',
				}, node.expanded ? '\u25BC' : '\u25B6'),
				h('button', {
					className: 'node__delegate bar__item bar__item--button bar__item--right',
					title: 'delegate to ' + getName(node),
					disabled: (
						node.id === ID ||
						getDelegationChain(nodes, node).includes(ID)
					),
				}, '\u2795'),
				h('div', {className: 'node__votes bar__item bar__item--right'}, '' + getVotes(nodes, node)),
				h('div', {className: 'node__name bar__item' + (!node.expanded && node.comment ? '' : ' bar__item--grow')}, getName(node)),
				!node.expanded && node.comment && h('div', {className: 'node__preview bar__item bar__item--grow'}, node.comment.substr(0, 100)),
			]),
			node.expanded && h('div', {className: 'node__comment'}, node.comment || ''),
		]),
		h('ul', {
			className: 'tree',
			role: 'group',
		}, tplFollowers(nodes, node.id, ID)),
	]);
};

var template = function(nodes, ID) {
	return h('ul', {
		className: 'tree',
		role: 'tree',
	}, tplFollowers(nodes, null, ID));
};

module.exports = {
	getVotes: getVotes,
	getName: getName,
	template: template,
};
