import {createStore} from "redux";
import reducers from "./reducers";

export let store = createStore(reducers);