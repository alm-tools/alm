import CM = require('codemirror');
let CodeMirror = CM;
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/javascript-hint');

/** Enable showhint for this code mirror */
export function setupOptions(cmOptions: any) {
    cmOptions.showHint = true;
    cmOptions.hintOptions = {
        completeOnSingleClick: true,
        hint: hint,
    };
}

function hint(ed: CodeMirror.EditorFromTextArea, cb: Function, options) {
    
    // options is just a copy of the `hintOptions` with defaults added
    // So do something fancy with the Editor 
    // console.log(ed,options);
    
    function render(elt: HTMLLIElement, data: any, cur: any) {
        elt.appendChild(document.createTextNode(cur.text));
    }

    // Delegate to the auto version for now 
    let original:CodeMirror.Hints = (CodeMirror as any).hint.auto(ed, options);
    if (!original) {
        cb(null);
        return;
    }
    original.list = original.list.map(o=> {
        let str: string = o as string;
        return {
            render: render,
            text: str,
        };
    });

    setTimeout(() => cb(original), 1000);
};
// Make hint async
(hint as any).async = true;