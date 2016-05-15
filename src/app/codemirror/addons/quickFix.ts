/**
 * The git status plugin
 *
 * The best demo to understand this is the marker demo:
 * https://codemirror.net/demo/marker.html
 */
import * as CodeMirror from "codemirror";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";
import * as types from "../../../common/types";

const gutterId = "CodeMirror-quick-fix";
const gutterItemClassName = "CodeMirror-quick-fix-bulb";

require('./quickFix.css');
export function setupOptions(options: any) {
    options.gutters.unshift(gutterId);
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;

    function makeMarker() {
        var marker = document.createElement("div");
        marker.className = gutterItemClassName;
        marker.innerHTML = "💡";
        return marker;
    }
    /** Automatically clears any old marker */
    let _currentMarker: CodeMirror.LineHandle = null;
    function setMarker(line: number) {
        clearAnyMarker();
        const lineHandle = cm.setGutterMarker(line, gutterId, makeMarker());
        _currentMarker = lineHandle;
    }
    function clearAnyMarker() {
        if (_currentMarker){
            const newLine: number | null = (cm as any).getLineNumber(_currentMarker);
            if (newLine) {
                cm.setGutterMarker(newLine, gutterId, null);
            }
            _currentMarker = null;
        }
    }

    // The key quick fix get logic
    const refreshQuickFixes = () => {
        clearAnyMarker();

        // TODO:
        // If multi cursor return
        // If multi select return
        // If not active project return
        // query the server with quick fixes
        // Render the quick fixes

        const indentSize = cm.getOption('indentUnit');
    };

    const refreshQuickFixesDebounced = utils.debounce(refreshQuickFixes, 2000);

    const handleFocus = () => {
        refreshQuickFixes();
    }

    cm.on('focus', handleFocus);
    // Add a few other things to call refresh with debouncing
    cm.on('change', refreshQuickFixesDebounced);
    return {
        dispose: () => {
            cm.off('focus', handleFocus);
            cm.off('change', refreshQuickFixesDebounced);
            clearAnyMarker();
        }
    }
}
