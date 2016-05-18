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
import {getRawComment} from "./getRawComment";
import * as transformers from "./transformers";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

export function getTopLevelModuleNames(query: {}): Promise<types.GetTopLevelModuleNamesResponse> {
    let project = getProject();
    var languageService = project.languageService;

    let getNodeKind = ts.getNodeKind;
    const modules: types.DocumentedType[] = [];

    /** Any file that is not a module adds to the global namespace */
    const globals: types.DocumentedType = {
        name: 'Global',
        icon: types.IconType.Global,
        comment: 'The global namespace. All the files that are not modules contribute to this.',
        subItems: []
    };

    for (let file of project.getProjectSourceFiles().filter(f=>!typescriptDir.isFileInTypeScriptDir(f.fileName))) {
        const {comment, subItems} = transformers.transformSourceFile(file);

        if (ts.isExternalModule(file)) {
            const filePath = file.fileName;
            modules.push({
                name: fsu.removeExt(fsu.makeRelativePath(project.configFile.projectFileDirectory, filePath).substr(2)),
                icon: types.IconType.Namespace,
                comment,
                subItems,
            });
            /** TODO: there might still be global namespace contributions */
        }
        else {
            subItems.forEach(si => globals.subItems.push(si));
        }
    }

    /** TODO: sort recursively */

    /** If we collected anything into the global namespace */
    if (globals.subItems.length) {
        modules.unshift(globals);
    }
    const result: types.GetTopLevelModuleNamesResponse = { modules };
    return utils.resolve(result);
}
