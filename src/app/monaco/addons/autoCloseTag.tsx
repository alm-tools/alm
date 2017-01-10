/**
 * inspiration:
 * https://github.com/formulahendry/vscode-auto-close-tag/blob/5921f24ffc6fc9350e1ce7c2a74ea99fab0c5b11/src/extension.ts
 * Modified to:
 * - remove options. We are in sublime mode, no excluded tags etc
 * - work with monaco instead of a vscode workspace
 */

import { CompositeDisposible } from "../../../common/events";
import * as monacoUtils from '../monacoUtils';
type Editor = monaco.editor.ICodeEditor;
type TextDocumentContentChangeEvent = monaco.editor.IModelContentChangedEvent2;

export function setup(cm: Editor): { dispose: () => void } {

    const disposible = new CompositeDisposible();
    disposible.add(cm.onDidChangeModelContent((e) => {
        /** Close tag */
        insertAutoCloseTag(e, cm);
    }));

    return disposible;
}

function insertAutoCloseTag(event: TextDocumentContentChangeEvent, editor: Editor): void {
    /** We insert on `</` */
    if (event.text !== "/") {
        return;
    }
    let originalRange = event.range;
    let text = editor.getModel().getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: originalRange.endLineNumber,
        endColumn: originalRange.endColumn,
    });

    let lastChar = "";
    if (text.length > 2) {
        lastChar = text.substr(text.length - 1);
    }
    if (lastChar !== "<") {
        return;
    }

    /** Yay, we have </ */
    const textToSearchForCloseTag = text.substr(0, text.length - 1);
    let closeTag = getCloseTag(textToSearchForCloseTag);

    if (!closeTag) {
        return;
    }
    /** Yay we have candidate closeTag like `</div>` */


    /**
     * If the user already has a trailing `>` e.g.
     * before: <div><(pos)>
     * after: <div><(pos)/>
     * Next chars will be `/>`
     */
    const nextChars = getNext2Chars(editor, { lineNumber: originalRange.endLineNumber, column: originalRange.endColumn });

    if (nextChars === "/>") {
        /** Don't add the trailing `>` so `</div>` => `</div` */
        closeTag = closeTag.substr(0, closeTag.length - 1);
    }

    /** What we really want is everything after `</` */
    closeTag = closeTag.substr(2);

    /** Make edits */
    const startAt = editor.getModel().modifyPosition({
        lineNumber: originalRange.endLineNumber,
        column: originalRange.endColumn
    }, 1);
    monacoUtils.replaceRange({
        model: editor.getModel(),
        range: {
            startLineNumber: startAt.lineNumber,
            startColumn: startAt.column,
            endLineNumber: startAt.lineNumber,
            endColumn: startAt.column
        },
        newText: closeTag
    });

    /** And advance the cursor */
    let endAt = editor.getModel().modifyPosition({
        lineNumber: startAt.lineNumber,
        column: startAt.column
    }, closeTag.length);
    if (nextChars === "/>") {
        /** Advance one char more */
        endAt = editor.getModel().modifyPosition(endAt, 1)
    }
    /** Set timeout. Because it doesn't work otherwise */
    setTimeout(() => {
        editor.setSelection({
            startLineNumber: endAt.lineNumber,
            startColumn: endAt.column,
            endLineNumber: endAt.lineNumber,
            endColumn: endAt.column,
        });
    });

}

function getNext2Chars(editor: Editor, position: monaco.IPosition): string {
    const nextPos = editor.getModel().modifyPosition(position, 2);
    const text = editor.getModel().getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: nextPos.lineNumber,
        endColumn: nextPos.column,
    });
    return text;
}

function getCloseTag(text: string): string {
    let regex = /<(\/?[a-zA-Z][a-zA-Z0-9:\-_.]*)(?:\s+[^<>]*?[^\s/<>=]+?)*?>/g;
    let result = null;
    let stack = [];
    while ((result = regex.exec(text)) !== null) {
        let isStartTag = result[1].substr(0, 1) !== "/";
        let tag = isStartTag ? result[1] : result[1].substr(1);
        if (isStartTag) {
            stack.push(tag);
        } else if (stack.length > 0) {
            let lastTag = stack[stack.length - 1];
            if (lastTag === tag) {
                stack.pop()
            }
        }
    }
    if (stack.length > 0) {
        let closeTag = stack[stack.length - 1];
        if (text.substr(text.length - 2) === "</") {
            return closeTag + ">";
        }
        if (text.substr(text.length - 1) === "<") {
            return "/" + closeTag + ">";
        }
        return "</" + closeTag + ">";
    } else {
        return null;
    }
}
