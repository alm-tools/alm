import * as sls from "../socketLib/socketLibServer";
import * as contract from "./socketContract";
import http = require("http");
import * as fsu from "../server/utils/fsu";
import * as flm from "../server/workers/fileListing/fileListingMaster";
import * as workingDir from "../server/disk/workingDir";
import {FileModel} from "../server/disk/fileModel";
import * as activeProject from "../server/lang/activeProject";
import * as projectService from "../server/lang/projectService";
import * as gitService from "../server/lang/gitService";
import * as session from "../server/disk/session";
let resolve = sls.resolve;

import * as fmc from "../server/disk/fileModelCache";
import * as errorCache from "../server/lang/errorsCache";

namespace Server {
    export var echo: typeof contract.server.echo = (data, client) => {
        console.log('Echo request received:', data);
        return client.increment({ num: data.num }).then((res) => {
            return {
                text: data.text,
                num: res.num
            };
        });
    }

    export var filePaths: typeof contract.server.filePaths = (data) => {
        return flm.filePathsUpdated.current().then(res=> ({ filePaths: res.filePaths, completed: res.completed, rootDir: res.rootDir }));
    }

    export var makeAbsolute: typeof contract.server.makeAbsolute = (data) => {
        return Promise.resolve({ filePath: workingDir.makeAbsolute(data.relativeFilePath) });
    }

    /**
     * File stuff
     */
    export var openFile: typeof contract.server.openFile = (data) => {
        let file = fmc.getOrCreateOpenFile(data.filePath, /*autoCreate*/ true);
        return resolve({ contents: file.getContents(), saved: file.saved() });
    }
    export var closeFile: typeof contract.server.openFile = (data) => {
        fmc.closeOpenFile(data.filePath);
        return resolve({});
    }
    export var editFile: typeof contract.server.editFile = (data) => {
        let file = fmc.getOrCreateOpenFile(data.filePath);
        let {saved} = file.edit(data.edit);
        // console.log('-------------------------');
        // console.log(file.getContents());
        return resolve({ saved });
    }
    export var saveFile: typeof contract.server.saveFile = (data) => {
        fmc.saveOpenFile(data.filePath);
        return resolve({});
    }
    export var getFileStatus: typeof contract.server.openFile = (data) => {
        let file = fmc.getOrCreateOpenFile(data.filePath, /*autoCreate*/ true);
        return resolve({ saved: file.saved() });
    }
    export var addFile: typeof contract.server.addFile = (data)=>{
        let file = fmc.getOrCreateOpenFile(data.filePath, /*autoCreate*/ true);
        return resolve({ error: null });
    }

    /**
     * Config stuff
     */
    export var availableProjects: typeof contract.server.availableProjects = (data) => {
        return activeProject.availableProjects.current();
    };
    export var getActiveProjectConfigDetails: typeof contract.server.getActiveProjectConfigDetails = (data) => {
        return activeProject.activeProjectConfigDetailsUpdated.current();
    };
    export var setActiveProjectConfigDetails: typeof contract.server.setActiveProjectConfigDetails = (data) => {
        activeProject.setActiveProjectConfigDetails(data);
        return resolve({});
    };
    export var isFilePathInActiveProject: typeof contract.server.isFilePathInActiveProject = (data) => {
        let inActiveProject = !!activeProject.GetProject.ifCurrent(data.filePath);
        return resolve({inActiveProject});
    };
    export var setOpenUITabs: typeof contract.server.setOpenUITabs = (data) => {
        session.setOpenUITabs(data.openTabs);
        return resolve({});
    };
    export var getOpenUITabs: typeof contract.server.getOpenUITabs = (data) => {
        return resolve(session.getOpenUITabs());
    };
    export var activeProjectFilePaths: typeof contract.server.activeProjectFilePaths = (data) => {
        return activeProject.activeProjectFilePathsUpdated.current();
    };

    /**
     * Error handling
     */
    export var getErrors: typeof contract.server.getErrors = (data) => {
        return resolve(errorCache.getErrors());
    }

    /**
     * Project service
     */
    export var getCompletionsAtPosition : typeof contract.server.getCompletionsAtPosition = projectService.getCompletionsAtPosition;
    export var quickInfo : typeof contract.server.quickInfo = projectService.quickInfo;
    export var getRenameInfo : typeof contract.server.getRenameInfo = projectService.getRenameInfo;
    export var getDefinitionsAtPosition : typeof contract.server.getDefinitionsAtPosition = projectService.getDefinitionsAtPosition;
    export var getDoctorInfo : typeof contract.server.getDoctorInfo = projectService.getDoctorInfo;
    export var getReferences : typeof contract.server.getReferences = projectService.getReferences;
    export var formatDocument : typeof contract.server.formatDocument = projectService.formatDocument;
    export var formatDocumentRange : typeof contract.server.formatDocumentRange = projectService.formatDocumentRange;
    export var getNavigateToItems : typeof contract.server.getNavigateToItems = projectService.getNavigateToItems;
    export var getDependencies : typeof contract.server.getDependencies = projectService.getDependencies;
    export var getAST : typeof contract.server.getAST = projectService.getAST;

    /**
     * Git service
     */
    export var gitStatus : typeof contract.server.gitStatus = gitService.gitStatus;
    export var gitReset : typeof contract.server.gitReset = gitService.gitReset;
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.server = Server;

/** Will be available after register is called */
export var cast = contract.cast;

/** launch server */
export function register(app: http.Server) {
    let runResult = sls.run({
        app,
        serverImplementation: Server,
        clientContract: contract.client,
        cast: contract.cast
    });
    cast = runResult.cast;

    fmc.savedFileChangedOnDisk.pipe(cast.savedFileChangedOnDisk);
    fmc.didEdit.pipe(cast.didEdit);
    fmc.didStatusChange.pipe(cast.didStatusChange);

    flm.filePathsUpdated.pipe(cast.filePathsUpdated);

    errorCache.errorsUpdated.pipe(cast.errorsUpdated);
    activeProject.availableProjects.pipe(cast.availableProjectsUpdated);
    activeProject.activeProjectConfigDetailsUpdated.pipe(cast.activeProjectConfigDetailsUpdated);
    activeProject.activeProjectFilePathsUpdated.pipe(cast.activeProjectFilePathsUpdated);

    // For testing
    // setInterval(() => cast.hello.emit({ text: 'nice' }), 1000);
}
