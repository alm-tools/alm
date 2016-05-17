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
        if (ts.isExternalModule(file)) {
            const filePath = file.fileName;
            const {comment, subItems} = getSourceFileTypes(file)
            modules.push({
                name: fsu.makeRelativePath(project.configFile.projectFileDirectory, filePath).substr(2),
                icon: types.IconType.Namespace,
                comment,
                subItems,
            });
            // TODO: there might still be global namespace contributions
        }
        else {
            getGlobalModuleContributions(file, languageService).forEach(dt => globals.subItems.push(dt));
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
export function getGlobalModuleContributions(file: ts.SourceFile, languageService: ts.LanguageService): types.DocumentedType[] {
    const result: types.DocumentedType[] = [];
    /** We just leverage the languageService.getNavigationBarItems to filter out the global stuff */
    const navBarItems = languageService.getNavigationBarItems(file.fileName);
    const globalNavBarItem = navBarItems.find(i => i.text == '<global>');
    if (globalNavBarItem) {
        globalNavBarItem.childItems.forEach(item => {
            const addition: types.DocumentedType = {
                name: item.text,
                icon: types.IconType.Global, // TODO: We need SyntaxKind to icon kind function
            };
            result.push(addition);
        });
    }
    const nonGlobalNavBarItems = navBarItems.filter(i => i.text !== '<global>');
    nonGlobalNavBarItems.forEach(item => {
        const addition: types.DocumentedType = {
            name: item.text,
            icon: types.IconType.Global, // TODO: We need SyntaxKind to icon kind function
        };
        result.push(addition);
    });
    return result;
}
