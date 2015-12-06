import * as sl from "../socketLib/socketLib";
import {QRFunction, QRServerFunction, TypedEvent} from "../socketLib/socketLib";
import * as types from "../common/types";

/**
 * Consists of the following contracts
 *
 * a contract on how the client --calls--> server
 * a contract on how the server --calls--> the client that is calling the server
 * a contract on how the server --anycasts-> all clients
 */
export var server = {
    echo: {} as QRServerFunction<{ text: string, num: number }, { text: string, num: number }, typeof client>,
    filePaths: {} as QRFunction<{}, { filePaths: types.FilePath[], completed: boolean }>,
    makeAbsolute: {} as QRFunction<{ relativeFilePath: string }, { filePath: string }>,

    /**
     * File stuff
     */
    openFile: {} as QRFunction<{ filePath: string }, { contents: string, saved: boolean }>,
    closeFile: {} as QRFunction<{ filePath: string }, {}>,
    editFile: {} as QRFunction<{ filePath: string, edit: CodeEdit }, { saved: boolean }>,
    saveFile: {} as QRFunction<{ filePath: string }, {}>,
    getFileStatus: {} as QRFunction<{ filePath: string }, { saved: boolean }>,

    /**
     * config stuff
     */
    availableProjects: {} as QRFunction<{}, ActiveProjectConfigDetails[]>,
    getActiveProjectConfigDetails: {} as QRFunction<{}, ActiveProjectConfigDetails>,
    setActiveProjectConfigDetails: {} as QRFunction<ActiveProjectConfigDetails, {}>,
    isFilePathInActiveProject: {} as QRFunction<{ filePath: string }, { inActiveProject: boolean }>,
    setOpenUITabs: {} as QRFunction<{ openTabs: types.SessionTabInUI[] }, {}>,
    getOpenUITabs: {} as QRFunction<{}, { openTabs: types.SessionTabInUI[] }>,
    getFilePathsInActiveProject: {} as QRFunction<{}, { filePaths: string[] }>,

    /**
     * Error stuff
     */
    getErrors: {} as QRFunction<{}, ErrorsByFilePath>,

    /**
     * Project Service
     */
    getCompletionsAtPosition: {} as QRFunction<Types.GetCompletionsAtPositionQuery, Types.GetCompletionsAtPositionResponse>,
    quickInfo: {} as QRFunction<Types.QuickInfoQuery, Types.QuickInfoResponse>,
    getRenameInfo: {} as QRFunction<Types.GetRenameInfoQuery, Types.GetRenameInfoResponse>,
    getDefinitionsAtPosition: {} as QRFunction<Types.GetDefinitionsAtPositionQuery, Types.GetDefinitionsAtPositionResponse>,
    getReferences: {} as QRFunction<Types.GetReferencesQuery, Types.GetReferencesResponse>,
    getDoctorInfo: {} as QRFunction<Types.GetDoctorInfoQuery, Types.GetDoctorInfoResponse>,
    formatDocument: {} as QRFunction<Types.FormatDocumentQuery, Types.FormatDocumentResponse>,
    formatDocumentRange: {} as QRFunction<Types.FormatDocumentRangeQuery, Types.FormatDocumentRangeResponse>,
    getNavigateToItems: {} as QRFunction<{},Types.GetNavigateToItemsResponse>,
}

export var client = {
    increment: {} as QRFunction<{ num: number }, { num: number }>,
}

export var cast = {
    /** for testing */
    hello: new TypedEvent<{ text: string }>(),

    /** If the file worker notices a change */
    filePathsCompleted: new TypedEvent<{ filePaths: types.FilePath[] }>(),
    filePathsPartial: new TypedEvent<{ filePaths: types.FilePath[] }>(),

    /** If an open and already saved file changes on disk  */
    savedFileChangedOnDisk: new TypedEvent<{ filePath: string; contents: string }>(),

    /** If a user does a code edit */
    didEdit: new TypedEvent<{ filePath: string, edit: CodeEdit }>(),

    /** If any of the file status changes */
    didStatusChange: new TypedEvent<{ filePath: string, saved: boolean }>(),

    /** Errors for a file path */
    errorsUpdated: new TypedEvent<ErrorsByFilePath>(),

    /** Tsb updated */
    availableProjectsUpdated: new TypedEvent<ActiveProjectConfigDetails[]>(),

    /** Active project name updated */
    activeProjectConfigDetailsUpdated: new TypedEvent<ActiveProjectConfigDetails>(),
}


/**
 * General utility interfaces
 */
export namespace Types {
    /** Used a lot in project service */
    export interface FilePathQuery {
        filePath: string;
    }

    /** Used a lot in project service */
    export interface FilePathPositionQuery {
        filePath: string;
        position: number;
    }

    /** Used a lot in project service */
    export interface FilePathEditorPositionQuery {
        filePath: string;
        editorPosition: EditorPosition;
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

        /** If snippet is specified then the above stuff is ignored */
        snippet?: string;
    }
    export interface GetCompletionsAtPositionResponse {
        completions: Completion[];
        endsInPunctuation: boolean;
    }

    /**
     * Mouse hover
     */
    export interface QuickInfoQuery extends FilePathPositionQuery { }
    export interface QuickInfoResponse {
        valid: boolean; // Do we have a valid response for this query
        name?: string;
        comment?: string;
    }

    /**
     * Rename refactoring
     */
    export interface GetRenameInfoQuery extends FilePathPositionQuery { }
    export interface GetRenameInfoResponse {
        canRename: boolean;
        localizedErrorMessage?: string;
        displayName?: string;
        fullDisplayName?: string; // this includes the namespace name
        kind?: string;
        kindModifiers?: string;
        triggerSpan?: ts.TextSpan;
        locations?: {
            /** Note that the Text Spans are from bottom of file to top of file */
            [filePath: string]: ts.TextSpan[]
        };
    }

    /**
     * Goto definition
     */
    export interface GetDefinitionsAtPositionQuery extends FilePathPositionQuery { }
    export interface GetDefinitionsAtPositionResponse {
        projectFileDirectory: string;
        definitions: {
            filePath: string;
            position: EditorPosition;
            span: ts.TextSpan;
        }[]
    }

    /**
     * Doctor
     */
    export interface GetDoctorInfoQuery extends FilePathEditorPositionQuery { }
    export interface GetDoctorInfoResponse {
        valid: boolean;
        definitions: {
            filePath: string;
            position: EditorPosition;
            span: ts.TextSpan;
        }[];
        quickInfo?: {
            name: string;
            comment: string;
        };
        references: ReferenceDetails[];
    }

    /**
     * References
     */
    export interface GetReferencesQuery extends FilePathPositionQuery { }
    export interface GetReferencesResponse {
        references: ReferenceDetails[];
    }

    /**
     * Formatting
     */
    export interface FormatDocumentQuery extends FilePathQuery {
    }
    export interface FormatDocumentResponse {
        refactorings: types.RefactoringsByFilePath
    }
    export interface FormatDocumentRangeQuery extends FilePathQuery {
        from: EditorPosition;
        to: EditorPosition;
    }
    export interface FormatDocumentRangeResponse {
        refactorings: types.RefactoringsByFilePath
    }

    /**
     * Symbols
     */
     /** for project symbols view */
     export interface NavigateToItem {
         name: string;
         kind: string;
         filePath: string;
         position: EditorPosition;
         fileName: string;
     }
    export interface GetNavigateToItemsResponse {
        items: NavigateToItem[];
    }
}
