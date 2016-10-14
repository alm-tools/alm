import * as commands from "../commands";
import * as ui from "../../ui";
import { inputDialog } from "../../dialogs/inputDialog";
import { server } from '../../../socket/socketClient';

commands.gitAddAllCommitAndPush.on(() => {
    inputDialog.open({
        header: 'Git: Add all the files, commit with the following message, and push',
        onOk: (message) => {
            ui.notifyInfoNormalDisappear("Git: Sending commands. Will notify when complete.");
            server
                .gitAddAllCommitAndPush({ message })
                .then(res => {
                    if (res.type === 'error') {
                        ui.notifyWarningNormalDisappear(`Git Failed:${res.error}`);
                    }
                    else {
                        ui.notifySuccessNormalDisappear(res.log);
                        ui.notifySuccessNormalDisappear("Git: Commands ran to completion successfully.");
                    }
                    commands.gitStatusNeedsRefresh.emit({});
                });
        },
        onEsc: () => null,
    })
});
