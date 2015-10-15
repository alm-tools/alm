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

export function setErrorsForFilePath(details: { filePath: string, errors: string[] }) {
    _errorsByFilePath[details.filePath] = details.errors;
    errorsUpdated.emit(_errorsByFilePath);
}

export function getErrors(){
    return _errorsByFilePath;
}

export function clearErrors() {
    _errorsByFilePath = {};
    errorsUpdated.emit({});
}
