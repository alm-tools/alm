import {Server} from "../../socketLib/socketLibServer";
import http = require('http');
import * as service from "./service";

export function register(app: http.Server) {
    let server = new Server(app,service);
}