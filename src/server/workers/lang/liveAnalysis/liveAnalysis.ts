/**
 * Backend for the live analysis feature
 */
/** Imports */
import * as utils from "../../../../common/utils";
import * as types from "../../../../common/types";
import {getDocumentedTypeLocation} from "../modules/astUtils";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

export function getLiveAnalysis(query: types.LiveAnalysisQuery): Promise<types.LiveAnalysisResponse> {
    let project = activeProject.GetProject.getCurrentIfAny();
    var languageService = project.languageService;
    const filePath = query.filePath;
    const sourceFile = project.getProjectSourceFiles().find(f => f.fileName === query.filePath);

    const overrides: types.LiveAnalysisOverrideInfo[] = [];

    /** TODO: figure out overrides  */


    const result: types.LiveAnalysisResponse ={
        overrides
    }

    return utils.resolve(result);
}
