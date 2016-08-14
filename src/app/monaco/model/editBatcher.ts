/**
 * When sending edits to the server we *batch them by filePath*.
 */
/** imports */
import {cast, server} from "../../../socket/socketClient";
import * as utils from "../../../common/utils";


/**
 * The queue of edits by filePath that we still have to send
 */
const pendingQueue: { [filePath: string]: CodeEdit[] } = Object.create(null);


export function addToQueue(filePath: string, edit: CodeEdit) {
    // Batch by by filePath and setup for sending later
    if (!pendingQueue[filePath]) pendingQueue[filePath] = [];
    pendingQueue[filePath].push(edit);

    // Mark for sending
    delayedFlushQueue();
}

export function flushQueue() {
    Object.keys(pendingQueue).forEach(filePath => {
        const edits = pendingQueue[filePath];
        server.editFile({ filePath: filePath, edits });

        /** Clear for future */
        delete pendingQueue[filePath];
    });
}

/**
 * Note: this delay must be less than any other delays
 * (e.g. autocomplete throttling should be more than this).
 * WARNING: making it big breaks `formattingEditsAfterKeystroke`
 */
export const delayedFlushQueue = utils.throttle(flushQueue, 1);
