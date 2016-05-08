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

const gutterId = "CodeMirror-git-status";
const addedClass = "git-added";
const removedClass = "git-removed";
const modifiedClass = "git-modified";

require('./gitStatus.css');
export function setupOptions(options: any, filePath: string) {
    options.gutters.unshift(gutterId);
}

enum GitDiffStatus  {
    Added,
    Removed,
    Modified
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;
    let interval = null;

    function makeMarker(className: string) {
        var marker = document.createElement("div");
        marker.className = className;
        marker.innerHTML = "●";
        return marker;
    }

    // The key Git diff logic
    let gitDiffStatusMap: {
        [line: number]: GitDiffStatus
    } = Object.create(null);
    const refreshGitStatus = utils.debounce(() => {
        server.gitDiff({filePath}).then((res)=>{
            // Clear all old
            // TODO: don't delete if its in the new one as well and is same type
            Object.keys(gitDiffStatusMap).forEach(line => {
                cm.setGutterMarker(line, gutterId, null);
            });
            gitDiffStatusMap = Object.create(null);
            // Add new
            res.added.forEach(added => {
                for (let line = added.from; line <= added.to; line++) {
                    if (!gitDiffStatusMap[line]) {
                        cm.setGutterMarker(line, gutterId, makeMarker(addedClass));
                        gitDiffStatusMap[line] = GitDiffStatus.Added;
                    }
                }
            });
        });
    }, 2000);


    const handleFocus = () => {
        interval = setInterval(refreshGitStatus, 2000);
    }
    const handleBlur = () => {
        if (interval) clearInterval(interval);
        interval = null;
    }
    cm.on('focus', handleFocus);
    cm.on('blur', handleBlur);
    // Add a few other things to call refreshGitStatus so we don't call it if user is doing stuff
    cm.on('change', refreshGitStatus);
    cm.on('cursorActivity', refreshGitStatus);
    return {
        dispose: () => {
            cm.off('focus', handleFocus);
            cm.off('blur', handleFocus);
            cm.off('change', refreshGitStatus);
            cm.off('cursorActivity', refreshGitStatus);
        }
    }
}
