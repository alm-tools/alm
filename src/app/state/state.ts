import * as types from "../../common/types";
import {SimpleRedux} from "./simpleRedux";

/** make sure you update initial state */
export interface StoreState {
    activeProject?: ActiveProjectConfigDetails;
    errorsExpanded?: boolean;
    errorsByFilePath?: ErrorsByFilePath;
    currentFilePath?: string;
    /** Is the current file in the activeProject */
    inActiveProject?: types.TriState;

    pendingRequests?: string[];

    /** Find and replace */
    findOptions?: FindOptions;
}

let initialStoreState: StoreState = {
    activeProject: null,
    errorsExpanded: false,
    errorsByFilePath: {},
    currentFilePath: '',
    inActiveProject: types.TriState.Unknown,
    pendingRequests: [],
    findOptions: {
        isShown: false,
        query: '',
        isRegex: false,
        isCaseSensitive: false,
        isFullWord: false
    },
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
