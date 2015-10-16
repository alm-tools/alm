import {SimpleRedux} from "./simpleRedux";

/** make sure you update initial state */
export interface StoreState {
    activeProject?: string;
    errorsExpanded?: boolean;
    errorsByFilePath?: ErrorsByFilePath;
}
let initialStoreState: StoreState = { activeProject: '', errorsExpanded: false, errorsByFilePath: {} };

let redux = new SimpleRedux<StoreState>(initialStoreState);
export var store = redux.store;
export var getState = redux.getState;

export let setActiveProject = redux.add('setActiveProject', (state, payload: string): StoreState => {
    return {
        activeProject: payload,
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
