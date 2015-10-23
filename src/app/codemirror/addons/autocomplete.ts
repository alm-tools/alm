import CM = require('codemirror');
let CodeMirror = CM;
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/javascript-hint');

import {createMap} from "../../../common/utils";
import {server,cast,Types} from "../../../socket/socketClient";
import * as state from "../../state/state";

/// TODO: checkout the tern demo : http://codemirror.net/demo/tern.html to show docs next to selected item

/** Enable showhint for this code mirror */
export function setupOptions(cmOptions: any, filePath: string) {
    cmOptions.showHint = true;
    cmOptions.hintOptions = {
        completeOnSingleClick: true, // User can click on the item to select it :)
        completeSingle: false, // Don't compelete the last item
        hint: new AutoCompleter(filePath).hint,
    };

    // For debugging
    // cmOptions.hintOptions.closeOnUnfocus = false;
}

/** Mostly make completions more aggressive */
export function setupCodeMirror(cm: CodeMirror.EditorFromTextArea){
    let timeout:any;

    // Don't be aggresive on these ending characters
    let ignoreEnds = createMap([';',',']);

    cm.on("inputRead", function(editor,change: CodeMirror.EditorChange) {
        if (timeout) {
            clearTimeout(timeout);
        }

        if (change && change.text && ignoreEnds[change.text.join('')]){
            return;
        }

        timeout = setTimeout(function() {
            CodeMirror.showHint(cm as any);
        }, 150);
    });
}

export class AutoCompleter {
    constructor(public filePath: string) {
        // Make hint async
        (this.hint as any).async = true;
    }

    hint = (editor: CodeMirror.EditorFromTextArea, cb: (hints: CodeMirror.Hints) => void, options): void => {

        // options is just a copy of the `hintOptions` with defaults added
        // So do something fancy with the Editor
        // console.log(ed,options);
        // console.log(options);

        let cur = editor.getDoc().getCursor();
        let token = editor.getTokenAt(cur);
        let prefix = token.string;
        let position = editor.getDoc().indexFromPos(cur);

        /** For various reasons if we don't want to return completions */
        let noCompletions: CodeMirror.Hints = null;


        function render(elt: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint) {

            /** hacky push to render function */
            let original: Types.Completion = cur['original'];

            elt.innerHTML = `<span>
                <strong>complete: </strong>
                <span>${original.name}</span>
            </span>`.replace(/\s+/g,' ');
        }

        function completionToCodeMirrorHint(completion: Types.Completion): CodeMirror.Hint {
            let result: CodeMirror.Hint = {
                text: completion.name,
                render: render
            }

            /** Hacky way to pass to render function */
            result['original'] = completion;

            return result;
        }

        // if in active project
        if (state.inActiveProject()) {
            server.getCompletionsAtPosition({ filePath: this.filePath, position, prefix }).then(res=> {
                cb({
                    from: { line: cur.line, ch: token.start },
                    to: { line: cur.line, ch: token.start + prefix.length },
                    list: res.completions.map(completionToCodeMirrorHint)
                });
            });
            return;
        }
        else {
            cb(noCompletions);
            return;
        }
    };

}
