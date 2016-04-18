/**
 * We convert a `tsconfigFilePath` to a project in a background process
 * However because we might have files edited in main server memory the background process would need to query the master for *current* file contents
 * This can be slow (and can cause nasty deadlocks).
 * So we use this this `projectDataLoader` to load all the data upfront in the server memory and push it down to the worker
 */
import {FilePathWithContent, ProjectDataLoadedResponse} from "../../common/types";
import * as fmc from "./fileModelCache";
import * as tsconfig from "../workers/lang/core/tsconfig";

export function getProjectDataLoaded(tsconfigFilePath: string): ProjectDataLoadedResponse {
    // TODO:
    return {
        tsconfigFilePath,filePathWithContents:[]
    }
}
