/**
 * We should have all the CM docs cached for consistent history and stuff
 */
import {TypedEvent} from "../../../common/events";
import {cast, server} from "../../../socket/socketClient";
import * as editBatcher from "./editBatcher";
import * as utils from "../../../common/utils";
import * as classifierCache from "./classifierCache";
import {RefactoringsByFilePath, Refactoring} from "../../../common/types";
import * as state from "../../state/state";
import {EditorOptions} from "../../../common/types";
import * as monacoUtils from "../../monaco/monacoUtils";
import * as events from "../../../common/events";

/**
 * We extend the monaco editor model
 */
declare global {
    module monaco {
        module editor {
            interface IReadOnlyModel {
                /** keep `filePath` */
                filePath?: string;
                /**
                 * add a list of editors
                 * - useful for restoring cursors if we edit the model
                 */
                _editors: monaco.editor.ICodeEditor[];
                /**
                 * store the format code options so we can use them later
                 */
                _editorOptions: EditorOptions;
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
import {setupMonacoJson} from "../../monaco/languages/json/monacoJson";
setupMonacoJson();

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

export function getLinkedDoc(filePath: string,editor: monaco.editor.ICodeEditor): Promise<GetLinkedDocResponse> {
    return getOrCreateDoc(filePath)
        .then(({doc, isJsOrTsFile, editorOptions}) => {

            // Everytime a typescript file is opened we ask for its output status (server pull)
            // On editing this happens automatically (server push)
            server.getJSOutputStatus({ filePath }).then(res => {
                if (res.inActiveProject) {
                    state.fileOuputStatusUpdated(res.outputStatus);
                }
            });

            /** Wire up the doc */
			editor.setModel(doc);

            /** Add to list of editors */
            doc._editors.push(editor);

            return {doc: doc, editorOptions: editorOptions};
        });
}

export function removeLinkedDoc(filePath:string, editor: monaco.editor.ICodeEditor){
    editor.getModel()._editors = editor.getModel()._editors.filter(e => e != editor);
    // if this was the last editor using this model then we remove it from the cache as well
    // otherwise we might get a file even if its deleted from the server
    if (!editor.getModel()._editors.length){
        docByFilePathPromised[filePath].then(x=>{
            x.disposable.dispose();
            delete docByFilePathPromised[filePath];
        })
    }
}

type DocPromiseResult = {
    doc: monaco.editor.IModel,
    isJsOrTsFile: boolean,
    editorOptions: EditorOptions,
    disposable: IDisposable,
}
let docByFilePathPromised: { [filePath: string]: Promise<DocPromiseResult> } = Object.create(null);

function getOrCreateDoc(filePath: string): Promise<DocPromiseResult> {
    if (docByFilePathPromised[filePath]) {
        return docByFilePathPromised[filePath];
    }
    else {
        return docByFilePathPromised[filePath] = server.openFile({ filePath: filePath }).then((res) => {
            const disposable = new events.CompositeDisposible();
            let ext = utils.getExt(filePath);
            let isJsOrTsFile = utils.isJsOrTs(filePath);

            let language = getLanguage(filePath);

            // console.log(res.editorOptions); // DEBUG
            // console.log(mode,supportedModesMap[ext]); // Debug mode

            // Add to classifier cache
            if (isJsOrTsFile) {
                classifierCache.addFile(filePath, res.contents);
                disposable.add({ dispose: () => classifierCache.removeFile(filePath) });
             }

            // create the doc
            window.creatingModelFilePath = filePath;
            const doc = monaco.editor.createModel(res.contents, language);
            doc.setEOL(monaco.editor.EndOfLineSequence.LF); // The true eol is only with the file model at the backend. The frontend doesn't care 🌹

            doc.filePath = filePath;
            doc._editors = [];
            doc._editorOptions = res.editorOptions;

            /** Susbcribe to editor options changing */
            disposable.add(cast.editorOptionsChanged.on((res) => {
    		    if (res.filePath === filePath) {
    		        doc._editorOptions = res.editorOptions;
    		    }
    		}));

            /**
             * We ignore edit notifications from monaco if *we* did the edit e.g.
             * - if the server sent the edit and we applied it.
             */
            let countOfEditNotificationsToIgnore = 0;

            /** This is used for monaco edit operation version counting purposes */
            let editorOperationCounter = 0;

            // setup to push doc changes to server
            disposable.add(doc.onDidChangeContent(evt => {
                // Keep the ouput status cache informed
                state.ifJSStatusWasCurrentThenMoveToOutOfDate({inputFilePath: filePath});

                // if this edit is happening
                // because *we edited it due to a server request*
                // we should exit
                if (countOfEditNotificationsToIgnore) {
                    countOfEditNotificationsToIgnore--;
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

                // Keep the classifier in sync
                if (isJsOrTsFile) { classifierCache.editFile(filePath, codeEdit) }
            }));

            // setup to get doc changes from server
            disposable.add(cast.didEdits.on(res=> {

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
                        countOfEditNotificationsToIgnore++;
                        doc.pushEditOperations([], [editOperation], null);
                    }
                });
            }));

            // setup loading saved files changing on disk
            disposable.add(cast.savedFileChangedOnDisk.on((res) => {
                if (res.filePath == filePath
                    && doc.getValue() !== res.contents) {

                    // preserve cursor
                    doc._editors.forEach(e=>{
                        const cursors = e.getSelections();
                        setTimeout(()=>{
                            e.setSelections(cursors);
                        })
                    })

                    // Keep the classifier in sync
                    if (isJsOrTsFile) { classifierCache.setContents(filePath, res.contents); }

                    // Note that we use *mark as coming from server* so we don't go into doc.change handler later on :)
                    countOfEditNotificationsToIgnore++;

                    // NOTE: we don't do `setValue` as
                    // - that creates a new tokenizer (we would need to use `window.creatingModelFilePath`)
                    // - looses all undo history.
                    // Instead we *replace* all the text that is there 🌹
                    const totalDocRange = doc.getFullModelRange();
                    monacoUtils.replaceRange({
                        range: totalDocRange,
                        model: doc,
                        newText: res.contents
                    });
                }
            }));

            // Finally return the doc
            const result: DocPromiseResult = {
                doc,
                isJsOrTsFile,
                editorOptions: res.editorOptions,
                disposable: disposable,
            };
            return result;
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

                monacoUtils.replaceRange({
                    model: doc,
                    range: {
                        startLineNumber: from.line + 1,
                        startColumn: from.ch + 1,
                        endLineNumber: to.line + 1,
                        endColumn: to.ch + 1
                    },
                    newText: change.newText
                });
            }
        });
    });
}
