import * as sl from "../socketLib/socketLib";
import {QRFunction, QRServerFunction, TypedEvent} from "../socketLib/socketLib";
import * as types from "../common/types";
import {AvailableProjectConfig} from "../common/types";

/**
 * Consists of the following contracts
 *
 * a contract on how the client --calls--> server
 * a contract on how the server --calls--> the client that is calling the server
 * a contract on how the server --anycasts-> all clients
 */
export var server = {
    echo: {} as QRServerFunction<{ text: string, num: number }, { text: string, num: number }, typeof client>,
    filePaths: {} as QRFunction<{}, { filePaths: types.FilePath[], rootDir: string, completed: boolean }>,
    makeAbsolute: {} as QRFunction<{ relativeFilePath: string }, { filePath: string }>,

    /**
     * File stuff
     */
    openFile: {} as QRFunction<{ filePath: string }, { contents: string, saved: boolean, editorOptions: types.EditorOptions }>,
    closeFile: {} as QRFunction<{ filePath: string }, {}>,
    editFile: {} as QRFunction<{ filePath: string, edit: CodeEdit }, { saved: boolean }>,
    saveFile: {} as QRFunction<{ filePath: string }, {}>,
    getFileStatus: {} as QRFunction<{ filePath: string }, { saved: boolean }>,
    /** File Tree */
    addFile: {} as QRFunction<{ filePath: string }, { error?: string }>,
    deleteFromDisk: {} as QRFunction<{ files: string[], dirs: string[] }, { errors?: { filePath: string, error: string }[] }>,
    duplicateFile: {} as QRFunction<{ src: string, dest: string }, { error: string}>,
    duplicateDir: {} as QRFunction<{ src: string, dest: string }, { error: string}>,
    movePath: {} as QRFunction<{ src: string, dest: string }, { error: string}>, // both files / folders

    /**
     * config stuff
     */
    availableProjects: {} as QRFunction<{}, AvailableProjectConfig[]>,
    getActiveProjectConfigDetails: {} as QRFunction<{}, AvailableProjectConfig>,
    setActiveProjectConfigDetails: {} as QRFunction<AvailableProjectConfig, {}>,
    isFilePathInActiveProject: {} as QRFunction<{ filePath: string }, { inActiveProject: boolean }>,
    setOpenUITabs: {} as QRFunction<{ sessionId: string, openTabs: types.SessionTabInUI[] }, {}>,
    getOpenUITabs: {} as QRFunction<{ sessionId: id }, { sessionId: string; openTabs: types.SessionTabInUI[] }>,
    activeProjectFilePaths: {} as QRFunction<{}, { filePaths: string[] }>,
    sync: {} as QRFunction<{}, {}>,

    /**
     * Error stuff
     */
    getErrors: {} as QRFunction<{}, LimitedErrorsUpdate>,

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
    getDependencies: {} as QRFunction<{},Types.GetDependenciesResponse>,
    getAST: {} as QRFunction<Types.GetASTQuery,Types.GetASTResponse>,

    /**
     * Output Status
     */
    getCompleteOutputStatusCache: {} as QRFunction<{}, types.JSOutputStatusCache>,
    getLiveBuildResults: {} as QRFunction<{}, types.LiveBuildResults>,

    /**
     * Git service
     */
    gitStatus: {} as QRFunction<{},string>,
    gitReset: {} as QRFunction<{filePath:string},string>,
    gitDiff: {} as QRFunction<{filePath:string},types.GitDiff>,

    /**
     * FARM
     */
    startFarming: {} as QRFunction<Types.FarmConfig, {}>,
    stopFarmingIfRunning: {} as QRFunction<{}, {}>,
    farmResults: {} as QRFunction<{},Types.FarmNotification>,
}

export var client = {
    increment: {} as QRFunction<{ num: number }, { num: number }>,
}

export var cast = {
    /** for testing */
    hello: new TypedEvent<{ text: string }>(),

    /** If the file worker notices a change */
    filePathsUpdated: new TypedEvent<{ filePaths: types.FilePath[]; rootDir: string; completed:boolean }>(),

    /** If an open and already saved file changes on disk  */
    savedFileChangedOnDisk: new TypedEvent<{ filePath: string; contents: string }>(),

    /** If a user does a code edit */
    didEdit: new TypedEvent<{ filePath: string, edit: CodeEdit }>(),

    /** If any of the file status changes */
    didStatusChange: new TypedEvent<{ filePath: string, saved: boolean, eol: string}>(),

    /** If file editor options change */
    editorOptionsChanged: new TypedEvent<{ filePath: string, editorOptions: types.EditorOptions }>(),

    /** Errors for a file path */
    errorsUpdated: new TypedEvent<LimitedErrorsUpdate>(),

    /** Available projects updated */
    availableProjectsUpdated: new TypedEvent<AvailableProjectConfig[]>(),

    /** Active project name updated */
    activeProjectConfigDetailsUpdated: new TypedEvent<AvailableProjectConfig>(),

    /** Active project files` */
    activeProjectFilePathsUpdated: new TypedEvent<{filePaths:string[]}>(),

    /** FARM */
    farmResultsUpdated: new TypedEvent<Types.FarmNotification>(),

    /** JS Ouput status  */
    fileOutputStatusUpdated: new TypedEvent<types.JSOutputStatus>(),
    completeOutputStatusCacheUpdated: new TypedEvent<types.JSOutputStatusCache>(),
    liveBuildResults: new TypedEvent<types.LiveBuildResults>(),
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
     * FARM:
     * Find and Replace Multiple
     */
    export type FarmResultsByFilePath = {[filePath:string]: FarmResultDetails[]};
    export interface FarmResultDetails {
        filePath: string;
        /** 1 based at the moment ... todo Change it to 0 based */
        line: number;
        preview: string;
    }
    export interface FarmConfig {
         query: string;
         isRegex: boolean;
         isFullWord: boolean;
         isCaseSensitive: boolean;
         globs: string[];
     }
    export interface FarmNotification {
        completed: boolean;
        results: Types.FarmResultDetails[];
        /** Might be null if no query */
        config: Types.FarmConfig;
    }

    /**
     * Completions stuff
     */
    export interface GetCompletionsAtPositionQuery extends FilePathPositionQuery {
        prefix: string;
    }

    export type Completion = types.Completion;
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
        info?: {
            name?: string;
            comment?: string;
        }
        errors?: CodeError[];
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
    export interface LangHelp {
        displayName: string;
        help: string;
    }
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
        langHelp?: LangHelp;
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
        editorOptions: types.EditorOptions;
    }
    export interface FormatDocumentResponse {
        refactorings: types.RefactoringsByFilePath
    }
    export interface FormatDocumentRangeQuery extends FilePathQuery {
        editorOptions: types.EditorOptions;
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

    /**
     * Dependency View
     */
    export interface FileDependency {
        sourcePath: string;
        targetPath: string;
    }
    export interface GetDependenciesResponse {
        links: FileDependency[]
    }

    /**
     * AST View
     */
     export enum ASTMode {
         /** ts.forEachChild() */
         visitor,
         /** node.getChildren() */
         children,
     }
     export interface GetASTQuery extends FilePathQuery {
         mode: ASTMode;
     }
     export interface GetASTResponse {
         root?: NodeDisplay
     }
     export interface NodeDisplay {
        kind: string;
        children: NodeDisplay[];

        pos: number;
        end: number;

        /** Represents how many parents it has */
        depth: number;
        /** If we had a flat structure this is where this item would belong */
        nodeIndex: number;

        /** Key Details I understand */
        details?: any;

        /**
         * Best attempt serialization of original node
         * We remove `parent`
         */
        rawJson: any;
    }
}
