import * as flm from "../workers/fileListing/fileListingMaster";

const watchedEditorConfigFiles = Object.create(null);

export function start() {
    flm.filePathsCompleted.on((res) => {
        // TODO:
        // Make sure we watch any `.editorconfig` files
    });
    flm.filePathsUpdated.on((res) => {
        // TODO:
        // Make sure we watch any `.editorconfig` files
    });
}
