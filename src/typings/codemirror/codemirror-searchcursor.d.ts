// Type definitions for CodeMirror
// Project: https://github.com/marijnh/CodeMirror
// Definitions by: basarat <https://github.com/basarat>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module CodeMirror {
    interface Editor {
        /**
         * Can be used to implement search/replace functionality.
         * query can be a regular expression or a string (only strings will match across lines—if they contain newlines).
         * start provides the starting position of the search. It can be a {line, ch} object, or can be left off to default to the start of the document.
         * caseFold is only relevant when matching a string. It will cause the search to be case-insensitive.
         */
        getSearchCursor(query: RegExp | string, start?: CodeMirror.Position, caseFold?: boolean): SearchCursor;
    }

    interface SearchCursor {
        findNext(): boolean;
        findPrevious(): boolean;
        from(): CodeMirror.Position;
        to(): CodeMirror.Position;
        replace(text: string, origin?: string);
    }
}
