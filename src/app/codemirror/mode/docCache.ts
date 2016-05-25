/**
 * We should have all the CM docs cached for consistent history and stuff
 */
import {TypedEvent} from "../../../common/events";
import * as CodeMirror from "codemirror";
import {cast, server} from "../../../socket/socketClient";
import * as utils from "../../../common/utils";
import * as classifierCache from "./classifierCache";
import {RefactoringsByFilePath, Refactoring} from "../../../common/types";
import * as state from "../../state/state";
import {EditorOptions} from "../../../common/types";

/**
 * http://codemirror.net/mode/
 * Modes. New modes need to be added
 * - to the require call
 * - to all the extensions that map to that mode name or its mime
 */
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/xml/xml');
require('codemirror/mode/css/css');
require('codemirror/mode/sass/sass');
require('codemirror/mode/dart/dart');
require('codemirror/mode/haml/haml');
require('codemirror/mode/gfm/gfm');
require('codemirror/mode/coffeescript/coffeescript');
require('codemirror/mode/clike/clike');
require('codemirror/mode/mllike/mllike');
require('codemirror/mode/shell/shell');
/** Maps file extension to a `mime` type or mode `name` */
let supportedModesMap = {
    js: 'javascript', json: 'javascript',
    xml: 'text/html', html: 'text/html', cshtml: 'text/html',
    css: 'css', less: 'text/x-less', gss: 'text/x-gss', scss: 'text/x-scss',
    sass: 'sass',
    dart: 'dart',
    haml: 'haml',
    markdown: 'gfm', md: 'gfm',
    coffee: 'coffeescript', coffeescript: 'coffeescript',
    cs: 'text/x-csharp', cpp: 'text/x-c++src', java: 'text/x-java',
    fs: 'text/x-fsharp', ml: 'text/x-ocaml',
    sh: 'text/x-sh'
};

// to track the source of changes, local vs. network
const localSourceId: string = utils.createId();
const cameFromNetworkSourceId: string = 'came-from-network';

export type GetLinkedDocResponse = {
    doc: CodeMirror.Doc;
    editorOptions: EditorOptions
}

export function getLinkedDoc(filePath: string): Promise<GetLinkedDocResponse> {
    return getOrCreateDoc(filePath)
        .then(({doc, isTsFile, editorOptions}) => {

            // Everytime a typescript file is opened we ask for its output status (server pull)
            // On editing this happens automatically (server push)
            server.getJSOutputStatus({ filePath }).then(res => {
                if (res.inActiveProject) {
                    state.fileOuputStatusUpdated(res.outputStatus);
                }
            });

            // Some housekeeping: clear previous links that no longer seem active
            // SetTimeout because we might have created the doc but not the CM instance yet
            setTimeout(() => {
                let markForRemove: CodeMirror.Doc[] = [];
                doc.iterLinkedDocs((linked) => {
                    if (!linked.getEditor()) {
                        markForRemove.push(linked)
                    }
                });
                markForRemove.forEach(linked=> { doc.unlinkDoc(linked); });
            }, 2000);

            // Create a linked doc
            const linkedDoc = doc.linkedDoc({ sharedHist: true });


            // Keep the classifier cache in sync
            // Has to be done on each doc (sadly) because:
            // `beforeChange` on parent doc is not called by Code mirror if changes originate in this doc :-/
            // we need `beforeChange` to make sure query to indent is made with right classifications
            //
            // Also note : this is only called on explicit user editing this doc. So we do no origin checking.
            // Also: whenever we change the parent doc manually (all cm.doc come here including templates), we have to do classification syncing there (not here)
            if (isTsFile) {
                (linkedDoc as any).on('beforeChange', (doc: CodeMirror.Doc, change: CodeMirror.EditorChange) => {

                    // console.log(change); // DEBUG

                    // Jumpy needs to use the same event and it will cancel this change
                    // But only uses it if `enter` is not pressed
                    if (doc._jumpyShown && change.text.join('').trim()) return;

                    // This is just the user pressing backspace on an empty file.
                    // If we let it go through then the classifier cache will crash.
                    // So abort
                    if (change.from.line === change.to.line && change.from.ch === change.to.ch && change.text.length === 1 && change.text[0].length === 0){
                        return;
                    }

                    let codeEdit: CodeEdit = {
                        from: { line: change.from.line, ch: change.from.ch },
                        to: { line: change.to.line, ch: change.to.ch },
                        newText: change.text.join('\n'),
                        sourceId: localSourceId
                    };

                    // Keep the classifier in sync
                    classifierCache.editFile(filePath, codeEdit);
                });
            }

            return {doc: linkedDoc, editorOptions: editorOptions};
        });
}

type DocPromiseResult = {
    doc: CodeMirror.Doc,
    isTsFile: boolean,
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
            let isTsFile = utils.isTsFile(filePath);

            let mode = isTsFile
                        ? 'typescript'
                        : supportedModesMap[ext]
                        ? supportedModesMap[ext]
                        : 'text';

            // console.log(res.editorOptions); // DEBUG
            // console.log(mode,supportedModesMap[ext]); // Debug mode

            // Add to classifier cache
            if (isTsFile) { classifierCache.addFile(filePath, res.contents); }

            // create the doc
            let doc = new CodeMirror.Doc(res.contents, mode);
            doc.filePath = filePath;
            doc.rootDoc = true;

            // setup to push doc changes to server
            (doc as any).on('change', (doc: CodeMirror.Doc, change: CodeMirror.EditorChange) => {
                // console.log('sending server edit', sourceId)

                if (change.origin == cameFromNetworkSourceId) {
                    return;
                }

                let codeEdit: CodeEdit = {
                    from: { line: change.from.line, ch: change.from.ch },
                    to: { line: change.to.line, ch: change.to.ch },
                    newText: change.text.join('\n'),
                    sourceId: localSourceId
                };

                // Send the edit
                server.editFile({ filePath: filePath, edit: codeEdit });

                // Keep the ouput status cache informed
                state.ifJSStatusWasCurrentThenMoveToOutOfDate({inputFilePath: filePath});
            });

            // setup to get doc changes from server
            cast.didEdit.on(res=> {

                // console.log('got server edit', res.edit.sourceId,'our', sourceId)

                let codeEdit = res.edit;

                if (res.filePath == filePath && codeEdit.sourceId !== localSourceId) {
                    // Keep the classifier in sync
                    if (isTsFile) { classifierCache.editFile(filePath, codeEdit); }

                    // Note that we use *mark as coming from server* so we don't go into doc.change handler later on :)
                    doc.replaceRange(codeEdit.newText, codeEdit.from, codeEdit.to, cameFromNetworkSourceId);
                }
            });

            // setup loading saved files changing on disk
            cast.savedFileChangedOnDisk.on((res) => {
                if (res.filePath == filePath
                    && doc.getValue() !== res.contents) {

                    // Keep the classifier in sync
                    if (isTsFile) { classifierCache.setContents(filePath, res.contents); }

                    // preserve cursor
                    let cursor = doc.getCursor();

                    // Note that we use *mark as coming from server* so we don't go into doc.change handler later on :)
                    // Not using setValue as it doesn't take sourceId
                    let lastLine = doc.lastLine();
                    let lastCh = doc.getLine(lastLine).length;
                    doc.replaceRange(res.contents, { line: 0, ch: 0 }, { line: lastLine, ch: lastCh }, cameFromNetworkSourceId);

                    // restore cursor
                    doc.setCursor(cursor);
                }
            })

            // Finally return the doc
            return { doc, isTsFile, editorOptions: res.editorOptions };
        });
    }
}

/**
 * Don't plan to export as giving others our true docs can have horrible consequences if they mess them up
 */
function getOrCreateDocs(filePaths: string[]): Promise<{ [filePath: string]: CodeMirror.Doc }> {
    let promises = filePaths.map(fp => getOrCreateDoc(fp));
    return Promise.all(promises).then(docs => {
        let res: { [filePath: string]: CodeMirror.Doc } = {};
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
