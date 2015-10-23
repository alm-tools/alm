/**
 * The stuff from project that the frontend queries.
 * Stuff like autocomplete is a good example.
 * Errors etc are pushed automatically from `activeProject` and do not belong here :)
 */

import * as activeProject from "./activeProject";
let getProject = activeProject.getProjectIfCurrentOrErrorOut;

import {Types} from "../../socket/socketContract";

import * as utils from "../../common/utils";
let {resolve} = utils;

export function getCompletionsAtPosition(query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    let proj = getProject(query.filePath);
    return resolve({
        completions: [],
        endsInPunctuation: false
    });
}
