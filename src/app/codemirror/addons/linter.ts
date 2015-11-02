import CM = require('codemirror');
let CodeMirror = CM;

import * as state from "../../state/state";

// Docs https://codemirror.net/doc/manual.html#addon_lint
require('codemirror/addon/lint/lint.css');
import lint = require('./lint');
var _import = lint;
require('./lint.css');

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
    }

    lint = (doc: string, options: any, cm: CodeMirror.EditorFromTextArea) => {
        let rawErrors = state.getState().errorsByFilePath[this.filePath] || [];
        let errors: LintError[] = rawErrors.map(codeErrorToLintError);
        return errors;
    }
}
