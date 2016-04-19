/// <reference path="../../node_modules/ntypescript/bin/ntypescript.d.ts"/>

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
    [filePath: string]: CodeError[];
}

/**
 * We don't send all the errors to front end continuously.
 * But we do still tell the total count.
 */
interface LimitedErrorsUpdate {
    errorsByFilePath: ErrorsByFilePath;
    totalCount: number;
    syncCount: number;
    tooMany: boolean;
}

/**
 * Allows true syncing of one cache with another
 */
type ErrorCacheDelta = {
    added: ErrorsByFilePath;
    removed: ErrorsByFilePath;
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
}
