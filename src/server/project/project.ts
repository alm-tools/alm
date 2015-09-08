import * as fsu from "../utils/fsu";

let projectRoot = process.cwd();

export function getProjectRoot() {
    return projectRoot;
}

export function setProjectRoot(rootDir: string) {
    projectRoot = rootDir;
    process.chdir(projectRoot);
}

export function makeRelative(filePath: string) {
    return fsu.makeRelativePath(projectRoot, filePath);
}

export function makeAbsolute(relativeFilePath: string) {
    return fsu.resolve(projectRoot, relativeFilePath)
}