import {Server,Client, ServerSocket} from "../../socketLib/socketLibServer";
import http = require('http');
import * as serviceServer from "./serviceServer";
import * as clientService from "../../app/socket/serviceClientContract";


export function register(app: http.Server) {
    let clientCreator = (socket:ServerSocket):clientService.contract => {
        let client = new Client(socket);
        return {
            incrementNumber: client.sendToSocket(clientService.service.incrementNumber)
        };
    };
    let server = new Server(app, serviceServer, clientCreator);
}