import {Client} from "../../socketLib/socketLibClient";
import {service} from "../../server/socket/serviceServerContract";
import * as serviceClient from "./serviceClient";

let client = new Client(serviceClient);

// Consume the following services from the server
export let echo = client.sendToSocket(service.echo);
export let getAllFiles = client.sendToSocket(service.getAllFiles);