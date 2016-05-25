/**
 * This is a custom middleware that serves raw image files to the client
 */

import * as http from "http";
import * as https from "https";
import * as express from "express";
import * as fs from "fs";
import * as utils from "../common/utils";

/** Code */
export function getRawFile(req: http.IncomingMessage, res: http.ServerResponse) {
    /**
     * The URL is just the filePath
     * Client requests `/images/{filePath}`
     * MAC : `/users/bas/foo` -> all good
     * Windows : `/d:/users/bas/foo` -> don't want that leading `/` (I think express adds it?)
     */
    let filePath = req.url;
    if (/^win/.test(process.platform)){
        filePath = filePath.substring(1);
    }
    // filePath = __dirname + "/../../resources/icon.png"; // DEBUG

    /** For non image files error out */
    if (!utils.isImage(filePath)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.write("Error 404: Resource not found.");
        res.end();
        return;
    }
    res.writeHead(200, { 'content-type': utils.getImageMimeType(filePath) });
    fs.createReadStream(filePath).pipe(res);
}


export function registerImgServerWithExpress(app: express.Express) {
    app.use(utils.imageUrl, getRawFile);
}
