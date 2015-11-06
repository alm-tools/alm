/**
 * Its Types (e.g. enums) + constants :)
 */

export const cacheDir = './.tsb';
export const title = "TypeScript Builder";

export enum TriState {
    Unknown,
    True,
    False,
}

export const errors = {
    CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH : "A query *that needs an active project* was made when there is no active project for given filePath"
}



/**
 * Session related types
 */
export interface SessionTabOnDisk {
    protocol: string;
    relativePath: string;
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
export interface SessionInUI {
    sessionId: string;
    openTabs: SessionTabInUI[];
}
