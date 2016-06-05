export function setupMonacoTypecript() {
    monaco.languages.register({
        id: 'typescript',
        extensions: ['.ts'],
        aliases: ['TypeScript', 'ts', 'typescript'],
        mimetypes: ['text/typescript']
    });
    monaco.languages.onLanguage('typescript', () => {
        // Perform any one time setup
        console.log('setup typescript');
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
        console.log('setup javascript');
    });
}
