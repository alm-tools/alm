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
import * as project from "../core/project";

/**
 * Expose changes to the outside world
 */
export const fileOuputStatusUpdated = new events.TypedEvent<types.JSOutputStatus>();
export const completeOutputStatusCacheUpdated = new events.TypedEvent<types.JSOutputStatusCache>();

/**
 * Hot cache
 */
let outputStatusCache: types.JSOutputStatusCache = {};

const updateEmitForFile = utils.triggeredDebounce({
    func: (e: { filePath: string }) => {
        const res = projectService.getJSOutputStatus(e);
        if (!res.inActiveProject) return;

        const newStatus = res.outputStatus;
        outputStatusCache[e.filePath] = newStatus;
        fileOuputStatusUpdated.emit(newStatus);
    },
    mustcall: (n, o) => {
        return o && o.filePath !== n.filePath;
    },
    milliseconds: 1000
});

/**
 * Subscribe to external changes
 */
export const fileEdited = updateEmitForFile;
export const fileChangedOnDisk = updateEmitForFile;
export const fileSaved = updateEmitForFile;
export const doCompleteProjectCacheUpdate = (proj: project.Project) => {
    console.log('[EMIT] Starting');
    outputStatusCache = {};
    proj.getProjectSourceFiles().forEach(sf=>{
        const filePath = sf.fileName;
        const res = projectService.getJSOutputStatus({ filePath });
        outputStatusCache[filePath] = res.outputStatus;
    });
    completeOutputStatusCacheUpdated.emit(outputStatusCache);
    console.log('[EMIT] Complete');
}
