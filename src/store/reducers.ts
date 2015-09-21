/**
 * Status bar
 */

interface StatusBarState {
	activeProject: string;
}
let initialStatusBarState = { activeProject: '' };

interface SetActiveProjectAction {
	activeProject: string;
}

type StatusBarAction = SetActiveProjectAction;

function statusBar(state: StatusBarState = initialStatusBarState, action: StatusBarAction): StatusBarState {
	return {
		activeProject: action.activeProject
	};
}


/**
 * Finally
 */
import {combineReducers} from "redux";
export default combineReducers({
	statusBar
});