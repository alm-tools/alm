import * as commands from "../commands";
import * as ui from "../../ui";
import { inputDialog } from "../../dialogs/inputDialog";
import { server } from '../../../socket/socketClient';

commands.gitAddAllCommitAndPush.on(() => {
    inputDialog.open({
        header: 'Git: Add all the files, commit with the following message, and push',
        onOk: (message) => {
            ui.notifyInfoNormalDisappear("Sending commands");
            server
                .gitAddAllCommitAndPush({ message })
                .then(res => {
                    if (res.error) {
                        ui.notifyWarningNormalDisappear(`Failed:${res.error}`);
                    }
                    else {
                        ui.notifyInfoNormalDisappear("Commands ran to completion successfully.");
                    }
                });
        },
        onEsc: () => null,
    })
});
