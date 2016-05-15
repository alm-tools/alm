/**
 * The quick fix (bulb) plugin
 */
import * as CodeMirror from "codemirror";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";
import * as types from "../../../common/types";
import * as state from "../../state/state";
import cmUtils = require("../cmUtils");
import {Types} from "../../../socket/socketContract";
import * as selectListView from "../../selectListView";
import * as commands from "../../commands/commands";
import * as ui from "../../ui";
import * as uix from "../../uix";
import * as React from "react";

const gutterId = "CodeMirror-quick-fix";
const gutterItemClassName = "CodeMirror-quick-fix-bulb";

require('./quickFix.css');
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
            lastQuickFixInformation: {
                lineHandle: CodeMirror.LineHandle,
                fixes: Types.QuickFixDisplay[],
                indentSize: number,
                position: number,
            } | null
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
        marker.setAttribute('data-hint', "Quick Fix");
        marker.innerHTML = "💡";
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
    const refreshQuickFixes = () => {
        clearAnyPreviousMarkerLocation();

        // If !singleCursor return
        let singleCursor = cmUtils.isSingleCursor(cm);
        if (!singleCursor) {
            return;
        }
        // If not active project return
        if (!state.inActiveProjectFilePath(cm.filePath)) {
            return;
        }
        // query the server with quick fixes
        const cur = cm.getDoc().getCursor();
        const indentSize = cm.getOption('indentUnit');
        const position = cm.getDoc().indexFromPos(cur);
        server.getQuickFixes({
            indentSize,
            filePath: cm.filePath,
            position
        }).then(res=>{
            // console.log(res); // DEBUG
            if (cm.getDoc().getCursor().line !== cur.line) {
                return;
            }
            if (!res.fixes.length) {
                return;
            }
            setMarker(cur.line, { fixes: res.fixes, indentSize, position });
        });
    };

    const refreshQuickFixesDebounced = utils.debounce(refreshQuickFixes, 1000);

    const handleFocus = () => {
        refreshQuickFixes();
    }

    cm.on('focus', handleFocus);
    // Add a few other things to call refresh with debouncing
    cm.on('change', refreshQuickFixesDebounced);
    cm.on('cursorActivity', refreshQuickFixesDebounced);
    return {
        dispose: () => {
            cm.off('focus', handleFocus);
            cm.off('change', refreshQuickFixesDebounced);
            cm.off('cursorActivity', refreshQuickFixesDebounced);
            clearAnyPreviousMarkerLocation();
        }
    }
}

CodeMirror.commands[commands.additionalEditorCommands.quickFix] = (cm: CodeMirror.EditorFromTextArea) => {
    if (!cm.lastQuickFixInformation) {
        ui.notifyInfoNormalDisappear('No active quick fixes for last editor position');
        return;
    }
    const fixes = cm.lastQuickFixInformation.fixes;
    selectListView.selectListView.show({
        header:'💡 Quick Fixes',
        data: fixes,
        render: (fix, highlighted) => {
            return <div style={{fontFamily:'monospace'}}>{highlighted}</div>;
        },
        textify: (fix) => fix.display,
        onSelect: (fix) => {
            server.applyQuickFix({
                key: fix.key,
                indentSize: cm.lastQuickFixInformation.indentSize,
                additionalData: null,
                filePath: cm.filePath,
                position: cm.lastQuickFixInformation.position
            }).then((res)=>{
                // TODO: apply refactorings
                // console.log('Apply refactorings:', res.refactorings); // DEBUG
                uix.API.applyRefactorings(res.refactorings);
            })
        }
    });
}
