export function setupMonacoTypecript() {
    monaco.languages.register({
        id: 'typescript',
        extensions: ['.ts'],
        aliases: ['TypeScript', 'ts', 'typescript'],
        mimetypes: ['text/typescript']
    });
    monaco.languages.onLanguage('typescript', () => {
        // Perform any one time setup
        setupMode('typescript');
    });

    monaco.languages.register({
        id: 'javascript',
        extensions: ['.js', '.es6'],
        firstLine: '^#!.*\\bnode',
        filenames: ['jakefile'],
        aliases: ['JavaScript', 'javascript', 'js'],
        mimetypes: ['text/javascript'],
    });
    monaco.languages.onLanguage('javascript', () => {
        // Perform any one time setup
        setupMode('javascript');
    });
}

import * as tokenization from "./tokenization";
function setupMode(modeId: 'typescript' | 'javascript') {
    /** Setup tokenization */
    const language = modeId === 'typescript' ? tokenization.Language.TypeScript : tokenization.Language.EcmaScript5;
    monaco.languages.setTokensProvider(modeId, tokenization.createTokenizationSupport(language));
}
