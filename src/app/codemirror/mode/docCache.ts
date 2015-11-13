/**
 * We should have all the CM docs cached for consistent history and stuff
 */
import {TypedEvent} from "../../../common/events";
import * as codemirror from "codemirror";
import {cast, server} from "../../../socket/socketClient";
import * as utils from "../../../common/utils";
import * as classifierCache from "./classifierCache";

let docByFilePath: { [filePath: string]: codemirror.Doc } = {};
export function getOrOpenDoc(filePath: string): Promise<codemirror.Doc> {
    if (docByFilePath[filePath]) {
        return Promise.resolve(docByFilePath[filePath].linkedDoc({sharedHist:true}));
    }
    else {
        return server.openFile({ filePath: filePath }).then((res) => {
            let mode = 'typescript';
            let sourceId = utils.createId();

            // Add to classifier cache
            classifierCache.addFile(filePath, res.contents);

            // create the doc
            let doc = docByFilePath[filePath] = new codemirror.Doc(res.contents, mode);

            // setup to push doc changes to server
            (doc as any).on('change', (doc: codemirror.Doc, change: CodeMirror.EditorChange) => {
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
                classifierCache.editFile(filePath, codeEdit);

                // Send the edit
                server.editFile({ filePath: filePath, edit: codeEdit });
            });

            // setup to get doc changes from server
            cast.didEdit.on(res=> {
                let codeEdit = res.edit;
                if (res.filePath == filePath && codeEdit.sourceId !== sourceId) {
                    // Keep the classifier in sync
                    classifierCache.editFile(filePath, codeEdit);

                    // Note that we use *our source id* as this is now a change *we are making to code mirror* :)
                    doc.replaceRange(codeEdit.newText, codeEdit.from, codeEdit.to, sourceId);
                }
            });

            // setup loading saved files changing on disk
            cast.savedFileChangedOnDisk.on((res)=>{
                if (res.filePath == filePath
                    && doc.getValue() !== res.contents) {

                    // Keep the classifier in sync
                    classifierCache.setContents(filePath, res.contents);

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
