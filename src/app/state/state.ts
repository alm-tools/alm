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
    findAndReplaceValue?: string;
}

let initialStoreState: StoreState = { activeProject: '', errorsExpanded: false, errorsByFilePath: {}, currentFilePath:'', inActiveProject: types.TriState.Unknown, pendingRequests: [] };

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
})
