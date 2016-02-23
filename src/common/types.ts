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
export interface SessionTabOnDisk {
    relativeUrl: string;
}
export interface SessionOnDisk {
    openTabs: SessionTabOnDisk[];
    /** Relative path to tsconfig.json including file name */
    relativePathToTsconfig?: string;
    /** Duration since epoch */
    lastUsed: number;
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
