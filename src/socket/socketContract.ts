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
    filePaths: {} as QRFunction<{}, { filePaths: string[] }>,
    makeAbsolute: {} as QRFunction<{ relativeFilePath: string }, { filePath: string }>,

    /**
     * File stuff
     */
    openFile: {} as QRFunction<{ filePath: string }, { contents: string, saved: boolean }>,
    closeFile: {} as QRFunction<{ filePath: string }, {}>,
    editFile: {} as QRFunction<{ filePath: string, edit: CodeEdit }, { saved: boolean }>,
    saveFile: {} as QRFunction<{ filePath: string }, {}>,

    /**
     * config stuff
     */
    availableProjects: {} as QRFunction<{}, ActiveProjectConfigDetails[]>,
    getActiveProjectName: {} as QRFunction<{}, {name:string}>,
    setActiveProjectName: {} as QRFunction<{name:string}, {}>,
    isFilePathInActiveProject: {} as QRFunction<{ filePath: string }, { inActiveProject: boolean }>,

    /**
     * Error stuff
     */
    getErrors: {} as QRFunction<{}, ErrorsByFilePath>,

    /**
     * Project Service
     */
    getCompletionsAtPosition: {} as QRFunction<Types.GetCompletionsAtPositionQuery,Types.GetCompletionsAtPositionResponse>,
    quickInfo: {} as QRFunction<Types.QuickInfoQuery,Types.QuickInfoResponse>,
}

export var client = {
    increment: {} as QRFunction<{ num: number }, { num: number }>,
}

export var cast = {
    /** for testing */
    hello: new TypedEvent<{ text: string }>(),

    /** If the file worker notices a change */
    filePathsUpdated: new TypedEvent<{ filePaths: string[] }>(),

    /** If an open and already saved file changes on disk  */
    savedFileChangedOnDisk: new TypedEvent<{ filePath: string; contents: string }>(),

    /** If a user does a code edit */
    didEdit: new TypedEvent<{filePath: string, edit: CodeEdit}>(),

    /** If any of the file status changes */
    didStatusChange: new TypedEvent<{filePath: string, saved: boolean}>(),

    /** Errors for a file path */
    errorsUpdated: new TypedEvent<ErrorsByFilePath>(),

    /** Tsb updated */
    availableProjectsUpdated: new TypedEvent<ActiveProjectConfigDetails[]>(),

    /** Active project name updated */
    activeProjectNameUpdated: new TypedEvent<{activeProjectName: string}>(),
}


/**
 * General utility interfaces
 */
export namespace Types {
    /** Used a lot in project service */
    export interface FilePathPositionQuery {
        filePath: string;
        position: number;
    }

    /**
     * Completions stuff
     */
    export interface GetCompletionsAtPositionQuery extends FilePathPositionQuery {
        prefix: string;
    }

    export interface Completion {
        name?: string; // stuff like "toString"
        kind?: string; // stuff like "var"
        comment?: string; // the docComment if any
        display?: string; // This is either displayParts (for functions) or just the kind duplicated

        color?: string; // as ntypescript is not loadable in the front-end, we send the color from the server
        colorBackground?: string;

        /** If snippet is specified then the above stuff is ignored */
        snippet?: string;
    }
    export interface GetCompletionsAtPositionResponse {
        completions: Completion[];
        endsInPunctuation: boolean;
    }

    export interface QuickInfoQuery extends FilePathPositionQuery { }
    export interface QuickInfoResponse {
        valid: boolean; // Do we have a valid response for this query
        name?: string;
        comment?: string;
    }
}
