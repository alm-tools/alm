/**
 * Controls the root directory we are working off of
 */

import * as fsu from "../utils/fsu";
import * as utils from "../../common/utils";
import * as settings from "./settings";
import {TypedEvent} from "../../common/events";

export const projectRootUpdated = new TypedEvent<{filePath:string}>();
let projectRoot = fsu.consistentPath(process.cwd());
projectRootUpdated.emit({filePath: projectRoot});

export function getProjectRoot() {
    return projectRoot;
}

export function setProjectRoot(rootDir: string) {
    projectRoot = fsu.consistentPath(rootDir);
    process.chdir(projectRoot);
    settings.addWorkingDir(projectRoot);
    projectRootUpdated.emit({filePath: projectRoot});
}

export function makeRelative(filePath: string) {
    return fsu.makeRelativePath(projectRoot, filePath);
}

export function makeAbsolute(relativeFilePath: string) {
    return fsu.resolve(projectRoot, relativeFilePath)
}

export function makeAbsoluteIfNeeded(filePathOrRelativeFilePath: string){
    if (!fsu.isAbsolute(filePathOrRelativeFilePath)){
        return makeAbsolute(filePathOrRelativeFilePath);
    }
    else {
        return fsu.consistentPath(filePathOrRelativeFilePath);
    }
}

export function makeRelativeUrl(url: string) {
    let {filePath, protocol} = utils.getFilePathAndProtocolFromUrl(url);
    let relativeFilePath = makeRelative(filePath);
    return utils.getUrlFromFilePathAndProtocol({ protocol, filePath: relativeFilePath });
}
export function makeAbsoluteUrl(relativeUrl: string) {
    let {filePath: relativeFilePath, protocol} = utils.getFilePathAndProtocolFromUrl(relativeUrl);
    let filePath = makeAbsolute(relativeFilePath);
    return utils.getUrlFromFilePathAndProtocol({ protocol, filePath });
}
