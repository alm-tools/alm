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

/** Some other analysis modules we depend on */
import * as umlDiagram  from "../umlDiagram/umlDiagram";

export function getLiveAnalysis(query: types.LiveAnalysisQuery): Promise<types.LiveAnalysisResponse> {
    const filePath = query.filePath;
    const project = activeProject.GetProject.getCurrentIfAny();
    const program = project.languageService.getProgram();
    const sourceFile = project.getProjectSourceFiles().find(f => f.fileName === query.filePath);


    /** Figure out overrides  */
    const overrides: types.LiveAnalysisOverrideInfo[] = [];
    const classes = umlDiagram.getClasses({ sourceFile, program });
    classes.forEach(c => {
        c.members.forEach(m => {
            if (m.override) {
                const override = m.override;
                overrides.push({
                    line: m.location.position.line,
                    overrides: override
                })
            }
        })
    })

    const result: types.LiveAnalysisResponse ={
        overrides
    }

    return utils.resolve(result);
}
