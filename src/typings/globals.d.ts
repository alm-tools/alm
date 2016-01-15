/// <reference path="../../node_modules/ntypescript/bin/ntypescript.d.ts"/>
/// <reference path="../../node_modules/rx/ts/rx.d.ts"/>

interface EditorPosition {
    line: number;
    ch: number;
}

interface CodeEdit {
    from: EditorPosition;
    to: EditorPosition;
    newText: string;
    /**
     * When we are editing stuff from the front end we want all code edits except our own (user typing code)
     * This helps us track that.
     */
    sourceId? : string;
}

/** Our extensions to the Error object */
interface Error {
    /** Really useful to have for debugging */
    details?: any;
}


interface CodeError {
    filePath: string;
    from: EditorPosition;
    to: EditorPosition;
    message: string;
    preview: string;
}

interface ErrorsByFilePath {
    [filePath: string]: CodeError[]
}

/**
 * I know config *details* is a horrible name. But it signifies the fact that the *Config* isn't located here
 * It is details about the *Config* files
 */
interface ActiveProjectConfigDetails {
    name: string;
    isImplicit: boolean;
    tsconfigFilePath?: string;
}

/**
 * Find and replace (FAR) related stuff
 */
interface FindOptions {
    isShown: boolean;
    query: string;
    isRegex: boolean;
    isCaseSensitive: boolean;
    isFullWord: boolean;
}


interface ReferenceDetails {
    filePath: string;
    position: EditorPosition;
    span: ts.TextSpan;
    preview: string;
}
