/**
 * Provides a gutter based live analysis of the code
 * e.g. overridden members
 *
 * TODO: use the new endpoint
 *     : Update position of old markers like git status
 *     : Clear any absent markers and add any new markers
 *     : style the markers better using font awesome
 *     : import this file
 */
import * as CodeMirror from "codemirror";
import * as utils from "../../../common/utils";
import {server, cast} from "../../../socket/socketClient";
import * as types from "../../../common/types";
import * as state from "../../state/state";
import cmUtils = require("../cmUtils");
import {Types} from "../../../socket/socketContract";
import * as selectListView from "../../selectListView";
import * as commands from "../../commands/commands";
import * as ui from "../../ui";
import * as uix from "../../uix";
import * as React from "react";

const gutterId = "CodeMirror-live-analysis";
const gutterItemClassName = "CodeMirror-live-analysis-override";

require('./liveAnalysis.css');
export function setupOptions(options: any) {
    options.gutters.unshift(gutterId);
}

/**
 * Our addition to code mirror instances
 */
declare global {
    module CodeMirror {
        interface LineHandle { }
        interface Editor {
        }
    }
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;

    // Used in diffing markers
    let gutterDiffMap: {
        [line: number]: {
            override: types.UMLClassMember,
            handle: CodeMirror.LineHandle
        }
    } = Object.create(null);
    // We need to update the current gitDiffStatusMap as
    // because *CM markers move as lines get added / deleted*.
    function updateGutterDiffMap() {
        Object.keys(gutterDiffMap).forEach(_line => {
            const line = +_line;
            const {handle} = gutterDiffMap[line];
            const newLine: number | null = (cm as any).getLineNumber(handle);
            if (newLine == null) {
                delete gutterDiffMap[line];
            }
            else if (newLine !== line) {
                const old = gutterDiffMap[line];
                delete gutterDiffMap[line];
                gutterDiffMap[newLine] = old;
            }
            // else still good :)
        });
    }
    function clearGutterDiffMap() {
        updateGutterDiffMap();
        Object.keys(gutterDiffMap).forEach(_line => {
            const line = +_line;
            delete gutterDiffMap[line];
            cm.setGutterMarker(line, gutterId, null);
        })
    }

    function makeMarker(override: types.UMLClassMember) {
        var marker = document.createElement("div");
        marker.className = gutterItemClassName;
        marker.setAttribute('title', `Overrides a base class member. Click to open`);
        marker.innerHTML = " ";
        marker.onclick = () => {
            commands.doOpenOrFocusFile.emit({
                filePath: override.location.filePath,
                position: override.location.position
            });
        };
        return marker;
    }
    function setMarker(line: number, override: types.UMLClassMember) {
        const handle = cm.setGutterMarker(line, gutterId, makeMarker(override));
        gutterDiffMap[line] = {
            handle,
            override
        }
    }

    // The key quick fix get logic
    const refreshLiveAnalysis = () => {
        // If not active project return
        if (!state.inActiveProjectFilePath(cm.filePath)) {
            clearGutterDiffMap();
            return;
        }
        // query the server with live analysis
        server.getLiveAnalysis({
            filePath: cm.filePath,
        }).then(res => {
            // console.log(res); // DEBUG

            // So we know the diff map has current line numbers
            updateGutterDiffMap();

            // Add the new ones
            const newOnes: { [line: number]: boolean } = Object.create(null);
            res.overrides.forEach(override => {
                newOnes[override.line] = true;
                // If already there, then its probably right as well
                if (gutterDiffMap[override.line]) {
                    return;
                }
                // Otherwise add
                setMarker(override.line, override.overrides);
            });
            // Delete the invalid ones
            Object.keys(gutterDiffMap).forEach(_line => {
                const line = +_line;
                if (!newOnes[line]){
                    delete gutterDiffMap[line];
                    cm.setGutterMarker(line, gutterId, null);
                }
            })
        });
    };

    const refreshLiveAnalysisDebounced = utils.debounce(refreshLiveAnalysis, 3000);

    cm.on('focus', refreshLiveAnalysisDebounced);
    // Add a few other things to call refresh with debouncing
    cm.on('change', refreshLiveAnalysisDebounced);
    const disposeProjectWatch = cast.activeProjectConfigDetailsUpdated.on(() => {
        refreshLiveAnalysisDebounced();
    })
    return {
        dispose: () => {
            cm.off('focus', refreshLiveAnalysisDebounced);
            cm.off('change', refreshLiveAnalysisDebounced);
            disposeProjectWatch.dispose();
            clearGutterDiffMap();
        }
    }
}
