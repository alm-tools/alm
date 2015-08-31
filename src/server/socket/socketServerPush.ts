import {TypedEvent} from "../../socketLib/socketLib";

export var allcast = {
    hello: new TypedEvent<{text:string}>()
};