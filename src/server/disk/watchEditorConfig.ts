import * as flm from "../workers/fileListing/fileListingMaster";
import * as fileModelCache from "./fileModelCache";

/**
 * Our global dictionary
 */
const watchedEditorConfigFiles: { [filePath: string]: boolean } = Object.create(null);

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

function watchedEditorConfigChanged() {
    fileModelCache.watchedEditorConfigChanged();
}
