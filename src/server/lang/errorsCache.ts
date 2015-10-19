/**
 * Maintains the list of errors that have been encountered,
 * and notifies anyone who is concerned of updated values
 */

import {TypedEvent} from "../../common/events";
import {createMapByKey} from "../../common/utils";


export let errorsUpdated = new TypedEvent<ErrorsByFilePath>()

/**
 * current errors
 */
let _errorsByFilePath: ErrorsByFilePath = {};

/** The pased errors are considered *the only current* errors for the filePath */
export function setErrorsByFilePaths(filePaths: string[], errors: CodeError[]) {
    // For all found errors add them
    let errorsByFile = createMapByKey(errors, (e) => e.filePath);
    for (let filePath in errorsByFile) {
        _errorsByFilePath[filePath] = errorsByFile[filePath];
    }

    // For not found errors clear them
    for (let filePath of filePaths) {
        if (!errorsByFile[filePath]) {
            _errorsByFilePath[filePath] = [];
        }
    }

    errorsUpdated.emit(_errorsByFilePath);
}

export function getErrors() {
    return _errorsByFilePath;
}

export function clearErrors() {
    _errorsByFilePath = {};
    errorsUpdated.emit(_errorsByFilePath);
}

export function clearErrorsForFilePath(filePath: string) {
    _errorsByFilePath[filePath] = [];
    errorsUpdated.emit(_errorsByFilePath);
}
