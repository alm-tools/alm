/**
 * The docs module provides utilities documenation comments
 */
import * as projectService from "../projectService";
import * as types from "../../../../common/types";
import {TypedEvent} from "../../../../common/events";
import * as utils from "../../../../common/utils";
import * as typescriptDir from "../core/typeScriptDir";
import * as fsu from "../../../utils/fsu";
import {getRawComment} from "./getRawComment";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

export function getTopLevelModuleNames(query: {}): Promise<types.GetTopLevelModuleNamesResponse> {
    let project = getProject();
    var languageService = project.languageService;

    let getNodeKind = ts.getNodeKind;
    const modules: types.DocumentedType[] = [];

    for (let file of project.getProjectSourceFiles().filter(f=>!typescriptDir.isFileInTypeScriptDir(f.fileName))) {
        const filePath = file.fileName;
        const {comment, subItems} = getSourceFileTypes(file)
        modules.push({
            name: fsu.makeRelativePath(project.configFile.projectFileDirectory, filePath),
            icon: types.IconType.Namespace,
            comment,
            subItems,
        });
    }

    const result: types.GetTopLevelModuleNamesResponse = { modules };
    return utils.resolve(result);
}

/**
 * Various visitors
 */
export function getSourceFileTypes(file: ts.SourceFile): {comment: string, subItems: types.DocumentedType[]} {
    const comment = getRawComment(file);
    return {
        comment,
        subItems: []
    };
}
