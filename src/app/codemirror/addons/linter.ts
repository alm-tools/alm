import CM = require('codemirror');
let CodeMirror = CM;

// Docs https://codemirror.net/doc/manual.html#addon_lint
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/lint.css');

/** Enable linter for this code mirror */
export function setupOptions(options: any) {
    options.lint = lint;
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
        from: codeError.from,
        to: codeError.to
    };
}

function lint(doc: string, cb: (cm: CodeMirror.EditorFromTextArea, errorsNotSorted: LintError[]) => void, options: any, cm: CodeMirror.EditorFromTextArea) {
    let errors: LintError[] = [];
    errors.push({
        message: 'sample',
        severity: 'error',
        from: CodeMirror.Pos(0, 0),
        to: CodeMirror.Pos(0, 10),
    });

    setTimeout(() => cb(cm, errors), 100);
}
(lint as any).async = true;
