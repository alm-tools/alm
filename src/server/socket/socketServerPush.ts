/**
 * This file will be modified *both* on the *server* and the *client* 
 *
 * For each TypedEvent:
 * 	server will modify the meaning of `emit` 
 *  client will modify the meaning of `on` 
 */
import {TypedEvent} from "../../socketLib/socketLib";

/** Messages sent to everyone */
export var all = {
    hello: new TypedEvent<{text:string}>()
};