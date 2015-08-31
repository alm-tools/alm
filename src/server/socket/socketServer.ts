import {Server} from "../../socketLib/socketLibServer";
import http = require('http');
import * as serviceServer from "./serviceServer";

export function register(app: http.Server) {
    let server = new Server(app,serviceServer);
}