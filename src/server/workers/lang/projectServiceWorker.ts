import * as sw from "../../utils/simpleWorker";
import * as contract from "./projectServiceContract";
import * as activeProject from "./activeProject"
import * as projectService from "./projectService";

namespace Worker {
    export const echo: typeof contract.worker.echo = (data) => Promise.resolve(data);
    export const setActiveProjectConfigDetails: typeof contract.worker.setActiveProjectConfigDetails = (details) => {
        activeProject.setActiveProjectConfigDetails(details.activeProjectConfigDetails);
        return Promise.resolve({});
    }

    /**
     * File information updates sent by the master. We tell the modules that care.
     */
    export const filePathsUpdated: typeof contract.worker.filePathsUpdated = (details) => {
        activeProject.filePathsUpdated();
        return Promise.resolve({});
    }
    export const fileEdited: typeof contract.worker.fileEdited = (details) => {
        activeProject.fileEdited(details);
        return Promise.resolve({});
    }
    export const fileChangedOnDisk: typeof contract.worker.fileChangedOnDisk = (details) => {
        activeProject.fileChangedOnDisk(details);
        return Promise.resolve({});
    }

    /**
     * Project Service
     */
    export var getCompletionsAtPosition : typeof contract.worker.getCompletionsAtPosition = projectService.getCompletionsAtPosition;
    export var quickInfo : typeof contract.worker.quickInfo = projectService.quickInfo;
    export var getRenameInfo : typeof contract.worker.getRenameInfo = projectService.getRenameInfo;
    export var getDefinitionsAtPosition : typeof contract.worker.getDefinitionsAtPosition = projectService.getDefinitionsAtPosition;
    export var getDoctorInfo : typeof contract.worker.getDoctorInfo = projectService.getDoctorInfo;
    export var getReferences : typeof contract.worker.getReferences = projectService.getReferences;
    export var formatDocument : typeof contract.worker.formatDocument = projectService.formatDocument;
    export var formatDocumentRange : typeof contract.worker.formatDocumentRange = projectService.formatDocumentRange;
    export var getNavigateToItems : typeof contract.worker.getNavigateToItems = projectService.getNavigateToItems;
    export var getDependencies : typeof contract.worker.getDependencies = projectService.getDependencies;
    export var getAST : typeof contract.worker.getAST = projectService.getAST;
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});


/**
 * Keep the master in sync with some important stuff
 */
import * as tsErrorsCache from "./cache/tsErrorsCache";
tsErrorsCache.errorsCache.errorsDelta.on((delta) => master.receiveErrorCacheDelta(delta));
import {fileOuputStatusUpdated} from "./cache/outputStatusCache";
fileOuputStatusUpdated.on((fileOuputStatusUpdate) => master.receiveFileOuputStatusUpdate(fileOuputStatusUpdate));
import {completeOutputStatusCacheUpdated} from "./cache/outputStatusCache";
completeOutputStatusCacheUpdated.on((completeOutputStatusCacheUpdate) => master.receiveCompleteOutputStatusCacheUpdate(completeOutputStatusCacheUpdate));

/**
 * We send down the master to `activeProject` otherwise we get in a cyclic reference :-/
 * (activeProject needs us.master to read files) + (we need activeProject to tell it to set active project configuration)
 *
 * Similarly for `project` (project -> usedby -> activeProject -> used by us)
 */
activeProject.setMaster(master);
import * as project from "./core/project";
project.setMaster(master);
