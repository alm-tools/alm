import * as commands from "../../commands/commands";
import * as ui from "../../ui";
import { inputDialog } from "../../dialogs/inputDialog";
import { server, cast } from '../../../socket/socketClient';
import { API } from '../../uix';
import * as utils from '../../../common/utils';

commands.enableLiveDemo.on(() => {
    const ceditor = API.getFocusedCodeEditorIfAny();
    if (!ceditor || !utils.isTs(ceditor.editor.filePath)) {
        ui.notifyWarningNormalDisappear('Your current tab needs to be a TypeScript file');
        return;
    }
    const filePath = ceditor.editor.filePath;
    commands.ensureLiveDemoTab.emit({filePath});
});

commands.disableLiveDemo.on(() => {
    commands.closeDemoTab.emit({});
});

commands.enableLiveDemoReact.on(() => {
    const ceditor = API.getFocusedCodeEditorIfAny();
    if (!ceditor || !utils.isTsx(ceditor.editor.filePath)) {
        ui.notifyWarningNormalDisappear('Your current tab needs to be a TypeScript tsx file');
        return;
    }
    const filePath = ceditor.editor.filePath;
    commands.ensureLiveDemoReactTab.emit({filePath});
});

commands.disableLiveDemoReact.on(() => {
    commands.closeDemoReactTab.emit({});
});
