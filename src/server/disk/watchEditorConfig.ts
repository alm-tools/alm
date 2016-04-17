import * as flm from "../workers/fileListing/fileListingMaster";
import * as fileModelCache from "./fileModelCache";
import * as chokidar from "chokidar";

/**
 * Our global dictionary
 */
const watchedEditorConfigFiles: { [filePath: string]: boolean } = Object.create(null);

function watchEditorConfigIfNotAlreadyWatching(filePath: string) {
    if (watchedEditorConfigFiles[filePath]) return;
    watchedEditorConfigFiles[filePath] = true;
    const fsWatcher = chokidar.watch(filePath, { ignoreInitial: true });
    fsWatcher.on('change', watchedEditorConfigChanged);
}

export function start() {
    flm.filePathsCompleted.on((res) => {
        // Make sure we watch any `.editorconfig` files
        res.filePaths
            .filter(fp => fp.filePath.endsWith('.editorconfig'))
            .map(fp => fp.filePath)
            .forEach(watchEditorConfigIfNotAlreadyWatching);
    });
    flm.filePathsUpdated.on((res) => {
        // Make sure we watch any `.editorconfig` files
        res.filePaths
            .filter(fp => fp.filePath.endsWith('.editorconfig'))
            .map(fp => fp.filePath)
            .forEach(watchEditorConfigIfNotAlreadyWatching);
    });
}

function watchedEditorConfigChanged() {
    fileModelCache.watchedEditorConfigChanged();
}
