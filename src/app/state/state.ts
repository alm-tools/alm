import {SimpleRedux} from "./simpleRedux";

export interface StoreState {
    activeProject: string;
    errorsExpanded: boolean;
    errorsByFilePath: ErrorsByFilePath;
}
let initialStoreState: StoreState = { activeProject: '', errorsExpanded: false, errorsByFilePath: {} };

let redux = new SimpleRedux<StoreState>(initialStoreState);
export var store = redux.store;
export var getState = redux.getState;

export let setActiveProject = redux.add('setActiveProject', (state, payload: string) => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: payload,
        errorsByFilePath: state.errorsByFilePath
    };
});

export let expandErrors = redux.add('expandErrors', (state, payload: {  }) => {
    return {
        errorsExpanded: true,
        activeProject: state.activeProject,
        errorsByFilePath: state.errorsByFilePath
    };
});

export let collapseErrors = redux.add('collapseErrors', (state, payload: {  }) => {
    return {
        errorsExpanded: false,
        activeProject: state.activeProject,
        errorsByFilePath: state.errorsByFilePath
    };
});

export let setErrorsByFilePath = redux.add('setErrorsByFilePath', (state, payload: ErrorsByFilePath) => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: state.activeProject,
        errorsByFilePath: payload
    };
});
