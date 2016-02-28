/**
 * Cases to handle:
 * - If the file updates we need to check if it is in the active project
 * 		If it is then we need to update the output status for that file
 * - If the active project changes we need to update *all* the statuses
 * - whenever the output status *changes* we need to send it to the client.
 */
let outputStatus: types.JSOuputStatusCache = {};

import * as types from "../../common/types";
import * as fileModelCache from "../disk/fileModelCache";
import * as activeProject from "./activeProject";
import * as events from "../../common/events";
import * as projectService from "./projectService";

/**
 * Subscribe to external changes
 */
fileModelCache.didEdit.on(()=>{
    // TODO:
    // Check if in active project
    // Clear whats there for the file
    // Query the active project for new output. Diff and write it out
});
activeProject.activeProjectConfigDetailsUpdated.on(()=>{
    // TODO:
    // clear whats there
    // Query the active project for new output. Diff and write it out
});

/**
 * Expose changes to the outside world
 */
export const fileOuputStatusUpdated = new events.TypedEvent<types.JSOutputStatus>();
export const completeCacheUpdated = new events.TypedEvent<types.JSOuputStatusCache>();
