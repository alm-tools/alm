import * as commands from "../commands";
import * as ui from "../../ui";
import * as selectListView from "../../selectListView";

commands.openFileFromDisk.on(() => {
    ui.comingSoon("Open a file from the server disk");
    selectListView.selectListView.show({
        header:'Open a file from server disk',
        data: [],
        render: (filePath, matched)=> matched,
        textify: (filePath) => filePath,
        onSelect: (filePath) => {
            commands.doOpenOrFocusFile.emit({ filePath });
            return '';
        },
        getNewData:(filterValue) => {
            // TODO:
            return Promise.resolve([]);
        }
    })
});
