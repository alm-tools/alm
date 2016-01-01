import * as types from "../../common/types";
import {SimpleRedux} from "./simpleRedux";
import * as utils from "../../common/utils";

export interface TabInstance {
    id: string;
    url: string;
    saved: boolean,
}

/** make sure you update initial state */
export interface StoreState {
    activeProject?: ActiveProjectConfigDetails;
    errorsExpanded?: boolean;
    errorsByFilePath?: ErrorsByFilePath;
    /** Is the current file in the activeProject */
    activeProjectFilePathTruthTable?: { [filePath: string]: boolean };

    pendingRequests?: string[];

    /** Find and replace */
    findOptions?: FindOptions;

    /** Socket IO */
    socketConnected?: boolean;

    filePaths?: types.FilePath[];
    filePathsCompleted?: boolean;
    rootDir?: string;

    /** Tabs are managed globally as its significat to other sections */
    tabs?: TabInstance[];
    selectedTabIndex?: number;

    showDoctor?: boolean;
}

let initialStoreState: StoreState = {
    activeProject: null,
    errorsExpanded: false,
    errorsByFilePath: {},
    activeProjectFilePathTruthTable: {},
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
    tabs: [],
    selectedTabIndex: -1,
    showDoctor: false,
};

let redux = new SimpleRedux<StoreState>(initialStoreState);
export var store = redux.store;
export var getState = redux.getState;
export var subscribe = redux.subscribe;
export let subscribeSub = redux.subscribeSub;

export let setActiveProject = redux.add('setActiveProject', (state, payload: ActiveProjectConfigDetails): StoreState => {
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

export let setErrorsByFilePath = redux.add('setErrorsByFilePath', (state, payload: ErrorsByFilePath): StoreState => {
    return {
        errorsByFilePath: payload
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

export let setTabs = redux.add('setTabs', (state, tabs: TabInstance[]): StoreState => {
    return {
        tabs
    };
});

export let addTabAndSelect = redux.add('addTabAndSelect', (state:StoreState, tab: TabInstance): StoreState => {
    let tabs = state.tabs.concat([tab]);
    let selectedTabIndex = tabs.length - 1;
    return {
        tabs,
        selectedTabIndex
    };
});

export let addTabs = redux.add('addTabs', (state:StoreState, tabs: TabInstance[]): StoreState => {
    tabs = state.tabs.concat(tabs);
    return {
        tabs
    };
});

export let setTabSaveStatus = redux.add('setTabSaveStatus', (state: StoreState, payload: { index: number, saved: boolean }): StoreState => {
    let tab = state.tabs[payload.index];
    tab = redux.updateFields({ saved: payload.saved })(tab);
    let tabs = redux.updateArrayItem(state.tabs, payload.index, tab);
    return {
        tabs
    };
});

export let removeTab = redux.add('removeTab', (state: StoreState, index: number): StoreState => {
    let tabs = state.tabs.map((x, i) => i == index ? null : x).filter(x=> !!x);
    return {
        tabs
    };
});

export let selectPreviousTab = redux.add('selectPreviousTab', (state: StoreState, payload: {}): StoreState => {
    let selectedTabIndex = state.selectedTabIndex > 0 ? state.selectedTabIndex - 1 : -1;
    return {
        selectedTabIndex
    };
});

export let selectTab = redux.add('selectTab', (state: StoreState, payload: number): StoreState => {
    return {
        selectedTabIndex: payload
    };
});

/** gets the currently open file paths in tabs */
export let getOpenFilePaths = () => getState().tabs.filter(t=>t.url.startsWith('file://')).map(t=>utils.getFilePathFromUrl(t.url));
/** gets the currently selectedFilePath if any */
export let getSelectedFilePath = () => {
    let selected = getSelectedTab();
    if (selected) {
        let url = selected.url;
        if (url.startsWith('file://')){
            return utils.getFilePathFromUrl(url);
        }
    }
}

export function getSelectedTab(){
    let selected = getState().tabs[getState().selectedTabIndex];
    return selected;
}

export let toggleDoctor = redux.add('toggleDoctor', (state: StoreState, payload: {}): StoreState => {
    return {
        showDoctor: !state.showDoctor
    };
});
