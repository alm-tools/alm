/**
 * Registers all the git commands with the server
 */
import * as ui from "./ui";
export import commands = require("./commands/commands");
import {server} from "../socket/socketClient";

commands.gitStatus.on(()=>{
    ui.notifyInfoNormalDisappear('Git status coming soon');
    server.gitStatus({}).then(res=>console.log(res));
});
