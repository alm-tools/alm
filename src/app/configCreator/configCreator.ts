/**
 * Commands to create common configuration files
 */

import * as commands from "../commands/commands";
import * as ui from "../ui";
import {server} from "../../socket/socketClient";

commands.createEditorconfig.on(()=>{
    server.createEditorconfig({}).then(()=>{
        ui.notifySuccessNormalDisappear('Created an .editorconfig');
    })
})
