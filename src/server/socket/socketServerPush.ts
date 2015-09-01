/**
 * This file will be modified *both* on the *server* and the *client* 
 *
 * For each TypedEvent:
 * 	server will modify the meaning of `emit` 
 *  client will modify the meaning of `on` 
 */
import {TypedEvent} from "../../socketLib/socketLib";

/** Messages sent to everyone */
export var cast = {
    /** for testing */
    hello: new TypedEvent<{ text: string }>(),
    
    /** If the file worker notices a change */
    fileListUpdated: new TypedEvent<{ fileList: string[] }>()
};