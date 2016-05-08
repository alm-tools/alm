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
    Added = 1,
    Removed,
    Modified
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;

    function makeMarker(className: string) {
        var marker = document.createElement("div");
        marker.className = className;
        if (className === removedClass){
            marker.innerHTML = "●";
        }
        else {
            marker.innerHTML = "&nbsp";
        }
        return marker;
    }
    /** Automatically clears any old marker */
    function setMarker(line: number, className: string) {
        cm.setGutterMarker(line, gutterId, makeMarker(className));
    }
    function clearMarker(line: number){
        cm.setGutterMarker(line, gutterId, null);
    }

    // The key Git diff logic
    let gitDiffStatusMap: {
        [line: number]: GitDiffStatus
    } = Object.create(null);
    const refreshGitStatus = () => {
        server.gitDiff({filePath}).then((res)=>{
            // Create new map
            const newGitDiffStatusMap: typeof gitDiffStatusMap = Object.create(null);

            // Add to new
            res.added.forEach(added => {
                for (let line = added.from; line <= added.to; line++) {
                    if (gitDiffStatusMap[line] !== GitDiffStatus.Added) {
                        setMarker(line, addedClass);
                    }
                    newGitDiffStatusMap[line] = GitDiffStatus.Added;
                }
            });
            res.modified.forEach(modified => {
                for (let line = modified.from; line <= modified.to; line++) {
                    if (gitDiffStatusMap[line] !== GitDiffStatus.Modified) {
                        setMarker(line, modifiedClass);
                    }
                    newGitDiffStatusMap[line] = GitDiffStatus.Modified;
                }
            });
            res.removed.forEach(line => {
                if (gitDiffStatusMap[line] !== GitDiffStatus.Removed) {
                    setMarker(line, removedClass);
                }
                newGitDiffStatusMap[line] = GitDiffStatus.Removed;
            });

            // Clean any excessive markers
            Object.keys(gitDiffStatusMap).forEach(_line => {
                const line = +_line;
                if (!newGitDiffStatusMap[line]){
                    clearMarker(line);
                }
            });

            // New is now the old
            gitDiffStatusMap = newGitDiffStatusMap;
        });
    };

    const refreshGitStatusDebounced = utils.debounce(refreshGitStatus, 500);

    const handleFocus = () => {
        refreshGitStatus();
    }

    cm.on('focus', handleFocus);
    // Add a few other things to call refreshGitStatus with debouncing
    cm.on('change', refreshGitStatusDebounced);
    return {
        dispose: () => {
            cm.off('focus', handleFocus);
            cm.off('change', refreshGitStatusDebounced);
        }
    }
}
