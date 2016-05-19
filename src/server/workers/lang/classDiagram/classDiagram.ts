/**
 * This is the backend for the class diagram view
 *
 * Based on the tsviz project https://github.com/joaompneves/tsviz 🌹
 */

/** Imports */
import * as tsAnalyzer from "./tsAnalyzer";
import * as utils from "../../../../common/utils";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

/**
 * Get a uml diagram structure for a file
 */
export function getUmlDiagramForFile(query: { filePath: string }) : Promise<{}> {
    let project = getProject();
    const sourceFile = project.getProjectSourceFiles().find(f => f.fileName === query.filePath);

    const modules = tsAnalyzer.collectInformation(project.languageService.getProgram(), sourceFile);

    return utils.resolve({});
}
