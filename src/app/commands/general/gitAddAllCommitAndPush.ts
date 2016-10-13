import * as commands from "../commands";
import * as ui from "../../ui";
import { inputDialog } from "../../dialogs/inputDialog";
import { server } from '../../../socket/socketClient';

commands.gitAddAllCommitAndPush.on(() => {
    inputDialog.open({
        header: 'Git: Add all the files, commit with the following message, and push',
        onOk: (message) => {
            server.gitAddAllCommitAndPush({ message }).then(res => {
                if (res.error) {
                    ui.notifyWarningNormalDisappear(`Failed:${res.error}`);
                }
            });
        },
        onEsc: () => null,
    })
});
