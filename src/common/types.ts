/**
 * Its Types (e.g. enums) + constants :) 
 */

export const cacheDir = '.tsb';
export const title = "TypeScript Builder";

export enum TriState {
    Unknown,
    True,
    False,
}

export const errors = {
    CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH : "A query *that needs an active project* was made when there is no active project for given filePath"
}
