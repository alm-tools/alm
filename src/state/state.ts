import {combineReducers} from "redux";
import {createStore} from "redux";

/**
 * Status bar
 */

interface StatusBarState {
    activeProject: string;
    errorsExpanded: boolean;
}
let initialStatusBarState = { activeProject: '', errorsExpanded: false };

/** Needed by redux */
interface Action { 
    type: string;
}

export var types = { 
    setActiveProject: '',
    expandErrors: '',
    collapseErrors: '',
}

// make values same as keys
Object.keys(types).map((key) => types[key] = key);

interface SetActiveProjectAction extends Action {
    activeProject: string;
}

interface ExpandErrorsAction extends Action {
    expandErrors: boolean;
}

interface CollapseErrorsAction extends Action {
    collapseErrors: boolean;
}

type StatusBarAction = SetActiveProjectAction & ExpandErrorsAction & CollapseErrorsAction;

function statusBarReducer(state: StatusBarState = initialStatusBarState, action: StatusBarAction): StatusBarState {
    switch (action.type) {
        case types.setActiveProject:
            return {
                errorsExpanded: state.errorsExpanded,
                activeProject: action.activeProject
            };
        case types.expandErrors: 
            return {
                errorsExpanded: true,
                activeProject: action.activeProject
            };
        case types.collapseErrors:
            return {
                errorsExpanded: false,
                activeProject: action.activeProject
            };
    }

    return state;
}
    

/**
 * Finally
 */
export interface StoreState { 
    statusBar: StatusBarState    
}
export let reducers = combineReducers({
    statusBar: statusBarReducer
});


export let store = createStore(reducers);
let dispatch = store.dispatch;


export function setActiveProject(activeProject: string) {
    dispatch(<SetActiveProjectAction>{
        type: types.setActiveProject,
        activeProject
    });
}

export function expandErrors() {
    dispatch(<ExpandErrorsAction>{
        type: types.expandErrors,
        expandErrors: true
    });
}

export function collapseErrors() {
    dispatch(<CollapseErrorsAction>{
        type: types.collapseErrors,
        collapseErrors: true
    });
}
