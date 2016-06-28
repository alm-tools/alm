import {createTokenizationSupport} from "./tokenization";
import {CompletionAdapter} from "./autocomplete";

export function setupMonacoJson() {
    monaco.languages.register({
        id: 'json',
        extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json'],
    });
    monaco.languages.onLanguage('json', () => {
        const languageId = 'json';

        // Tokenizer
        monaco.languages.setTokensProvider(languageId, createTokenizationSupport(true));

        /** Setup bracket matching etc. */
        monaco.languages.setLanguageConfiguration(languageId, richEditConfiguration);

        /** Setup Completion Adapter */
        monaco.languages.registerCompletionItemProvider(languageId, new CompletionAdapter());
    });
}

const richEditConfiguration: monaco.languages.LanguageConfiguration = {
	wordPattern: /(-?\d*\.\d\w*)|([^\[\{\]\}\:\"\,\s]+)/g,

	comments: {
		lineComment: '//',
		blockComment: ['/*', '*/']
	},

	brackets: [
		['{', '}'],
		['[', ']']
	],

	autoClosingPairs: [
		{ open: '{', close: '}', notIn: ['string'] },
		{ open: '[', close: ']', notIn: ['string'] },
		{ open: '"', close: '"', notIn: ['string'] }
	]
};
