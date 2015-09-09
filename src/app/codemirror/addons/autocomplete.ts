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

function hint(ed, cb: Function, options) {
    
    // options is just a copy of the `hintOptions` with defaults added
    // So do something fancy with the Editor 
    // console.log(ed,options);
    
    // Delegate to the auto version for now 
    let original: {
        // the list of *completions*. Each completion is rendered using the Widget class in showHint
        // The complex interface is based on reading the code of the Widget constructor
        // Also see docs https://codemirror.net/doc/manual.html#addon_show-hint
        list: (string | { 
            // Used as the completion text if hint is not provided
            text?: string;
            
            // Also used if render isn't provided && `displayText` isn't provided
            displayText?: string;
            className?: string;
            // if a render function is provided ... it is responsible for adding the needed text to `elt`
            // elt is the element `li` added for this completion
            // data is the whole of this *original* object
            // cur is the current completion ... i.e. this item in the list
            render?: (elt: HTMLLIElement, data: any, cur: any) => void;
            
            // Called if completion is picked
            hint?: Function; 
            
            // More specific completion
            from?: CodeMirror.Position, // start of token that is being completed
            to?: CodeMirror.Position, // end of token that is being completed
        })[],
        from: CodeMirror.Position, // start of token that is being completed
        to: CodeMirror.Position, // end of token that is being completed
    } = (CodeMirror as any).hint.auto(ed, options);

    function render(elt: HTMLLIElement, data: any, cur: any) {
        elt.appendChild(document.createTextNode(cur.text));
    }

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