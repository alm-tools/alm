export const richLanguageConfiguration:monaco.languages.LanguageConfiguration = {
	wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,

	comments: {
		lineComment: '//',
		blockComment: ['/*', '*/']
	},

	brackets: [
		['{', '}'],
		['[', ']'],
		['(', ')']
	],

	onEnterRules: [
		{
			// e.g. /** | */
			beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
			afterText: /^\s*\*\/$/,
			action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' }
		},
		{
			// e.g. /** ...|
			beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
			action: { indentAction: monaco.languages.IndentAction.None, appendText: ' * ' }
		},
		{
			// e.g.  * ...|
			beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
			action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '* ' }
		},
		{
			// e.g.  */|
			beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
			action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
		},
		{
			// e.g. //|
			beforeText: /^\s*\/\/.*$/,
			action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '// ' }
		},
	],

	__electricCharacterSupport: {
		docComment: {scope:'comment.doc', open:'/**', lineStart:' * ', close:' */'}
	},

	autoClosingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"', notIn: ['string'] },
		{ open: '\'', close: '\'', notIn: ['string', 'comment'] },
		{ open: '`', close: '`' }
	]
};
