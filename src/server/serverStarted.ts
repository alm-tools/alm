import * as fslw from "./workers/fileListing/fileListingMaster";

export function started() {
    fslw.worker.setupWatch({ directory: process.cwd() });
}