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

    /** Any file that is not a module adds to the global namespace */
    const globals: types.DocumentedType = {
        name: 'global',
        icon: types.IconType.Global,
        comment: 'The global namespace',
        subItems: []
    };

    for (let file of project.getProjectSourceFiles().filter(f=>!typescriptDir.isFileInTypeScriptDir(f.fileName))) {
        if (file.externalModuleIndicator) {
            const filePath = file.fileName;
            const {comment, subItems} = getSourceFileTypes(file)
            modules.push({
                name: fsu.makeRelativePath(project.configFile.projectFileDirectory, filePath),
                icon: types.IconType.Namespace,
                comment,
                subItems,
            });
            // TODO: there might still be global namespace contributions
        }
        else {
            getGlobalModuleContributions(file).forEach(dt => globals.subItems.push(dt));
        }
    }

    /** If we collected anything into the global namespace */
    if (globals.subItems.length) {
        modules.unshift(globals);
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

/**
 * Global module management
 */
export function getGlobalModuleContributions(file: ts.SourceFile): types.DocumentedType[] {
    // TODO: get global module contributions

    const result: types.DocumentedType[] = [];
    ts.forEachChild(file, (node) => {
        const kind = node.kind;
        const Kind = ts.SyntaxKind;
        if (kind == Kind.ClassDeclaration) {
            // TODO: put some code here :)
        }
    });
    return [];
}
