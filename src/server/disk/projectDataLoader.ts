/**
 * We convert a `tsconfigFilePath` to a project in a background process
 * However because we might have files edited in main server memory the background process would need to query the master for *current* file contents
 * This can be slow (and can cause nasty deadlocks).
 * So we use this this `projectDataLoader` to load all the data upfront in the server memory and push it down to the worker
 */
import {FilePathWithContent, ProjectDataLoaded ,TypeScriptConfigFileDetails} from "../../common/types";
import * as fmc from "./fileModelCache";
import * as tsconfig from "../workers/lang/core/tsconfig";
import * as typescriptDir from "../workers/lang/core/typeScriptDir";
import * as types from "../../common/types";
import {AvailableProjectConfig} from "../../common/types";

/** Only call this if the file has been validated 🌹 */
export function getProjectDataLoaded(activeProjectConfigDetails: AvailableProjectConfig): ProjectDataLoaded {

    const {result: configFile} = tsconfig.getProjectSync(activeProjectConfigDetails.tsconfigFilePath);

    const response: ProjectDataLoaded = {
        configFile,
        filePathWithContents:[]
    };

    const addFile = (filePath:string) => {
        const contents = fmc.getOrCreateOpenFile(filePath).getContents();
        response.filePathWithContents.push({filePath,contents});
    };

    // Add the `lib` files
    const libFiles = typescriptDir.getDefaultLibFilePaths(configFile.project.compilerOptions);
    libFiles.map(addFile);

    // Add all the files
    configFile.project.files.forEach((filePath) => addFile(filePath));

    return response;
}
