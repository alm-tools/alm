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

        if (this._listeners[usefulNameForDebugging]) throw new Error(`REDUX: already have reducer "${usefulNameForDebugging}"`);

        let dispatcher = (payload) => this.store.dispatch({
            type: usefulNameForDebugging,
            payload: payload
        });

        this._listeners[usefulNameForDebugging] = reducer;

        return dispatcher;
    }

    /**
     * WARNING: this only supports 1 level of nesting
     */
    addSub<Payload, SubState>(usefulNameForDebugging: string, select: (state) => SubState, reducer: (state: SubState, payload: Payload) => SubState): { (payload: Payload): void; } {
        let dispatcher = (payload) => this.store.dispatch({
            type: usefulNameForDebugging,
            payload: payload
        });

        this._listeners[usefulNameForDebugging] = (state: State, payload: Payload): State => {
            let sub = select(state);
            for (var key in state) {
                if (state[key] == sub) break;
            }
            let newSub = reducer(sub, payload);
            state[key] = newSub;
            return state;
        };

        return dispatcher;
    }

    getState = (): State => {
        return this.store.getState();
    }

    subscribe = (changed: { (state: State): any }): { dispose: () => any } => {
        return { dispose: this.store.subscribe(() => changed(this.getState())) as any };
    }

    subscribeSub = <SubState>(select: (state: State) => SubState, onChange: (state: SubState) => void): { dispose: () => any } => {
        let currentState = select(this.getState());

        let handleChange = () => {
            let nextState = select(this.getState());
            if (nextState !== currentState) {
                currentState = nextState;
                onChange(currentState);
            }
        }

        return this.subscribe(handleChange);
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

    /**
     * Take every field of fields and put them override them in the complete object
     * NOTE: this API is a bit reverse of extend because of the way generic constraints work in TypeScript
     */
    updateFields = <T>(fields: T) => <U extends T>(complete: U): U => {
        let result = <U>{};
        for (let id in complete) {
            result[id] = complete[id];
        }
        for (let id in fields) {
            result[id] = fields[id];
        }
        return result;
    }

    // Update the item at index
    updateArrayItem<T>(array:T[],index:number,item:T){
        return array.map((x, i) => i == index ? item : x);
    }
}
