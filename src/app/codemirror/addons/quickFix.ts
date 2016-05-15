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


const gutterId = "CodeMirror-quick-fix";
const gutterItemClassName = "CodeMirror-quick-fix-bulb";

require('./quickFix.css');
export function setupOptions(options: any) {
    options.gutters.unshift(gutterId);
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;
    let lastQuickFixInformation: {
        lineHandle: CodeMirror.LineHandle,
        fixes: Types.QuickFixDisplay[]
    } = null;

    function makeMarker() {
        var marker = document.createElement("div");
        marker.className = gutterItemClassName + ' hint--right hint--info';
        marker.setAttribute('data-hint', "Quick Fix");
        marker.innerHTML = "💡";
        return marker;
    }
    /** Automatically clears any old marker */
    function setMarker(line: number, fixes: Types.QuickFixDisplay[]) {
        clearAnyPreviousMarkerLocation();
        lastQuickFixInformation = {
            lineHandle: cm.setGutterMarker(line, gutterId, makeMarker()),
            fixes
        };
    }
    function clearAnyPreviousMarkerLocation() {
        if (lastQuickFixInformation) {
            const newLine: number | null = (cm as any).getLineNumber(lastQuickFixInformation.lineHandle);
            if (newLine != null) {
                cm.setGutterMarker(newLine, gutterId, null);
            }
            lastQuickFixInformation = null;
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
            console.log(res);
            if (res.fixes.length) {
                setMarker(cur.line, res.fixes);
            }
            // TODO:
            // Render the quick fixes
        });
    };

    const refreshQuickFixesDebounced = utils.debounce(refreshQuickFixes, 2000);

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
