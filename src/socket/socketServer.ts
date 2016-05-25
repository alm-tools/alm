import * as sls from "../socketLib/socketLibServer";
import * as contract from "./socketContract";
import http = require("http");
import https = require("https");
import * as fsu from "../server/utils/fsu";
import * as flm from "../server/workers/fileListing/fileListingMaster";
import * as workingDir from "../server/disk/workingDir";
import {FileModel} from "../server/disk/fileModel";
import * as gitService from "../server/workers/external/gitService";
import * as findAndReplaceMultiService from "../server/workers/external/findAndReplaceMultiService";
import * as session from "../server/disk/session";
import * as utils from "../common/utils";
let resolve = sls.resolve;

import * as fmc from "../server/disk/fileModelCache";
import * as activeProjectConfig from "../server/disk/activeProjectConfig";

import {errorsCache} from "../server/globalErrorCache";
import * as projectServiceMaster from "../server/workers/lang/projectServiceMaster";

/**
 * Support editing config files
 */
import * as jsonCompletions from "../server/lang/config/json/service/jsonCompletions";
import * as jsonHover from "../server/lang/config/jsonHover";

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
        return resolve({ contents: file.getContents(), saved: file.saved(), editorOptions: file.editorOptions });
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
    export var addFile: typeof contract.server.addFile = (data) => {
        let file = fmc.getOrCreateOpenFile(data.filePath, /*autoCreate*/ true);
        return resolve({ error: null });
    }
    export var addFolder: typeof contract.server.addFolder = (data) => {
        let file = fmc.addFolder(data.filePath);
        return resolve({ error: null });
    }
    export var deleteFromDisk: typeof contract.server.deleteFromDisk = (data) => {
        let file = fmc.deleteFromDisk(data);
        return resolve({ errors: [] });
    }
    export var duplicateFile: typeof contract.server.duplicateFile = (data) => {
        let file = fmc.duplicateFile(data);
        return resolve({ error: null });
    }
    export var duplicateDir: typeof contract.server.duplicateDir = (data) => {
        return fmc.duplicateDir(data).then(error=>{
            return {error};
        });
    }
    export var movePath: typeof contract.server.movePath = (data) => {
        return fmc.movePath(data).then(error=>{
            return {error};
        });
    }

    /**
     * Config stuff
     */
    export var availableProjects: typeof contract.server.availableProjects = (data) => {
        return activeProjectConfig.availableProjects.current();
    };
    export var getActiveProjectConfigDetails: typeof contract.server.getActiveProjectConfigDetails = (data) => {
        return activeProjectConfig.activeProjectConfigDetailsUpdated.current();
    };
    export var setActiveProjectConfigDetails: typeof contract.server.setActiveProjectConfigDetails = (data) => {
        activeProjectConfig.syncCore(data);
        return resolve({});
    };
    export var isFilePathInActiveProject: typeof contract.server.isFilePathInActiveProject = (data) => {
        return activeProjectConfig.projectFilePathsUpdated.current().then(res => {
            const inActiveProject = res.filePaths.some(fp => fp === data.filePath);
            return { inActiveProject };
        });
    };
    export var setOpenUITabs: typeof contract.server.setOpenUITabs = (data) => {
        session.setOpenUITabs(data.sessionId, data.tabLayout, data.selectedTabId);
        return resolve({});
    };
    export var getOpenUITabs: typeof contract.server.getOpenUITabs = (data) => {
        const result = session.getOpenUITabs(data.sessionId);
        return resolve(result);
    };
    export var activeProjectFilePaths: typeof contract.server.activeProjectFilePaths = (data) => {
        return activeProjectConfig.projectFilePathsUpdated.current();
    };
    export var sync: typeof contract.server.sync = (data) => {
        activeProjectConfig.sync();
        return resolve({});
    };
    export var setSetting: typeof contract.server.setSetting = (data) => {
        session.setSetting(data);
        return resolve({});
    };
    export var getSetting: typeof contract.server.getSetting = (data) => {
        return resolve(session.getSetting(data));
    };
    export var getValidSessionId: typeof contract.server.getValidSessionId = (data) => {
        return resolve(session.getValidSessionId(data.sessionId));
    };

    /**
     * Error handling
     */
    export var getErrors: typeof contract.server.getErrors = (data) => {
        return resolve(errorsCache.getErrorsLimited());
    }

    /**
     * Project service
     */
    export var getCompletionsAtPosition: typeof contract.server.getCompletionsAtPosition = (query) => {
        if (utils.isSupportedConfigFileForAutocomplete(query.filePath)) {
            return jsonCompletions.getCompletionsAtPosition(query);
        }
        else {
            return projectServiceMaster.worker.getCompletionsAtPosition(query);
        }
    }
    export var quickInfo : typeof contract.server.quickInfo = (query) => {
        if (utils.isSupportedConfigFileForHover(query.filePath)) {
            return jsonHover.getQuickInfo(query);
        }
        else {
            return projectServiceMaster.worker.quickInfo(query);
        }
    }
    export var getRenameInfo : typeof contract.server.getRenameInfo = projectServiceMaster.worker.getRenameInfo;
    export var getDefinitionsAtPosition : typeof contract.server.getDefinitionsAtPosition = projectServiceMaster.worker.getDefinitionsAtPosition;
    export var getDoctorInfo : typeof contract.server.getDoctorInfo = projectServiceMaster.worker.getDoctorInfo;
    export var getReferences : typeof contract.server.getReferences = projectServiceMaster.worker.getReferences;
    export var formatDocument : typeof contract.server.formatDocument = projectServiceMaster.worker.formatDocument;
    export var formatDocumentRange : typeof contract.server.formatDocumentRange = projectServiceMaster.worker.formatDocumentRange;
    export var getNavigateToItems : typeof contract.server.getNavigateToItems = projectServiceMaster.worker.getNavigateToItems;
    export var getDependencies : typeof contract.server.getDependencies = projectServiceMaster.worker.getDependencies;
    export var getAST : typeof contract.server.getAST = projectServiceMaster.worker.getAST;
    export var getQuickFixes : typeof contract.server.getQuickFixes = projectServiceMaster.worker.getQuickFixes;
    export var applyQuickFix : typeof contract.server.applyQuickFix = projectServiceMaster.worker.applyQuickFix;
    export var build: typeof contract.server.build = projectServiceMaster.worker.build;
    export var getSemanticTree: typeof contract.server.getSemanticTree = projectServiceMaster.worker.getSemanticTree;

    /**
     * Documentation browser
     */
    export var getTopLevelModuleNames : typeof contract.server.getTopLevelModuleNames = projectServiceMaster.worker.getTopLevelModuleNames;
    export var getUpdatedModuleInformation : typeof contract.server.getUpdatedModuleInformation = projectServiceMaster.worker.getUpdatedModuleInformation;

    /** UML Diagram */
    export var getUmlDiagramForFile : typeof contract.server.getUmlDiagramForFile = projectServiceMaster.worker.getUmlDiagramForFile;

    /**
     * Output Status
     */
    export const getCompleteOutputStatusCache: typeof contract.server.getCompleteOutputStatusCache =
        (data) => {
            return cast.completeOutputStatusCacheUpdated.current();
        }
    export const getLiveBuildResults: typeof contract.server.getLiveBuildResults =
        (data) => {
            return cast.liveBuildResults.current();
        }
    export const getJSOutputStatus: typeof contract.server.getJSOutputStatus = projectServiceMaster.worker.getJSOutputStatus;

    /**
     * Git service
     */
    export var gitStatus : typeof contract.server.gitStatus = gitService.gitStatus;
    export var gitReset : typeof contract.server.gitReset = gitService.gitReset;
    export var gitDiff : typeof contract.server.gitDiff = gitService.gitDiff;

    /**
     * FARM
     */
    export var startFarming : typeof contract.server.startFarming = findAndReplaceMultiService.startFarming;
    export var stopFarmingIfRunning : typeof contract.server.stopFarmingIfRunning = findAndReplaceMultiService.stopFarmingIfRunning;
    export var farmResults: typeof contract.server.farmResults = (query:{}) => findAndReplaceMultiService.farmResultsUpdated.current();
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.server = Server;

/** Will be available after register is called */
export let cast = contract.cast;

/** launch server */
export function register(app: http.Server | https.Server) {
    let runResult = sls.run({
        app,
        serverImplementation: Server,
        clientContract: contract.client,
        cast: contract.cast
    });
    cast = runResult.cast;

    /** File model */
    fmc.savedFileChangedOnDisk.pipe(cast.savedFileChangedOnDisk);
    fmc.didEdit.pipe(cast.didEdit);
    fmc.didStatusChange.pipe(cast.didStatusChange);
    fmc.editorOptionsChanged.pipe(cast.editorOptionsChanged);

    /** File listing updates */
    flm.filePathsUpdated.pipe(cast.filePathsUpdated);

    /** Active Project */
    activeProjectConfig.availableProjects.pipe(cast.availableProjectsUpdated);
    activeProjectConfig.activeProjectConfigDetailsUpdated.pipe(cast.activeProjectConfigDetailsUpdated);
    activeProjectConfig.projectFilePathsUpdated.pipe(cast.activeProjectFilePathsUpdated);
    activeProjectConfig.errorsInTsconfig.errorsDelta.on((delta) => errorsCache.applyDelta(delta));

    /** Errors */
    errorsCache.errorsUpdated.pipe(cast.errorsUpdated);

    /** FARM */
    findAndReplaceMultiService.farmResultsUpdated.pipe(cast.farmResultsUpdated);

    /** JS Output Status */
    cast.liveBuildResults.emit({builtCount:0,totalCount:0}); // for initial joiners
    cast.completeOutputStatusCacheUpdated.emit({}); // for initial joiners
    projectServiceMaster.fileOutputStatusUpdated.pipe(cast.fileOutputStatusUpdated);
    projectServiceMaster.completeOutputStatusCacheUpdated.pipe(cast.completeOutputStatusCacheUpdated);
    projectServiceMaster.liveBuildResults.pipe(cast.liveBuildResults);

    // For testing
    // setInterval(() => cast.hello.emit({ text: 'nice' }), 1000);
}
