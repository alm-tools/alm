/**
 * This file uses stuff from *other* components e.g. status bar (so don't import this file in such components)
 * and exposes stuff from them as an API to *some other* components
 */
import * as state from "./state/state";
import {RefactoringsByFilePath} from "../common/types";
import * as utils from "../common/utils";

namespace API {
    export function applyRefactorings(refactorings: RefactoringsByFilePath) {
        /** lookup all the *file* tabs that are open */
        let alreadyOpen = state.getState().tabs
            .filter(tab=>utils.getFilePathAndProtocolFromUrl(tab.url).protocol == 'file');

        let alreadyOpenFilePaths = alreadyOpen.map(x=> utils.getFilePathFromUrl(x.url));

        let wantedFilePaths = Object.keys(refactorings);

        let toOpen = wantedFilePaths.filter(x=> !!alreadyOpenFilePaths.find(ao=>ao == x));

        console.log(toOpen);
    }
}
