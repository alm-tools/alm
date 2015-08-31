import {Server, ServerInstance, ServerSocket} from "../../socketLib/socketLibServer";
import http = require('http');
import * as serviceServer from "./serviceServer";
import * as clientService from "../../app/socket/serviceClientContract";


export function register(app: http.Server) {
    let clientCreator = (serverInstance: ServerInstance): clientService.contract => {
        return {
            incrementNumber: serverInstance.sendToSocket(clientService.service.incrementNumber)
        };
    };
    let server = new Server(app, serviceServer, clientCreator);
}