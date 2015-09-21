import redux = require('redux');

interface State {
	activeProject: string;
}
let initialState = { activeProject: '' };

interface SetActiveProjectAction {
	activeProject: string;
}

type Action = SetActiveProjectAction;

function statusBar(state: State = initialState, action: Action): State {
	return {
		activeProject: action.activeProject
	};
}