/**
 * Commands to manage settings related stuff
 */

import * as commands from "../commands/commands";
import * as ui from "../ui";
import {server} from "../../socket/socketClient";

commands.openSettingsFile.on(()=>{
    server.getSettingsFilePath({}).then((filePath)=>{
        console.log(filePath);
    })
})
