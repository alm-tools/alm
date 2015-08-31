import {Server, ServerInstance} from "../../socketLib/socketLibServer";
import http = require('http');
import * as serviceServer from "./serviceServer";
import * as clientService from "../../app/socket/serviceClientContract";
import * as serverPush from "./socketServerPush";

export var cast = serverPush.cast;

export function register(app: http.Server) {
    let clientCreator = (serverInstance: ServerInstance): clientService.contract => {
        return {
            incrementNumber: serverInstance.sendToSocket(clientService.service.incrementNumber)
        };
    };
    let server = new Server(app, serviceServer, clientCreator);
    
    // Provide the server push messages
    cast = server.setupAllCast(serverPush.cast);

    setInterval(() => cast.hello.emit({ text: 'nice' }), 1000);
}

