import {Client} from "../../server/socket/socketLibClient";
import * as service from "../../socket/service";

let client = new Client();
export let echo = client.sendToSocket(service.echo);
