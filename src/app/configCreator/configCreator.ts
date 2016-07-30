/**
 * Commands to create common configuration files
 */

import * as commands from "../commands/commands";
import * as ui from "../ui";
import {server} from "../../socket/socketClient";

commands.createEditorconfig.on(()=>{
    server.createEditorconfig({}).then((res)=>{
        if (res.alreadyPresent){
            ui.notifyWarningNormalDisappear('There is already an .editorconfig. Opened that for you instead.');
            commands.doOpenOrFocusFile.emit({ filePath: res.alreadyPresent });
        }
        else {
            ui.notifySuccessNormalDisappear('Created an .editorconfig');
        }
    })
})
