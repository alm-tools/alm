import * as types from "../../common/types";
import {SimpleRedux} from "./simpleRedux";

/** make sure you update initial state */
export interface StoreState {
    activeProject?: string;
    errorsExpanded?: boolean;
    errorsByFilePath?: ErrorsByFilePath;
    currentFilePath?: string;
    /** Is the current file in the activeProject */
    inActiveProject?: types.TriState;

    pendingRequests?: string[];

    /** Find and replace */
    findQuery?: FindQuery;
}

let initialStoreState: StoreState = {
    activeProject: '',
    errorsExpanded: false,
    errorsByFilePath: {},
    currentFilePath: '',
    inActiveProject: types.TriState.Unknown,
    pendingRequests: [],
    findQuery: {
        query: undefined,
        isRegex: false,
        isCaseSensitive: false,
        isFullWord: false
    }
};

let redux = new SimpleRedux<StoreState>(initialStoreState);
export var store = redux.store;
export var getState = redux.getState;
export var subscribe = redux.subscribe;

export let setActiveProject = redux.add('setActiveProject', (state, payload: string): StoreState => {
    return {
        activeProject: payload,
    };
});

export let setInActiveProject = redux.add('setInActiveProject', (state, payload: types.TriState): StoreState => {
    return {
        inActiveProject: payload,
    };
});
export let inActiveProject = () => getState().inActiveProject === types.TriState.True;

export let setCurrentFilePath = redux.add('setCurrentFilePath', (state, payload: string): StoreState => {
    return {
        currentFilePath: payload,
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

export let setFindQueryQuery = redux.add('setFindQueryQuery', (state:StoreState, payload:string): StoreState => {
    let findQuery = state.findQuery;
    let newFindQuery = redux.updateFields({query: payload})(findQuery);
    return {
        findQuery: newFindQuery
    };
});

export let setFindQueryIsCaseSensitive = redux.add('setFindQueryIsCaseSensitive', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findQuery;
    let newFindQuery = redux.updateFields({isCaseSensitive: payload})(findQuery);
    return {
        findQuery: newFindQuery
    };
});

export let setFindQueryIsRegex = redux.add('setFindQueryIsRegex', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findQuery;
    let newFindQuery = redux.updateFields({isRegex: payload})(findQuery);
    return {
        findQuery: newFindQuery
    };
});

export let setFindQueryIsFullWord = redux.add('setFindQueryIsFullWord', (state:StoreState, payload:boolean): StoreState => {
    let findQuery = state.findQuery;
    let newFindQuery = redux.updateFields({isFullWord: payload})(findQuery);
    return {
        findQuery: newFindQuery
    };
});
