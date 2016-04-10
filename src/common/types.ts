/**
 * Its Types (e.g. enums) + constants :)
 */

export const cacheDir = './.alm';
export const title = "Application Lifecycle Management tools for TypeScript";

export enum TriState {
    Unknown,
    True,
    False,
}

export const errors = {
    CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH : "A query *that needs an active project* was made when there is no active project for given filePath",
    CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL : "A query *that needs an active project* was made when there is no active project"
}



/**
 * Session related types
 */
export interface SessionsFileContents {
    sessions: SessionOnDisk[];
    /** Relative path to tsconfig.json including file name */
    relativePathToTsconfig?: string;
}
export interface SessionOnDisk {
    /** unique to each session */
    id: string;
    /** the tabs the user has open */
    openTabs: SessionTabOnDisk[];
    /** Duration since epoch */
    lastUsed: number;
}
export interface SessionTabOnDisk {
    relativeUrl: string;
}
/**
 * The UI version of session. Basically its all absolute paths and tab urls
 * also UI is not in control of active project so it doesn't sent that
 */
export interface SessionTabInUI {
    url: string;
}

/**
 * Refactoring related stuff
 */
export interface Refactoring extends ts.TextChange {
    filePath: string;

    /** If you want to insert a snippet. Be careful that you shouldn't return more than one refatoring if you want to use this */
    // isNewTextSnippet?: boolean;
}

/**
 * Because you generally want to transact per file
 * You don't need to create this manually. Just use `getRefactoringsByFilePath`
 */
export interface RefactoringsByFilePath {
    [filePath: string]: Refactoring[];
}

/**
 * Reason is we want to transact by file path
 * Also, this function sorts per file so you can apply refactorings in order 🌹
 */
export function getRefactoringsByFilePath(refactorings: Refactoring[]) {
    var loc: RefactoringsByFilePath = {};
    for (let refac of refactorings) {
        if (!loc[refac.filePath]) loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }

    // sort each of these in descending by start location
    for (let filePath in loc) {
        let refactorings = loc[filePath];
        refactorings.sort((a: Refactoring, b: Refactoring) => {
            return (b.span.start - a.span.start);
        });
    }

    return loc;
}

/** For file listing we like to know if its a dir or file */
export enum FilePathType {
    File,
    Dir
}
export interface FilePath {
    filePath: string;
    type: FilePathType
}


/**
 * File model stuff
 */
export interface FileStatus {
    filePath: string;
    saved: boolean;
    eol: string;
}

/**
 * Project JS File status stuff
 */
export interface JSOutputStatus {
    /** Its convinient to have it hare */
    inputFilePath: string;

    /** One of the various states */
    state: JSOutputState;

    /** Only if the state is for some JS file */
    outputFilePath?: string;
}
/** The JS file can only be in one of these states */
export enum JSOutputState {
    /** As it is from the TypeScript language service. Either emit is blocked or compiler options are noEmit */
    EmitSkipped,
    /** If emit not skipped perhaps there isn't a JS file emit for this (e.g .d.ts files) */
    NoJSFile,
    /** If JS file then its one of these */
    JSUpToDate,
    JSOutOfDate,
}
export type JSOutputStatusCache = { [inputFilePath: string]: JSOutputStatus }

/**
 * Complete related stuff
 */
export interface Completion {
    name?: string; // stuff like "toString"
    kind?: string; // stuff like "var"
    comment?: string; // the docComment if any
    display?: string; // This is either displayParts (for functions) or just the kind duplicated

    /** If snippet is specified then the above stuff is ignored */
    snippet?: string;
}
/**
 * Exists to allow us to pass throught the `original` information around.
 * Code mirror insists on using `CodeMirror.Hint` so we use that
 * But then we put the good stuff in `original` and use it in `render` and `complete` and `move` etc
 */
export interface ExtendedCodeMirrorHint extends CodeMirror.Hint {
    original?: Completion;
}
