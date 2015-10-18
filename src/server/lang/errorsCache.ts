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
export function setErrorsByFilePath(errors: CodeError[]) {
    let errorsByFile = createMapByKey(errors, (e) => e.filePath);
    for (let filePath in errorsByFile) {
        _errorsByFilePath[filePath] = errorsByFile[filePath];
    }
    errorsUpdated.emit(_errorsByFilePath);
}

/** Errors are just added to any current errors */
export function appendErrorsByFilePath(errors: CodeError[]) {
    for (let error of errors) {
        _errorsByFilePath[error.filePath] = _errorsByFilePath[error.filePath] ? _errorsByFilePath[error.filePath].concat([error]) : [error];
    }
    errorsUpdated.emit(_errorsByFilePath);
}

export function getErrors() {
    return _errorsByFilePath;
}

export function clearErrors() {
    _errorsByFilePath = {};
    errorsUpdated.emit({});
}

export function clearErrorsForFilePath(filePath: string) {
    _errorsByFilePath[filePath] = [];
    errorsUpdated.emit(_errorsByFilePath);
}
