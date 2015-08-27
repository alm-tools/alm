import {Client} from "../../socketLib/socketLibClient";
import {service} from "../../server/socket/serviceContract";

let client = new Client();
export let echo = client.sendToSocket(service.echo);
