import CM = require('codemirror');
let CodeMirror = CM;
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/javascript-hint');

/// TODO: checkout the tern demo : http://codemirror.net/demo/tern.html to show docs next to selected item

/** Enable showhint for this code mirror */
export function setupOptions(cmOptions: any) {
    cmOptions.showHint = true;
    cmOptions.hintOptions = {
        completeOnSingleClick: true,
        hint: hint,
    };
    
    // For debugging
    // cmOptions.hintOptions.closeOnUnfocus = false;
}

function hint(ed: CodeMirror.EditorFromTextArea, cb: Function, options) {
    
    // options is just a copy of the `hintOptions` with defaults added
    // So do something fancy with the Editor 
    // console.log(ed,options);
    
    function render(elt: HTMLLIElement, data: any, cur: any) {
        elt.innerHTML = `<span>
            <strong>complete: </strong>
            <span>${cur.text}</span>
        </span>`.replace(/\s+/g,' ');
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

    setTimeout(() => cb(original), 100);
};
// Make hint async
(hint as any).async = true;