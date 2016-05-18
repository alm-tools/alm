/**
 * This file is the main entry for the for documentation view backend
 */
/** Imports */
import * as projectService from "../projectService";
import * as types from "../../../../common/types";
import {TypedEvent} from "../../../../common/events";
import * as utils from "../../../../common/utils";
import * as typescriptDir from "../core/typeScriptDir";
import * as fsu from "../../../utils/fsu";
import * as transformers from "./transformers";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

export function getTopLevelModuleNames(query: {}): Promise<types.GetTopLevelModuleNamesResponse> {
    let project = getProject();

    let getNodeKind = ts.getNodeKind;
    const files: types.DocumentedType[] = [];

    for (let sourceFile of project.getProjectSourceFiles().filter(f => !typescriptDir.isFileInTypeScriptDir(f.fileName))) {
        const {comment, subItems, icon, location} = transformers.transformSourceFile(sourceFile);
        const filePath = sourceFile.fileName;
        const name = fsu.removeExt(fsu.makeRelativePath(project.configFile.projectFileDirectory, filePath).substr(2))
        files.push({
            name,
            icon,
            comment,
            subItems,
            location,
        });
    }

    /** sort by filePath */
    files.sort((a, b) => a.name.localeCompare(b.name));

    const result: types.GetTopLevelModuleNamesResponse = { files };
    return utils.resolve(result);
}

/**
 * If a file is edited and you are showing the documentation for the file,
 * Its not a bad idea to call this function for updated information
 */
export function getUpdatedModuleInformation(query: { filePath: string }): Promise<types.DocumentedType> {
    let project = getProject();
    const sourceFile = project.getProjectSourceFiles().find(sf => sf.fileName == query.filePath);
    const {comment, subItems, icon, location} = transformers.transformSourceFile(sourceFile);
    const filePath = sourceFile.fileName;
    const name = fsu.removeExt(fsu.makeRelativePath(project.configFile.projectFileDirectory, filePath).substr(2))
    const result: types.DocumentedType = {
        name,
        icon,
        comment,
        subItems,
        location,
    };
    return utils.resolve(result);
}
