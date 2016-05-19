import * as sw from "../../utils/simpleWorker";
import * as contract from "./projectServiceContract";
import * as activeProject from "./activeProject"
import * as outputStatusCache from "./cache/outputStatusCache"
import * as projectService from "./projectService";
import * as docs from "./docs/docs";

namespace Worker {
    export const echo: typeof contract.worker.echo = (data) => Promise.resolve(data);

    /**
     * This is sort of the entry point of the worker. Nothing really happens till this gets called
     */
    export const setActiveProjectConfigDetails: typeof contract.worker.setActiveProjectConfigDetails = (details) => {
        const proj = activeProject.setActiveProjectConfigDetails(details.projectData);
        return Promise.resolve({})
    }

    /** Build */
    export const build: typeof contract.worker.build = (details) => {
        const proj = activeProject.GetProject.getCurrentIfAny();
        outputStatusCache.doCompleteProjectCacheUpdate(proj);
        return Promise.resolve({})
    }

    /**
     * File information updates sent by the master. We tell the modules that care.
     */
    export const fileListingDelta: typeof contract.worker.fileListingDelta = (delta) => {
        activeProject.fileListingDelta(delta);
        return Promise.resolve({});
    }
    export const fileEdited: typeof contract.worker.fileEdited = (details) => {
        activeProject.fileEdited(details);
        outputStatusCache.fileEdited(details);
        return Promise.resolve({});
    }
    export const fileChangedOnDisk: typeof contract.worker.fileChangedOnDisk = (details) => {
        activeProject.fileChangedOnDisk(details);
        outputStatusCache.fileChangedOnDisk(details);
        return Promise.resolve({});
    }
    export const fileSaved: typeof contract.worker.fileSaved = (details) => {
        outputStatusCache.fileSaved(details);
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
    export var getQuickFixes : typeof contract.worker.getQuickFixes = projectService.getQuickFixes;
    export var applyQuickFix : typeof contract.worker.applyQuickFix = projectService.applyQuickFix;

    /**
     * Documentation Browser
     */
    export var getTopLevelModuleNames : typeof contract.worker.getTopLevelModuleNames = docs.getTopLevelModuleNames;
    export var getUpdatedModuleInformation : typeof contract.worker.getUpdatedModuleInformation = docs.getUpdatedModuleInformation;
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
outputStatusCache.fileOuputStatusUpdated.on((fileOuputStatusUpdate) => {
    return master.receiveFileOutputStatusUpdate(fileOuputStatusUpdate);
});
outputStatusCache.completeOutputStatusCacheUpdated.on((completeOutputStatusCacheUpdate) => master.receiveCompleteOutputStatusCacheUpdate(completeOutputStatusCacheUpdate));
outputStatusCache.liveBuildResults.on((liveBuildResults) => master.receiveLiveBuildResults(liveBuildResults));

/**
 * We send down the master to `activeProject` otherwise we get in a cyclic reference :-/
 * (activeProject needs us.master to read files) + (we need activeProject to tell it to set active project configuration)
 *
 * Similarly for `project` (project -> usedby -> activeProject -> used by us)
 */
activeProject.setMaster(master);
import * as project from "./core/project";
project.setMaster(master);
