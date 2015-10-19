import {createStore} from "redux";

/**
 * Instead of creating a "reducer" (with a switch statement!) + "actionCreator"
 * You just call `add` to provide a typeSafe "reducer" and we give you a typeSafe "actionCreator"
 */
export class SimpleRedux<State>{
    public store: Redux.Store;
    private _listeners = {};

    constructor(public initialState?: State) {
        this.store = createStore(this._reducer);
    }

    add<Payload>(usefulNameForDebugging: string, reducer: (state: State, payload: Payload) => State): { (payload: Payload): void; } {
        let dispatcher = (payload) => this.store.dispatch({
            type: usefulNameForDebugging,
            payload: payload
        });

        this._listeners[usefulNameForDebugging] = reducer;

        return dispatcher;
    }

    getState = (): State => {
        return this.store.getState();
    }

    subscribe = (changed: { (): any }): { dispose: () => any } => {
        return { dispose: this.store.subscribe(changed) as any };
    }

    private _reducer = (state: State = this.initialState, action: any): State => {
        if (this._listeners[action.type])
            return this._extendState(state, this._listeners[action.type](state, action.payload));
        else return state;
    }

    private _extendState(state: State, newState: State): State {
        let result = {};
        for (let key in state) {
            result[key] = state[key];
        }
        for (let key in newState) {
            result[key] = newState[key];
        }
        return result as State;
    }
}
