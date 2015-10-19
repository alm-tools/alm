// Type definitions for CodeMirror
// Project: https://github.com/marijnh/CodeMirror
// Definitions by: basarat <https://github.com/basarat>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module CodeMirror {
    interface Editor {
        /** Allows you to trigger an explicit lint request */
        performLint(): void;
    }
}

declare module "codemirror/addon/lint/lint" {
    export = CodeMirror;
}
