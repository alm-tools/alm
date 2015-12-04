import CM = require('codemirror');
let CodeMirror = CM;
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/javascript-hint');

import {createMap} from "../../../common/utils";
import {server,cast,Types} from "../../../socket/socketClient";
import * as state from "../../state/state";
import * as jumpy from "./jumpy";

require('./autocomplete.css');
import * as templates from "./templates";

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

        /** Also ignore jumpy :-/ cancelling it from jumpy still causes this to get called */
        if (jumpy.getState(ed).shown) {
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

/** Exists to allow us to pass throught the `original` information around */
interface ExtendedCodeMirrorHint extends CodeMirror.Hint{
    original?: Types.Completion
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


        function render(elt: HTMLLIElement, data: CodeMirror.Hints, cur: ExtendedCodeMirrorHint) {
            let original: Types.Completion = cur.original;
            let [color, colorBackground] = [kindToColor(original.kind), kindToColor(original.kind, true)];

            elt.innerHTML = `
                <strong class="hint left" style="color:${color};background:${colorBackground}">${original.kind}</strong>
                <span class="hint main">${original.name}</span>
                <span class="hint right">${original.display}</span>
            `.replace(/\s+/g,' ');
        }

        function completionToCodeMirrorHint(completion: Types.Completion): ExtendedCodeMirrorHint {
            let result: ExtendedCodeMirrorHint = {
                text: completion.name,
                render: render,
                original: completion
            }
            return result;
        }

        // This code is based on http://codemirror.net/addon/tern/tern.js `hint` function
        function setupCompletionDocs<T>(obj:T):T{
            var cls = "CodeMirror-Tern-"; // this was a global var that I pull *in*

            var tooltip = null;
            CodeMirror.on(obj, "close", function() { remove(tooltip); });
            CodeMirror.on(obj, "update", function() { remove(tooltip); });
            CodeMirror.on(obj, "select", function(cur: ExtendedCodeMirrorHint, node) {
              remove(tooltip);
              var content = cur.original && cur.original.comment;
              if (content) {
                tooltip = makeTooltip(node.parentNode.getBoundingClientRect().right + window.pageXOffset,
                                      node.getBoundingClientRect().top + window.pageYOffset, content);
                tooltip.className += " " + cls + "hint-doc";
              }
            });
            return obj;

            // pulled in these functions as they were it is
            function remove(node) {
                var p = node && node.parentNode;
                if (p) p.removeChild(node);
            }
            function makeTooltip(x, y, content) {
                var node = (elt as any)("div", cls + "tooltip", content);
                node.style.left = x + "px";
                node.style.top = y + "px";
                document.body.appendChild(node);
                return node;
            }
            function elt(tagname, cls /*, ... elts*/) {
                var e = document.createElement(tagname);
                if (cls) e.className = cls;
                for (var i = 2; i < arguments.length; ++i) {
                    var elt = arguments[i];
                    if (typeof elt == "string") elt = document.createTextNode(elt);
                    e.appendChild(elt);
                }
                return e;
            }
        }

        // if in active project
        if (state.inActiveProject(editor.filePath)) {
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

                let completionInfo = {
                    from,
                    to,
                    list: res.completions.filter(x=>!x.snippet).map(completionToCodeMirrorHint)
                };

                // Add snippets
                completionInfo.list = completionInfo.list.concat(templates.getCompletions(editor, token.string));

                setupCompletionDocs(completionInfo);

                cb(completionInfo);
            });
            return;
        }
        else {
            cb(noCompletions);
            return;
        }
    };

}


function kindToColor(kind:string, lighten = false){
    let add = lighten?50:0;
    let opacity = lighten?0.2:1;
    let base = 'white';
    switch(kind){
        case ts.ScriptElementKind.keyword:
            // redish
            return `rgba(${0xf9 + add},${0x26 + add},${0x72 + add},${opacity})`;
        case ts.ScriptElementKind.scriptElement:
        case ts.ScriptElementKind.moduleElement:
        case ts.ScriptElementKind.classElement:
        case ts.ScriptElementKind.localClassElement:
        case ts.ScriptElementKind.interfaceElement:
        case ts.ScriptElementKind.typeElement:
        case ts.ScriptElementKind.enumElement:
        case ts.ScriptElementKind.alias:
        case ts.ScriptElementKind.typeParameterElement:
        case ts.ScriptElementKind.primitiveType:
            // yelloish
            // #e6db74
            return `rgba(${0xe6 + add},${0xdb + add},${0x74 + add},${opacity})`;
        case ts.ScriptElementKind.variableElement:
        case ts.ScriptElementKind.localVariableElement:
        case ts.ScriptElementKind.memberVariableElement:
        case ts.ScriptElementKind.letElement:
        case ts.ScriptElementKind.constElement:
        case ts.ScriptElementKind.label:
        case ts.ScriptElementKind.parameterElement:
        case ts.ScriptElementKind.indexSignatureElement:
            // blueish
            // #66d9ef
            return `rgba(${0x66 + add},${0xd9 + add},${0xef + add},${opacity})`;
        case ts.ScriptElementKind.functionElement:
        case ts.ScriptElementKind.localFunctionElement:
        case ts.ScriptElementKind.memberFunctionElement:
        case ts.ScriptElementKind.memberGetAccessorElement:
        case ts.ScriptElementKind.memberSetAccessorElement:
        case ts.ScriptElementKind.callSignatureElement:
        case ts.ScriptElementKind.constructorImplementationElement:
            // greenish
            // #a6e22e
            return `rgba(${0xa6 + add},${0xe2 + add},${0x2e + add},${opacity})`;
        default:
            return base;
    }
}
