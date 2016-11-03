
/**
 * This is setup in our index.html to allow us to check if we are running in electron
 * And then we can provide special features for them
 */
declare const isElectron: boolean;

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

/** Will delete this some day */
interface PromiseDeferred<T> {
    promise: Promise<T>; resolve(value: T): any; reject(error: T): any;
}
