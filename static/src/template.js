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

var tplFollowers = function(state, id) {
	return state.nodes
		.filter(n => n.delegate === id)
		.sort((a, b) => getVotes(state.nodes, b) - getVotes(state.nodes, a))
		.map(n => tplNode(state, n));
};

var tplNode = function(state, node) {
	var classList = [];
	if (node.expanded) {
		classList.push('is-expanded');
	}
	if (node.id === state.id) {
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
					title: 'delegate to ' + node.id,
					disabled: (
						node.id === state.id ||
						getDelegationChain(state.nodes, node).includes(state.id)
					),
				}, '\u2795'),
				h('div', {className: 'node__votes bar__item bar__item--right'}, '' + getVotes(state.nodes, node)),
				h('div', {className: 'node__name bar__item' + (!node.expanded && node.comment ? '' : ' bar__item--grow')}, node.id),
				!node.expanded && node.comment && h('div', {className: 'node__preview bar__item bar__item--grow'}, node.comment.substr(0, 100)),
			]),
			node.expanded && h('div', {className: 'node__comment'}, node.comment || ''),
		]),
		h('ul', {
			className: 'tree',
			role: 'group',
		}, tplFollowers(state, node.id)),
	]);
};

var template = function(state) {
	return h('ul', {
		className: 'tree',
		role: 'tree',
	}, tplFollowers(state, null));
};

module.exports = {
	getVotes: getVotes,
	template: template,
};
