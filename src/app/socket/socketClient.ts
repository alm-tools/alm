import {Client} from "../../socketLib/socketLibClient";
import * as service from "../../server/socket/service";

let client = new Client();
export let echo = client.sendToSocket(service.echo);
