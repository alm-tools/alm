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
    cm.lastQuickFixInformation = null;

    function makeMarker() {
        var marker = document.createElement("div");
        marker.className = gutterItemClassName + ' hint--right hint--info';
        marker.setAttribute('data-hint', "Overrides a base class member");
        marker.innerHTML = "⬆️";
        marker.onclick = () => cm.execCommand(commands.additionalEditorCommands.quickFix);
        return marker;
    }
    /** Automatically clears any old marker */
    function setMarker(line: number, config: {
        fixes: Types.QuickFixDisplay[],
        indentSize: number,
        position: number
    }) {
        clearAnyPreviousMarkerLocation();
        cm.lastQuickFixInformation = {
            lineHandle: cm.setGutterMarker(line, gutterId, makeMarker()),
            fixes: config.fixes,
            indentSize: config.indentSize,
            position: config.position
        };
    }
    function clearAnyPreviousMarkerLocation() {
        if (cm.lastQuickFixInformation) {
            const newLine: number | null = (cm as any).getLineNumber(cm.lastQuickFixInformation.lineHandle);
            if (newLine != null) {
                cm.setGutterMarker(newLine, gutterId, null);
            }
            cm.lastQuickFixInformation = null;
        }
    }

    // The key quick fix get logic
    const refreshLiveAnalysis = () => {
        clearAnyPreviousMarkerLocation();

        // If not active project return
        if (!state.inActiveProjectFilePath(cm.filePath)) {
            return;
        }
        // query the server with live analysis
        server.getLiveAnalysis({
            filePath: cm.filePath,
        }).then(res => {
            // console.log(res); // DEBUG
            if (!res.overrides.length) {
                return;
            }
            res.overrides.forEach(overide => {

            });
            // TODO: set markers
            // setMarker(cur.line, { fixes: res.fixes, indentSize, position });
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
            clearAnyPreviousMarkerLocation();
        }
    }
}
