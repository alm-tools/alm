/**
 * Cases to handle:
 * - If the file updates we need to check if it is in the active project
 * 		If it is then we need to update the output status for that file
 * - If the active project changes we need to update *all* the statuses
 * - whenever the output status *changes* we need to send it to the client.
 */
import * as types from "../../../../common/types";
import * as activeProject from "../activeProject";
import * as events from "../../../../common/events";
import * as projectService from "../projectService";
import * as utils from "../../../../common/utils";

/**
 * Expose changes to the outside world
 */
export const fileOuputStatusUpdated = new events.TypedEvent<types.JSOutputStatus>();
export const completeOutputStatusCacheUpdated = new events.TypedEvent<types.JSOutputStatusCache>();

/**
 * Hot cache
 */
let outputStatusCache: types.JSOutputStatusCache = {};

/**
 * Subscribe to external changes
 */
export const fileEdited = utils.triggeredDebounce({
    func: (e: { filePath: string, edit: CodeEdit }) => {
        const res = projectService.getJSOutputStatus(e);
        if (!res.inActiveProject) return;

        const currentStatus = outputStatusCache[e.filePath];
        const newStatus = res.outputStatus;
        outputStatusCache[e.filePath] = newStatus;
        fileOuputStatusUpdated.emit(newStatus);
    },
    mustcall: (n, o) => {
        return o && o.filePath !== n.filePath;
    },
    milliseconds: 2000
});

export function fileChangedOnDisk(evt: { filePath: string; contents: string }) {
    // TODO:
    //     // clear whats there
    //     // Query the active project for new output. Diff and write it out
}
