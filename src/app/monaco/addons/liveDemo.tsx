import * as commands from "../../commands/commands";
import * as ui from "../../ui";
import { inputDialog } from "../../dialogs/inputDialog";
import { server } from '../../../socket/socketClient';
import { API } from '../../uix';
import * as utils from '../../../common/utils';

commands.enableLiveDemo.on(() => {
    const ceditor = API.getFocusedCodeEditorIfAny();
    if (!ceditor || !utils.isTs(ceditor.editor.filePath)) {
        ui.notifyWarningNormalDisappear('Your current tab needs to be a TypeScript file');
    }
    const filePath = ceditor.editor.filePath;
});

commands.disableLiveDemo.on(() => {

});
