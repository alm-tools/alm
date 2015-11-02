import CM = require('codemirror');
let CodeMirror = CM;
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/javascript-hint');

import {createMap} from "../../../common/utils";
import {server,cast,Types} from "../../../socket/socketClient";
import * as state from "../../state/state";

require('./autocomplete.css');

/// TODO: checkout the tern demo : http://codemirror.net/demo/tern.html to show docs next to selected item

/** Enable showhint for this code mirror */
export function setupOptions(cmOptions: any, filePath: string) {
    cmOptions.showHint = true;
    cmOptions.hintOptions = {
        completeOnSingleClick: true, // User can click on the item to select it :)
        completeSingle: false, // Don't compelete the last item
        hint: new AutoCompleter(filePath).hint,
    };

    // Debugging
    // cmOptions.hintOptions.closeOnUnfocus = false; // DEBUG
}

/** Mostly make completions more aggressive */
export function setupCodeMirror(cm: CodeMirror.EditorFromTextArea){
    let timeout:any;

    // Don't be aggresive on these ending characters
    let ignoreEnds = createMap([
        ';', ',',
        '(', ')',
        '`','"',"'",
        "{","}","[","]",
        " "
    ]);

    cm.on("inputRead", function(ed: any, change: CodeMirror.EditorChange) {
        let editor: CodeMirror.EditorFromTextArea = ed;

        /** Very important to clear any pending request */
        if (timeout) {
            clearTimeout(timeout);
        }

        /** only on user input (e.g. exclude `cut`) */
        if (change.origin !== '+input'){
            return;
        }

        if (change && change.text && ignoreEnds[change.text.join('')]){
            return;
        }

        timeout = setTimeout(function() {
            // if a completion is already active ... then cm will call us anyways :)
            if ((editor as any).state.completionActive) {
                // For some reason it doesn't for `.`
                // Suspect its because `token` changes and therefore show-hint hides it ¯\_(ツ)_/¯
                let cur = editor.getDoc().getCursor();
                if (editor.getTokenAt(cur).string !== '.'){
                    return;
                }
            }
            CodeMirror.showHint(cm as any);
        }, 150);
    });
}

export class AutoCompleter {
    /** if not the last request ... don't show results */
    lastRequest: number;

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

        this.lastRequest = position;

        /** For various reasons if we don't want to return completions */
        let noCompletions: CodeMirror.Hints = null;


        function render(elt: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint) {

            /** hacky push to render function */
            let original: Types.Completion = cur['original'];

            elt.innerHTML = `
                <strong class="hint left" style="color:${original.color};background:${original.colorBackground}">${original.kind}</strong>
                <span class="hint main">${original.name}</span>
                <span class="hint right">${original.display}</span>
            `.replace(/\s+/g,' ');
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
                if (this.lastRequest !== position){
                    cb(null);
                    return;
                }

                let from = { line: cur.line, ch: token.start };
                let to = { line: cur.line, ch: token.start + prefix.length };

                // Don't eat the dot!
                // (our projectService completions come back without the dot)
                if (token.string == '.'){
                    from = to;
                }

                cb({
                    from,
                    to,
                    list: res.completions.filter(x=>!x.snippet).map(completionToCodeMirrorHint)
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
