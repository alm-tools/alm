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
    const filePath = cm.filePath;
    let interval = null;

    // The key Git diff logic
    const gitDiffStatusMap: {
        [line: number]: GitDiffStatus
    } = Object.create(null);
    const refreshGitStatus = utils.debounce(() => {
        server.gitDiff({filePath}).then(()=>{

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
