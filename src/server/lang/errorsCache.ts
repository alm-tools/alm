/**
 * Maintains the list of errors that have been encountered,
 * and notifies anyone who is concerned of updated values
 */

import {TypedEvent} from "../../common/events";
import {createMapByKey,debounce} from "../../common/utils";


export let errorsUpdated = new TypedEvent<ErrorsByFilePath>()

/**
 * current errors
 */
let _errorsByFilePath: ErrorsByFilePath = {};

/**
 * Sending massive error lists *constantly* can quickly degrade the web experience
 * So we:
 * - debounce it
 * - only send 50 errors per file or 200 errors total
 * - // TODO: still tell them all the counts
 */
let sendErrors = debounce(()=>{
    let limitedCopy: ErrorsByFilePath = {};
    let total = 0;
    for (let filePath in _errorsByFilePath) {
        let errors = _errorsByFilePath[filePath];
        if (errors.length > 50) errors = errors.slice(0,50);
        limitedCopy[filePath] = errors;
        total += errors.length;
        if (total > 200) break;
    }
    errorsUpdated.emit(limitedCopy)
},250);

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

    sendErrors();
}

export function getErrors() {
    return _errorsByFilePath;
}

export function clearErrors() {
    _errorsByFilePath = {};
    sendErrors();
}

export function clearErrorsForFilePath(filePath: string) {
    _errorsByFilePath[filePath] = [];
    sendErrors();
}
