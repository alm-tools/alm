/**
 * This is a custom middleware that serves raw image files to the client
 */

import * as http from "http";
import * as fs from "fs";
import * as utils from "../common/utils";

/** Code */
export function getRawFile(req: http.IncomingMessage, res: http.ServerResponse) {
    /** Just return icon for now */
    const filePath = __dirname + "/../resources/icon.png";

    /** For non image files error out */
    if (!utils.isImage(filePath)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.write("Error 404: Resource not found.");
        res.end();
        return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    fs.createReadStream(filePath).pipe(res);
}
