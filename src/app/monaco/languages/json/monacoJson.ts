import {createTokenizationSupport} from "./tokenization";

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
        monaco.languages.setTokensProvider(languageId, createTokenizationSupport(true))
    });
}
