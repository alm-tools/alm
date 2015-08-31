// Provide the following service to the server
import {Client} from "../../socketLib/socketLibClient";
import * as serviceClient from "./serviceClient";
let client = new Client(serviceClient);

// Consume the following services from the server
import {service} from "../../server/socket/serviceServerContract";
export let echo = client.sendToSocket(service.echo);
export let getAllFiles = client.sendToSocket(service.getAllFiles);