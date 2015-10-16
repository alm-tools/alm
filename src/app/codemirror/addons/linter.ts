import CM = require('codemirror');
let CodeMirror = CM;

import * as state from "../../state/state";

// Docs https://codemirror.net/doc/manual.html#addon_lint
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/lint.css');

/** Enable linter for this code mirror */
export function setupOptions(options: any, filePath: string) {
    options.lint = new Linter(filePath).lint;
    options.gutters.push("CodeMirror-lint-markers");
}

interface LintError {
    message: string,
    /** 'error' (default) | 'warning' */
    severity?: string,
    from: CodeMirror.Position,
    to: CodeMirror.Position
}

function codeErrorToLintError(codeError: CodeError): LintError {
    return {
        message: codeError.message,
        severity: 'error',
        from: CodeMirror.Pos(codeError.from.line, codeError.from.ch),
        to: CodeMirror.Pos(codeError.to.line, codeError.to.ch)
    };
}

class Linter {
    constructor(public filePath: string) {
        (this.lint as any).async = true;
    }

    lint = (doc: string,
        cb: (cm: CodeMirror.EditorFromTextArea, errorsNotSorted: LintError[]) => void, options: any, cm: CodeMirror.EditorFromTextArea) => {

        let rawErrors = state.getState().errorsByFilePath[this.filePath] || [];
        let errors: LintError[] = rawErrors.map(codeErrorToLintError);

        cb(cm, errors);
    }
}
