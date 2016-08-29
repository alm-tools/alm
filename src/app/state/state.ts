import * as types from "../../common/types";
import {SimpleRedux} from "./simpleRedux";
import * as utils from "../../common/utils";
import {AvailableProjectConfig} from "../../common/types";

/** make sure you update initial state */
export interface StoreState {
    activeProject?: AvailableProjectConfig;
    errorsExpanded?: boolean;
    errorsDisplayMode?: types.ErrorsDisplayMode;
    errorsFilter?: string;

    /** Is the current file in the activeProject */
    activeProjectFilePathTruthTable?: { [filePath: string]: boolean };
    /** Just the `file` paths. The above also contains folders */
    filePathsInActiveProject?: string[];

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
    fileTreeShown?: boolean;

    showDoctor?: boolean;
    showSemanticView?: boolean;

    /** TS worker working */
    tsWorking?: types.Working;
    testedWorking?: types.Working;
}

let initialStoreState: StoreState = {
    activeProject: null,
    errorsExpanded: false,
    errorsDisplayMode: types.ErrorsDisplayMode.all,
    errorsFilter: '',
    activeProjectFilePathTruthTable: {},
    filePathsInActiveProject: [],
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
    fileTreeShown: false,
    showDoctor: false,
    showSemanticView: false,
    tsWorking: {
        working: false,
    },
    testedWorking: {
        working: false,
    },
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
    // Filter out the `.json` files. These are good for `project data loader` but we don't need it in the UI
    payload = payload.filter(p => !p.endsWith('.json'));

    let truthTable = utils.createMap(payload);
    /** Also add all the *folders* in any of the files */
    payload.forEach(fp => {
        // Basically we go up the file path
        // If at any point its already in the truth table it means that we've already added everything else that is needed.
        let folder = utils.getDirectory(fp);
        while (folder && !truthTable[folder]) {
            truthTable[folder] = true;
            folder = utils.getDirectory(folder);
        }
    });
    return {
        activeProjectFilePathTruthTable: truthTable,
        filePathsInActiveProject: payload,
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

export let expandFileTree = redux.add('expandFileTree', (state, payload: {}): StoreState => {
    return {
        fileTreeShown: true,
    };
});

export let collapseFileTree = redux.add('collapseFileTree', (state, payload: {}): StoreState => {
    return {
        fileTreeShown: false,
    };
});

export let toggleDoctor = redux.add('toggleDoctor', (state: StoreState, payload: {}): StoreState => {
    return {
        showDoctor: !state.showDoctor
    };
});
export let setShowDoctor = redux.add('setShowDoctor', (state: StoreState, payload: boolean): StoreState => {
    return {
        showDoctor: payload
    };
});

export let toggleSemanticView = redux.add('toggleSemanticView', (state: StoreState, payload: {}): StoreState => {
    return {
        showSemanticView: !state.showSemanticView
    };
});
export let setShowSemanticView = redux.add('setShowSemanticView', (state: StoreState, payload: boolean): StoreState => {
    return {
        showSemanticView: payload
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

export const setTSWorking = redux.add('setTSWorking', (state: StoreState, payload: types.Working): StoreState => {
    return {
        tsWorking: payload
    };
});
export const setTestedWorking = redux.add('setTestedWorking', (state: StoreState, payload: types.Working): StoreState => {
    return {
        testedWorking: payload
    };
});
