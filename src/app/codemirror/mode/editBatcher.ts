/**
 * When sending edits to the server we *batch them by filePath*.
 */
/** imports */
import {cast, server} from "../../../socket/socketClient";


/**
 * The queue of edits by filePath that we still have to send
 */
const pendingQueue: { [filePath: string]: CodeEdit[] } = Object.create(null);


export function addToQueue(filePath: string, edit: CodeEdit) {
    // TODO: batch by trottling (by filepath) and send these to the server
    server.editFile({ filePath: filePath, edits: [edit] });
}
