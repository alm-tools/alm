/**
 * Maintains the list of errors that have been encountered, 
 * and notifies anyone who is concerned of updated values
 */

import {TypedEvent} from "../../common/events";


export let errorsUpdated = new TypedEvent<ErrorsByFilePath>()

/**
 * Single source of truth
 */
let errorsByFilePath: ErrorsByFilePath = {};

export function setErrorsForFilePath(details: { filePath: string, errors: string[] }) {
    errorsByFilePath[details.filePath] = details.errors;
    errorsUpdated.emit(errorsByFilePath);
}

export function getErrors(){
    return errorsByFilePath;
}