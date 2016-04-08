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

/**
 * Modes. New modes need to be added
 * - to the require call
 * - to all the extensions that map to that mode name or its specialization
 */
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/xml/xml');
require('codemirror/mode/css/css');
require('codemirror/mode/sass/sass');
require('codemirror/mode/dart/dart');
require('codemirror/mode/haml/haml');
require('codemirror/mode/gfm/gfm');
require('codemirror/mode/coffeescript/coffeescript');
let supportedModesMap = {
    js: 'javascript', json: 'javascript',
    xml: 'text/html', html: 'text/html',
    css: 'css', less: 'text/x-less', gss: 'text/x-gss',
    sass: 'sass',
    dart: 'dart',
    haml: 'haml',
    markdown: 'gfm', md: 'gfm',
    coffee: 'coffeescript', coffeescript: 'coffeescript',
};

let docByFilePathPromised: { [filePath: string]: Promise<CodeMirror.Doc> } = {};

export function getLinkedDoc(filePath: string): Promise<CodeMirror.Doc> {
    return getOrCreateDoc(filePath)
        .then(doc=> {

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

            return doc.linkedDoc({ sharedHist: true })
        });
}

function getOrCreateDoc(filePath: string) {
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

            // console.log(mode,supportedModesMap[ext]); // Debug mode

            // to track the source of changes , local vs. network
            let sourceId = utils.createId();

            // Add to classifier cache
            if (isTsFile) { classifierCache.addFile(filePath, res.contents); }

            // create the doc
            let doc = new CodeMirror.Doc(res.contents, mode);
            doc.filePath = filePath;
            doc.rootDoc = true;

            // setup to push doc changes to server
            (doc as any).on('change', (doc: CodeMirror.Doc, change: CodeMirror.EditorChange) => {

                // console.log('sending server edit', sourceId)

                if (change.origin == sourceId) {
                    return;
                }

                let codeEdit: CodeEdit = {
                    from: { line: change.from.line, ch: change.from.ch },
                    to: { line: change.to.line, ch: change.to.ch },
                    newText: change.text.join('\n'),
                    sourceId: sourceId
                };

                // Keep the classifier in sync
                if (isTsFile) { classifierCache.editFile(filePath, codeEdit); }

                // Send the edit
                server.editFile({ filePath: filePath, edit: codeEdit });

                // Keep the ouput status cache informed
                state.ifJSStatusWasCurrentThenMoveToOutOfDate({inputFilePath: filePath});
            });

            // setup to get doc changes from server
            cast.didEdit.on(res=> {

                // console.log('got server edit', res.edit.sourceId,'our', sourceId)

                let codeEdit = res.edit;

                if (res.filePath == filePath && codeEdit.sourceId !== sourceId) {
                    // Keep the classifier in sync
                    if (isTsFile) { classifierCache.editFile(filePath, codeEdit); }

                    // Note that we use *our source id* as this is now a change *we are making to code mirror* :)
                    doc.replaceRange(codeEdit.newText, codeEdit.from, codeEdit.to, sourceId);
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

                    // Note that we use *our source id* as this is now a change *we are making to code mirror* :)
                    // Not using setValue as it doesn't take sourceId
                    let lastLine = doc.lastLine();
                    let lastCh = doc.getLine(lastLine).length;
                    doc.replaceRange(res.contents, { line: 0, ch: 0 }, { line: lastLine, ch: lastCh }, sourceId);

                    // restore cursor
                    doc.setCursor(cursor);
                }
            })

            // Finally return the doc
            return doc;
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
        docs.forEach(doc => res[doc.filePath] = doc);
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
                let from = classifierCache.getLineAndCharacterOfPosition(fp, change.span.start);
                let to = classifierCache.getLineAndCharacterOfPosition(fp, change.span.start + change.span.length);
                doc.replaceRange(change.newText, from, to, '*refactor');
            }
        });
    });
}
