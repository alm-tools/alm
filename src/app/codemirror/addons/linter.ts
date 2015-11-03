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
        // this.updateInlineWidgets(cm, rawErrors);
        return errors;
    }

    // based on view-source:https://codemirror.net/demo/widget.html
    widgets = []
    updateInlineWidgets(editor: CodeMirror.EditorFromTextArea, codeErrors: CodeError[]) {
        let widgets = this.widgets;
        editor.operation(function() {
            for (var i = 0; i < widgets.length; ++i) {
                editor.removeLineWidget(widgets[i]);
            }
            widgets.length = 0;

            for (var i = 0; i < codeErrors.length; ++i) {
                var err = codeErrors[i];

                var msg = document.createElement("div");

                msg.innerHTML = `<div style="font-size: 0.7rem; padding: 3px; background-color: black;">
                    🐛 ${err.message}
                </div>`;

                widgets.push(editor.addLineWidget(err.from.line, msg, { coverGutter: false, noHScroll: true }));
            }
        });

        var info = editor.getScrollInfo();
        var after = editor.charCoords({ line: editor.getDoc().getCursor().line + 1, ch: 0 }, "local").top;
        if (info.top + info.clientHeight < after){
            editor.scrollTo(null, after - info.clientHeight + 3);
        }
    }
}
