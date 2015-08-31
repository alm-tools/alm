import {Server, ServerInstance} from "../../socketLib/socketLibServer";
import http = require('http');
import * as serviceServer from "./serviceServer";
import * as clientService from "../../app/socket/serviceClientContract";
import * as sp from "./socketServerPush";

export var allcast = sp.all;

export function register(app: http.Server) {
    let clientCreator = (serverInstance: ServerInstance): clientService.contract => {
        return {
            incrementNumber: serverInstance.sendToSocket(clientService.service.incrementNumber)
        };
    };
    let server = new Server(app, serviceServer, clientCreator);
    
    // Provide the server push messages
    allcast = server.setupAllCast(sp.all);

    setInterval(() => allcast.hello.emit({ text: 'nice' }), 1000);
}

