export function setupMonacoTypecript() {
    monaco.languages.register({
        id: 'typescript',
        extensions: ['.ts', '.tsx'],
        aliases: ['TypeScript', 'ts', 'typescript'],
        mimetypes: ['text/typescript']
    });
    monaco.languages.onLanguage('typescript', () => {
        // Perform any one time setup
        setupMode('typescript');
    });

    monaco.languages.register({
        id: 'javascript',
        extensions: ['.js', '.es6', '.jsx'],
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
import {richLanguageConfiguration} from "./richLanguageConfiguration";
import * as provideDocumentHighlights from "./provideDocumentHighlights";
import {ProvideHover} from "./provideHover";
import {DocumentFormatter, DocumentRangeFormatter, FormatOnTypeAdapter} from "./formatting";
import * as autocomplete from "./autocomplete";
function setupMode(modeId: 'typescript' | 'javascript') {
    /** Setup tokenization */
    const language = modeId === 'typescript' ? tokenization.Language.TypeScript : tokenization.Language.EcmaScript5;
    monaco.languages.setTokensProvider(modeId, tokenization.createTokenizationSupport(language));

    /** Setup bracket matching etc. */
    monaco.languages.setLanguageConfiguration(modeId, richLanguageConfiguration);

    /** Setup highlight occurances */
    monaco.languages.registerDocumentHighlightProvider(modeId, provideDocumentHighlights);

    /** Setup hover information provider */
    monaco.languages.registerHoverProvider(modeId, new ProvideHover());

    /** Setup formaters */
    monaco.languages.registerDocumentFormattingEditProvider(modeId, new DocumentFormatter());
    monaco.languages.registerDocumentRangeFormattingEditProvider(modeId, new DocumentRangeFormatter());
    monaco.languages.registerOnTypeFormattingEditProvider(modeId, new FormatOnTypeAdapter())

    /** Setup autocomplete */
    monaco.languages.registerCompletionItemProvider(modeId, new autocomplete.SuggestAdapter());
}
