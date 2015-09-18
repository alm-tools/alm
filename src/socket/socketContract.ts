import * as sl from "../socketLib/socketLib";
import {QRFunction, QRServerFunction, TypedEvent} from "../socketLib/socketLib";

/**
 * Consists of the following contracts
 * 
 * a contract on how the client --calls--> server
 * a contract on how the server --calls--> the client that is calling the server
 * a contract on how the server --anycasts-> all clients
 */
export var server = {
    echo: {} as QRServerFunction<{ text: string, num: number }, { text: string, num: number }, typeof client>,    
    getAllFiles: {} as QRFunction<{}, { relativeFilePaths: string[] }>,
    makeAbsolute: {} as QRFunction<{ relativeFilePath: string }, { filePath: string }>,
    
    /** 
     * File stuff
     */
    openFile: {} as QRFunction<{ filePath: string }, { contents: string }>,
    closeFile: {} as QRFunction<{ filePath: string }, { }>,
    editFile: {} as QRFunction<{ filePath: string, edit: CodeEdit }, { saved: boolean }>,
    saveFile: {} as QRFunction<{ filePath: string }, {}>,
}

export var client = {
    increment: {} as QRFunction<{ num: number }, { num: number }>,
}

export var cast = {
    /** for testing */
    hello: new TypedEvent<{ text: string }>(),
    
    /** If the file worker notices a change */
    fileListUpdated: new TypedEvent<{ relativeFilePaths: string[] }>(),
    
    /** If an open and already saved file changes on disk  */
    savedFileChangedOnDisk: new TypedEvent<{ filePath: string; content: string }>(),
}
