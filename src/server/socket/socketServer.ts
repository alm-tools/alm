import {Server} from "./socketLibServer";
import http = require('http');
import * as service from "../../socket/service";

export function register(app: http.Server) {
    let server = new Server(app,service);
}