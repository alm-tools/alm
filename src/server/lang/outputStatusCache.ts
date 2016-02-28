/**
 * Cases to handle:
 * - If the file updates we need to check if it is in the active project
 * 		If it is then we need to update the output status for that file
 * - If the active project changes we need to update *all* the statuses
 * - whenever the output status *changes* we need to send it to the client.
 */
let outputStatus: { [index: string]: types.TSOuputStatus } = {};

import * as types from "../../common/types";
import * as fileModelCache from "../disk/fileModelCache";
