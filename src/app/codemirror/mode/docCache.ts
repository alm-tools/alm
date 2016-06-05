/**
 * We should have all the CM docs cached for consistent history and stuff
 */
import {TypedEvent} from "../../../common/events";
import * as CodeMirror from "codemirror";
import {cast, server} from "../../../socket/socketClient";
import * as editBatcher from "./editBatcher";
import * as utils from "../../../common/utils";
import * as classifierCache from "./classifierCache";
import {RefactoringsByFilePath, Refactoring} from "../../../common/types";
import * as state from "../../state/state";
import {EditorOptions} from "../../../common/types";

/**
 * We extend the monaco editor model
 */
declare global {
    module monaco {
        module editor {
            interface IModel {
                /** keep `filePath` */
                filePath?: string;
                /**
                 * add a list of editors
                 * - useful for restoring cursors if we edit the model
                 */
                _editors: monaco.editor.ICodeEditor[];
            }
            interface ICodeEditor {
            }
        }
    }
}

/**
 * I haven't found a way to send the `tokenizer` the filePath
 * But `getInitialState` is reliably called immediately after `creatModel` so we can path this info through global
 */
declare global {
    interface Window {
        creatingModelFilePath?: string;
    }
}

/**
 * Setup any additional languages
 */
import {setupMonacoTypecript} from "../../monaco/languages/typescript/monacoTypeScript";
setupMonacoTypecript();

/**
 * Ext lookup
 */
const extLookup: { [ext: string]: monaco.languages.ILanguageExtensionPoint } = {};
monaco.languages.getLanguages().forEach(function(language) {
    // console.log(language); // DEBUG
    language.extensions.forEach(ext => {
        // ext is like `.foo`. We really want `foo`
        ext = ext.substr(1);
        extLookup[ext] = language;
    })
});

/**
 * Gets the mode for a give filePath (based on its ext)
 */
const getLanguage = (filePath: string): string => {
    const mode = extLookup[utils.getExt(filePath)];
    return mode ? mode.id : 'plaintext';
}

// to track the source of changes, local vs. network
const localSourceId: string = utils.createId();

export type GetLinkedDocResponse = {
    doc: monaco.editor.IModel;
    editorOptions: EditorOptions
}

export function getLinkedDoc(filePath: string): Promise<GetLinkedDocResponse> {
    return getOrCreateDoc(filePath)
        .then(({doc, isJsOrTsFile, editorOptions}) => {

            // Everytime a typescript file is opened we ask for its output status (server pull)
            // On editing this happens automatically (server push)
            server.getJSOutputStatus({ filePath }).then(res => {
                if (res.inActiveProject) {
                    state.fileOuputStatusUpdated(res.outputStatus);
                }
            });

            // TODO: mon
            // Keep the classifier cache in sync
            // Has to be done on each doc (sadly) because:
            // `beforeChange` on parent doc is not called by Code mirror if changes originate in this doc :-/
            // we need `beforeChange` to make sure query to indent is made with right classifications
            //
            // Also note : this is only called on explicit user editing this doc. So we do no origin checking.
            // Also: whenever we change the parent doc manually (all cm.doc come here including templates), we have to do classification syncing there (not here)
            // if (isTsFile) {
            //     (linkedDoc as any).on('beforeChange', (doc: CodeMirror.Doc, change: CodeMirror.EditorChange) => {
            //
            //         // console.log(change); // DEBUG
            //
            //         // Jumpy needs to use the same event and it will cancel this change
            //         // But only uses it if `enter` is not pressed
            //         if (doc._jumpyShown && change.text.join('').trim()) return;
            //
            //         // This is just the user pressing backspace on an empty file.
            //         // If we let it go through then the classifier cache will crash.
            //         // So abort
            //         if (change.from.line === change.to.line && change.from.ch === change.to.ch && change.text.length === 1 && change.text[0].length === 0){
            //             return;
            //         }
            //
            //         let codeEdit: CodeEdit = {
            //             from: { line: change.from.line, ch: change.from.ch },
            //             to: { line: change.to.line, ch: change.to.ch },
            //             newText: change.text.join('\n'),
            //             sourceId: localSourceId
            //         };
            //
            //         // Keep the classifier in sync
            //         classifierCache.editFile(filePath, codeEdit);
            //     });
            // }

            return {doc: doc, editorOptions: editorOptions};
        });
}

type DocPromiseResult = {
    doc: monaco.editor.IModel,
    isJsOrTsFile: boolean,
    editorOptions: EditorOptions,
}
let docByFilePathPromised: { [filePath: string]: Promise<DocPromiseResult> } = Object.create(null);

function getOrCreateDoc(filePath: string): Promise<DocPromiseResult> {
    if (docByFilePathPromised[filePath]) {
        return docByFilePathPromised[filePath];
    }
    else {
        return docByFilePathPromised[filePath] = server.openFile({ filePath: filePath }).then((res) => {
            let ext = utils.getExt(filePath);
            let isJsOrTsFile = utils.isJsOrTs(filePath);

            let language = getLanguage(filePath);

            // console.log(res.editorOptions); // DEBUG
            // console.log(mode,supportedModesMap[ext]); // Debug mode

            // Add to classifier cache
            if (isJsOrTsFile) { classifierCache.addFile(filePath, res.contents); }

            // create the doc
            window.creatingModelFilePath = filePath;
            const doc = monaco.editor.createModel(res.contents, language);

            doc.filePath = filePath;
            doc._editors = [];

            let editCameFromServerCount = 0;

            /** This is used for monaco edit operation counting purposes */
            let editorOperationCounter = 0;

            // setup to push doc changes to server
            doc.onDidChangeContent(evt => {
                // Keep the ouput status cache informed
                state.ifJSStatusWasCurrentThenMoveToOutOfDate({inputFilePath: filePath});

                // if this edit is happening
                // because *we edited it due to a server request*
                // we should exit
                if (editCameFromServerCount) {
                    editCameFromServerCount--;
                    return;
                }
                let codeEdit: CodeEdit = {
                    from: { line: evt.range.startLineNumber - 1, ch: evt.range.startColumn - 1 },
                    to: { line: evt.range.endLineNumber - 1, ch: evt.range.endColumn - 1 },
                    newText: evt.text,
                    sourceId: localSourceId
                };
                // Send the edit
                editBatcher.addToQueue(filePath, codeEdit);
            });

            // setup to get doc changes from server
            cast.didEdits.on(res=> {

                // console.log('got server edit', res.edit.sourceId,'our', sourceId)

                let codeEdits = res.edits;
                codeEdits.forEach(codeEdit => {
                    // Easy exit for local edits getting echoed back
                    if (res.filePath == filePath && codeEdit.sourceId !== localSourceId) {
                        // Keep the classifier in sync
                        if (isJsOrTsFile) { classifierCache.editFile(filePath, codeEdit); }

                        // make the edits
                        const editOperation: monaco.editor.IIdentifiedSingleEditOperation = {
                            identifier: {
                                major: editorOperationCounter++,
                                minor: 0
                            },
                            text: codeEdit.newText,
                            range: new monaco.Range(
                                codeEdit.from.line + 1,
                                codeEdit.from.ch + 1,
                                codeEdit.to.line + 1,
                                codeEdit.to.ch + 1
                            ),
                            forceMoveMarkers: false,
                            isAutoWhitespaceEdit: false,
                        }

                        /** Mark as ignoring before applying the edit */
                        editCameFromServerCount++;
                        doc.pushEditOperations([], [editOperation], null);
                    }
                });
            });

            // setup loading saved files changing on disk
            cast.savedFileChangedOnDisk.on((res) => {
                if (res.filePath == filePath
                    && doc.getValue() !== res.contents) {

                    // Keep the classifier in sync
                    if (isJsOrTsFile) { classifierCache.setContents(filePath, res.contents); }

                    // preserve cursor
                    doc._editors.forEach(e=>{
                        const cursors = e.getSelections();
                        setTimeout(()=>{
                            e.setSelections(cursors);
                        })
                    })

                    // Note that we use *mark as coming from server* so we don't go into doc.change handler later on :)
                    editCameFromServerCount++;

                    doc.setValue(res.contents);
                }
            });

            // Finally return the doc
            return { doc, isJsOrTsFile, editorOptions: res.editorOptions };
        });
    }
}

/**
 * Don't plan to export as giving others our true docs can have horrible consequences if they mess them up
 */
function getOrCreateDocs(filePaths: string[]): Promise<{ [filePath: string]: monaco.editor.IModel }> {
    let promises = filePaths.map(fp => getOrCreateDoc(fp));
    return Promise.all(promises).then(docs => {
        let res: { [filePath: string]: monaco.editor.IModel } = {};
        docs.forEach(({doc}) => res[doc.filePath] = doc);
        return res;
    });
}

export function applyRefactoringsToTsDocs(refactorings: RefactoringsByFilePath) {
    let filePaths = Object.keys(refactorings);
    getOrCreateDocs(filePaths).then(docsByFilePath => {
        filePaths.forEach(fp=> {
            let doc = docsByFilePath[fp];
            let changes = refactorings[fp];
            for (let change of changes) {

                const from = classifierCache.getLineAndCharacterOfPosition(fp, change.span.start);
                const to = classifierCache.getLineAndCharacterOfPosition(fp, change.span.start + change.span.length);
                const sourceId = 'refactor';

                // Keep the classifier cache in sync
                classifierCache.editFile(change.filePath, {
                    from: from,
                    to: to,
                    sourceId,
                    newText: change.newText
                });

                doc.replaceRange(change.newText, from, to, `*${sourceId}`);
            }
        });
    });
}
