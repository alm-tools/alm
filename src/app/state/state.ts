import {SimpleRedux} from "./simpleRedux";

export interface StoreState {
    activeProject: string;
    errorsExpanded: boolean;
}
let initialStoreState = { activeProject: '', errorsExpanded: false };

let redux = new SimpleRedux<StoreState>(initialStoreState);
export var store = redux.store;

export let setActiveProject = redux.add('setActiveProject', (state, payload: string) => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: payload
    };
});

export let expandErrors = redux.add('expandErrors', (state, payload: {  }) => {
    return {
        errorsExpanded: true,
        activeProject: state.activeProject
    };
});

export let collapseErrors = redux.add('collapseErrors', (state, payload: {  }) => {
    return {
        errorsExpanded: false,
        activeProject: state.activeProject
    };
});