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

/** Provides cm.annotateScrollbar */
require("codemirror/addon/scroll/annotatescrollbar");
declare global {
    module CodeMirror {
        interface Position { } // Already declared elsewhere
        interface Annotation {
            update(annotations: { from: CodeMirror.Position; to: CodeMirror.Position }[]);
            clear();
        }
        interface Editor {
            annotateScrollbar(options: { className: string } | string): Annotation;
        }
    }
}

const gutterId = "CodeMirror-git-status";
const addedClass = "git-added";
const removedClass = "git-removed";
const modifiedClass = "git-modified";

require('./gitStatus.css');
export function setupOptions(options: any) {
    options.gutters.unshift(gutterId);
}

enum GitDiffStatus {
    Added = 1,
    Removed,
    Modified
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;

    const scrollbar = {
        added: cm.annotateScrollbar('git-scrollbar-added'),
        modified: cm.annotateScrollbar('git-scrollbar-modified'),
        removed: cm.annotateScrollbar('git-scrollbar-removed'),
    }

    function makeMarker(className: string) {
        var marker = document.createElement("div");
        marker.className = className;
        if (className === removedClass) {
            marker.innerHTML = "●";
        }
        else {
            marker.innerHTML = "&nbsp";
        }
        return marker;
    }
    /** Automatically clears any old marker */
    function setMarker(line: number, className: string) {
        const lineHandle = cm.setGutterMarker(line, gutterId, makeMarker(className));
        return lineHandle;
    }
    function clearMarker(line: number) {
        cm.setGutterMarker(line, gutterId, null);
    }

    // The key Git diff logic
    let gitDiffStatusMap: {
        [line: number]: {
            type: GitDiffStatus,
            handle: CodeMirror.LineHandle
        }
    } = Object.create(null);
    const refreshGitStatus = () => {
        server.gitDiff({ filePath }).then((res) => {
            // Since this function is debounced and async the true editor text might
            // not be what the server thought. So we might have lines out of bounds in the response.
            // Lets fix that
            const maxLineNumber = cm.getDoc().lineCount() - 1;
            res.added = res.added.filter(x => {
                return x.from <= maxLineNumber
            });
            res.modified = res.modified.filter(x => {
                return x.from <= maxLineNumber
            });
            res.removed = res.removed.filter(x => {
                return x <= maxLineNumber
            });
            res.added.forEach(x => {
                if (x.to > maxLineNumber) {
                    x.to = maxLineNumber;
                }
            });
            res.modified.forEach(x => {
                if (x.to > maxLineNumber) {
                    x.to = maxLineNumber;
                }
            });

            // We need to update the current gitDiffStatusMap as
            // because *CM markers move as lines get added / deleted*.
            Object.keys(gitDiffStatusMap).forEach(_line => {
                const line = +_line;
                const {type, handle} = gitDiffStatusMap[line];
                const newLine: number | null = (cm as any).getLineNumber(handle);
                if (newLine == null) {
                    delete gitDiffStatusMap[line];
                }
                else if (newLine !== line) {
                    const old = gitDiffStatusMap[line];
                    delete gitDiffStatusMap[line];
                    gitDiffStatusMap[newLine] = old;
                }
                // else still good :)
            });

            // Create new map
            const newGitDiffStatusMap: typeof gitDiffStatusMap = Object.create(null);

            // Add to new
            res.added.forEach(added => {
                for (let line = added.from; line < added.to; line++) {
                    if (!gitDiffStatusMap[line]
                        || gitDiffStatusMap[line].type !== GitDiffStatus.Added) {
                        const handle = setMarker(line, addedClass);
                        newGitDiffStatusMap[line] = {
                            type: GitDiffStatus.Added,
                            handle: handle
                        };
                    }
                    else {
                        newGitDiffStatusMap[line] = gitDiffStatusMap[line];
                    }
                }
            });
            res.modified.forEach(modified => {
                for (let line = modified.from; line < modified.to; line++) {
                    if (!gitDiffStatusMap[line]
                        || gitDiffStatusMap[line].type !== GitDiffStatus.Modified) {
                        const handle = setMarker(line, modifiedClass);
                        newGitDiffStatusMap[line] = {
                            type: GitDiffStatus.Modified,
                            handle: handle
                        };
                    }
                    else {
                        newGitDiffStatusMap[line] = gitDiffStatusMap[line];
                    }
                }
            });
            res.removed.forEach(line => {
                if (!gitDiffStatusMap[line]
                    || gitDiffStatusMap[line].type !== GitDiffStatus.Removed) {
                    const handle = setMarker(line, removedClass);
                    newGitDiffStatusMap[line] = {
                        type: GitDiffStatus.Removed,
                        handle
                    };
                }
                else {
                    newGitDiffStatusMap[line] = gitDiffStatusMap[line];
                }
            });

            // Clean any excessive markers
            Object.keys(gitDiffStatusMap).forEach(_line => {
                const line = +_line;
                if (!newGitDiffStatusMap[line]) {
                    clearMarker(line);
                }
            });

            // New is now the old
            gitDiffStatusMap = newGitDiffStatusMap;

            // Now annotate the scroll bar with the new
            type ScrollBarAnnotation = {from:CodeMirror.Position,to:CodeMirror.Position};
            type AnnotationList = ScrollBarAnnotation[]
            const gitDiffSpanToAnnotationList = (span:types.GitDiffSpan):ScrollBarAnnotation => {
                return {
                    from: {
                        line: span.from,
                        ch: 0
                    },
                    to: {
                        line: span.to,
                        ch: 0
                    }
                }
            }
            scrollbar.added.update(res.added.map(gitDiffSpanToAnnotationList));
            scrollbar.modified.update(res.modified.map(gitDiffSpanToAnnotationList));
            scrollbar.removed.update(res.removed.map(removed => {
                const line = removed, ch = 0;
                return {
                    from: { line, ch },
                    to: { line, ch }
                }
            }));
        });
    };

    const refreshGitStatusDebounced = utils.debounce(refreshGitStatus, 2000);

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
            scrollbar.added.clear();
            scrollbar.modified.clear();
            scrollbar.removed.clear();
        }
    }
}
