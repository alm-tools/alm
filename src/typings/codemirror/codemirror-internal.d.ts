declare module CodeMirror {

    /** Not doced but used in tern demo : http://codemirror.net/addon/tern/tern.js  */
    function cmpPos(a:Position, b:Position):number;

    /** @internal Utility function inside code mirror to stop events */
    function e_stop(event:any);

    interface SearchCursor {
    }
}

/** Our extension to code mirror*/
declare module CodeMirror {
    /** We like to keep the filePath in there. Helps us with tokenization */
    interface EditorConfiguration {
        filePath: string;
    }

    /** We like to keep the filePath in here. Helps us in command handling */
    interface Editor {
        filePath: string;
    }

    interface Doc {
        /** We like to keep the filePath in here. Helps us in using the doc */
        filePath: string;
        /** The root doc is the doc we keep in memory and don't link to any CM instance */
        rootDoc: boolean;
    }
}

/** Extensions by templates extension */
declare module CodeMirror {
    export var templatesHint: any;

    interface Hint {
        template?: any;
        data?: Hint;
        info?: Function;
    }
}
