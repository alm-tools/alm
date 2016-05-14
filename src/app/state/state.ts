import * as types from "../../common/types";
import {SimpleRedux} from "./simpleRedux";
import * as utils from "../../common/utils";
import {AvailableProjectConfig} from "../../common/types";

/** make sure you update initial state */
export interface StoreState {
    activeProject?: AvailableProjectConfig;
    errorsExpanded?: boolean;
    errorsUpdate?: LimitedErrorsUpdate;
    errorsDisplayMode?: types.ErrorsDisplayMode;
    errorsFilter?: string;

    /** Is the current file in the activeProject */
    activeProjectFilePathTruthTable?: { [filePath: string]: boolean };

    /** JS Ouput status */
    outputStatusCache?: types.JSOutputStatusCache,
    liveBuildResults?: types.LiveBuildResults,

    pendingRequests?: string[];

    /** Find and replace */
    findOptions?: FindOptions;

    /** Socket IO */
    socketConnected?: boolean;

    filePaths?: types.FilePath[];
    filePathsCompleted?: boolean;
    rootDir?: string;

    showDoctor?: boolean;
}

let initialStoreState: StoreState = {
    activeProject: null,
    errorsExpanded: false,
    errorsUpdate: {
        errorsByFilePath: {},
        totalCount: 0,
        syncCount: 0,
        tooMany: false,
    },
    errorsDisplayMode: types.ErrorsDisplayMode.all,
    errorsFilter: '',
    activeProjectFilePathTruthTable: {},
    outputStatusCache: {},
    liveBuildResults: {
        builtCount: 0,
        totalCount: 0
    },
    pendingRequests: [],
    findOptions: {
        isShown: false,
        query: '',
        isRegex: false,
        isCaseSensitive: false,
        isFullWord: false
    },
    socketConnected: false,
    filePaths: [],
    filePathsCompleted: false,
    showDoctor: false,
};

let redux = new SimpleRedux<StoreState>(initialStoreState);
export var store = redux.store;
export var getState = redux.getState;
export var subscribe = redux.subscribe;
export let subscribeSub = redux.subscribeSub;

export let setActiveProject = redux.add('setActiveProject', (state, payload: AvailableProjectConfig): StoreState => {
    return {
        activeProject: payload,
    };
});

export let inActiveProjectFilePath = (filePath:string) => !!getState().activeProjectFilePathTruthTable[filePath];
export let inActiveProjectUrl = (url:string) => {
    if (!url) return false;
    let {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(url);
    if (protocol == 'file' || protocol == 'ast' || protocol == 'astfull') {
        return inActiveProjectFilePath(filePath);
    }
    else {
        return true;
    }
}

export let setFilePathsInActiveProject = redux.add('setActiveProjectFiles', (state, payload: string[]): StoreState => {
    let truthTable = utils.createMap(payload);
    return {
        activeProjectFilePathTruthTable: truthTable
    };
});

export let expandErrors = redux.add('expandErrors', (state, payload: {}): StoreState => {
    return {
        errorsExpanded: true,
    };
});

export let collapseErrors = redux.add('collapseErrors', (state, payload: {}): StoreState => {
    return {
        errorsExpanded: false,
    };
});

export let setErrorsDisplayMode = redux.add('setErrorsDisplayMode', (state, payload: types.ErrorsDisplayMode): StoreState => {
    return {
        errorsDisplayMode: payload,
    };
});

export let setErrorsFilter = redux.add('setErrorsFilter', (state, payload: string): StoreState => {
    return {
        errorsFilter: payload,
    };
});

export let setErrorsUpdate = redux.add('setErrorsUpdate', (state, payload: LimitedErrorsUpdate): StoreState => {
    return {
        errorsUpdate: payload
    };
});

export let setPendingRequests = redux.add('setPendingRequests', (state, payload: string[]): StoreState => {
    return {
        pendingRequests: payload
    };
});

export let setFindOptionsQuery = redux.add('setFindOptionsQuery', (state:StoreState, payload:string): StoreState => {
    let findQuery = state.findOptions;
    let newFindQuery = redux.updateFields({query: payload})(findQuery);
    return {
        findOptions: newFindQuery
    };
});

export let setFindOptionsIsCaseSensitive = redux.add('setFindOptionsIsCaseSensitive', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findOptions;
    let newFindQuery = redux.updateFields({isCaseSensitive: payload})(findQuery);
    return {
        findOptions: newFindQuery
    };
});

export let setFindOptionsIsRegex = redux.add('setFindOptionsIsRegex', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findOptions;
    let newFindQuery = redux.updateFields({isRegex: payload})(findQuery);
    return {
        findOptions: newFindQuery
    };
});

export let setFindOptionsIsFullWord = redux.add('setFindOptionsIsFullWord', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findOptions;
    let newFindQuery = redux.updateFields({isFullWord: payload})(findQuery);
    return {
        findOptions: newFindQuery
    };
});

export let setFindOptionsIsShown = redux.add('setFindOptionsIsShown', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findOptions;
    let newFindQuery = redux.updateFields({isShown: payload})(findQuery);
    return {
        findOptions: newFindQuery
    };
});

export let setSocketConnected = redux.add('setSocketConnected', (state, payload: boolean): StoreState => {
    return {
        socketConnected: payload
    };
});

export let setFilePaths = redux.add('setFilePaths', (state, config:{filePaths: types.FilePath[];rootDir:string; completed:boolean}): StoreState => {
    return {
        filePaths: config.filePaths,
        rootDir: config.rootDir,
        filePathsCompleted: config.completed
    };
});

export let toggleDoctor = redux.add('toggleDoctor', (state: StoreState, payload: {}): StoreState => {
    return {
        showDoctor: !state.showDoctor
    };
});

export const fileOuputStatusUpdated = redux.add('fileOuputStatusUpdated', (state: StoreState, payload: types.JSOutputStatus): StoreState => {
    const outputStatusCache = redux.updateFields({ [payload.inputFilePath]: payload })(state.outputStatusCache);
    return {
        outputStatusCache
    };
});

export const completeOuputStatusCacheUpdated = redux.add('completeOuputStatusCacheUpdated', (state: StoreState, payload: types.JSOutputStatusCache): StoreState => {
    const outputStatusCache = payload;
    return {
        outputStatusCache
    };
});

export const setLiveBuildResults = redux.add('setLiveBuildResults', (state: StoreState, payload: types.LiveBuildResults): StoreState => {
    return {
        liveBuildResults: payload
    };
});

export const ifJSStatusWasCurrentThenMoveToOutOfDate = redux.add('ifJSStatusWasCurrentThenMoveToOutOfDate', (state: StoreState, payload: {inputFilePath:string}): StoreState => {
    const oldState = state.outputStatusCache[payload.inputFilePath];
    // If we didn't think it was up to date then don't care
    if (!oldState || oldState.state !== types.JSOutputState.JSUpToDate)
    {
        return {};
    }
    // It might be out of date now. So move it there till the backend tells us something different
    const newState: typeof oldState = {
        inputFilePath: oldState.inputFilePath,
        outputFilePath: oldState.outputFilePath,
        state: types.JSOutputState.JSOutOfDate
    };
    const outputStatusCache = redux.updateFields({ [payload.inputFilePath]: newState })(state.outputStatusCache);
    return {
        outputStatusCache
    };
});
