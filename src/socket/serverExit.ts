/**
 * There are cases when we have to exit the server
 * but don't want to leave a client hanging
 * so we tell them about it. e.g.
 * - ctrl + c
 * - globbing failure
 */
import {TypedEvent} from "../common/events";

const serverExit = new TypedEvent();

/**
 * We want subscribers first
 * and then exit process
 * always in that order
 */
export const onServerExit = (cb: () => void) => serverExit.on(cb);
export const emitServerExit = () => {
    serverExit.emit({});
    process.exit();
}


/**
 * http://stackoverflow.com/a/14032965/390330
 * However the network stack only works if user does ctrl+c. In other cases we cannot even cast.
 */
// catches ctrl+c event
process.on('SIGINT', emitServerExit);
