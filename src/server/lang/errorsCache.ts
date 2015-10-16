/**
 * Maintains the list of errors that have been encountered,
 * and notifies anyone who is concerned of updated values
 */

import {TypedEvent} from "../../common/events";


export let errorsUpdated = new TypedEvent<ErrorsByFilePath>()

/**
 * current errors
 */
let _errorsByFilePath: ErrorsByFilePath = {};

/** The pased errors are considered *the only current* errors for the filePath */
export function setErrorsForFilePath(details: { filePath: string, errors: CodeError[] }) {
    _errorsByFilePath[details.filePath] = details.errors;
    errorsUpdated.emit(_errorsByFilePath);
}

/** Errors are just added to any current errors */
export function appendErrorsByFilePath(errors: CodeError[]) {
    for (let error of errors) {
        _errorsByFilePath[error.filePath] = _errorsByFilePath[error.filePath] ? _errorsByFilePath[error.filePath].concat([error]) : [error];
    }
    errorsUpdated.emit(_errorsByFilePath);
}

export function getErrors(){
    return _errorsByFilePath;
}

export function clearErrors() {
    _errorsByFilePath = {};
    errorsUpdated.emit({});
}
