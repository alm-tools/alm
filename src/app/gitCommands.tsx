/**
 * Registers all the git commands with the server
 */
import * as ui from "./ui";
export import commands = require("./commands/commands");

commands.gitStatus.on(()=>{
    ui.notifyInfoNormalDisappear('Git status coming soon')
});
