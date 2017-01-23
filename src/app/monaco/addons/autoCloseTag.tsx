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
    let originalRange = event.range;

    /** User just did `<foo>` */
    if (event.text === ">") {

        let text = editor.getModel().getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: originalRange.endLineNumber,
            endColumn: originalRange.endColumn,
        });

        /**
         * Check that its not
         * `/>` (self closing)
         * `=>` (arrow)
         * `}>` (generic) ... hard cause `<foo bar={someting}>` is valid :-/
         * By just checking is a char
         **/
        let lastChar = "";
        if (text.length > 2) {
            lastChar = text.substr(text.length - 1);
        }
        if (lastChar === "/" || lastChar === '=') {
            return;
        }

        let closeTag = getCloseTagIfAtAnOpenOne(editor.filePath, editor.getModel().getOffsetAt({
            lineNumber: originalRange.endLineNumber,
            column: originalRange.endColumn
        }));

        if (!closeTag) return;

        closeTag = `</${closeTag}>`;

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

        return;
    }

    /** User just did `<foo>something</` */
    if (event.text === "/") {
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

        /** Yay, we have </ See if we have a close tag ? */
        let closeTag = getCloseTagForAnAlreadyOpenOne(editor.filePath, editor.getModel().getOffsetAt({
            lineNumber: originalRange.endLineNumber,
            column: originalRange.endColumn
        }));

        if (!closeTag) {
            return;
        }
        /** Yay we have candidate closeTag like `div` */

        /**
         * If the user already has a trailing `>` e.g.
         * before: <div><(pos)>
         * after: <div><(pos)/>
         * Next chars will be `/>`
         */
        const nextChars = getNext2Chars(editor, { lineNumber: originalRange.endLineNumber, column: originalRange.endColumn });

        /** If the next chars are not `/>` then we want to complete `>` for the user as well */
        if (nextChars !== "/>") {
            closeTag = closeTag + '>';
        }

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

import { getSourceFile } from '../model/classifierCache';
function getCloseTagForAnAlreadyOpenOne(filePath: string, position: number): string | null {
    const sourceFile = getSourceFile(filePath);
    const opens: ts.JsxOpeningElement[] = [];

    const collectTags = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node)) {
            if (node.getStart() >= position) return;

            if (node.getStart() === (position - 1)) {
                /**
                 * This is actually just
                 * <div><>
                 *       ^ parsed as an opening
                 */
                return;
            }

            opens.push(node);
        }
        if (ts.isJsxClosingElement(node)) {
            if (node.getStart() >= position) return;
            opens.pop();
        }
        ts.forEachChild(node, collectTags);
    }
    ts.forEachChild(sourceFile, collectTags);

    // console.log(opens.map(o => o.getFullText())); // DEBUG

    if (opens.length) {
        const tabToClose = opens[opens.length - 1]; // close the last one first
        const tagName = tabToClose.tagName.getText(); // something like `foo.Someting`
        return tagName;
    }

    return null;
}
function getCloseTagIfAtAnOpenOne(filePath: string, position: number): string | null {
    const sourceFile = getSourceFile(filePath);
    let found: ts.JsxSelfClosingElement | null = null;

    const collectTags = (node: ts.Node) => {
        /**
         * <div
         * Is actually parsed as a JSX self closing tag
         **/
        if (node.kind === ts.SyntaxKind.JsxSelfClosingElement) {
            /**
             * With
             * <foo>
             *   <another(cursor)
             * </foo>
             *
             * the `<another </` is what the jsx self closing tag contains
             * So if its a *self closing* tag with a start before and end after ... its a candidate
             */
            if (!(node.getStart() <= position) || !(node.getEnd() >= position)) return;

            const fullText = node.getFullText().trim();

            // is actually closed
            if (fullText.endsWith('/')
                /**
                 * Is getting the next `</` e.g.
                 * <foo>
                 *   <another(cursor)
                 * </foo>
                 * is parsed as
                 * `<another </`
                 */
                && !fullText.endsWith('</')) return;

            if (found) {
                const previous = found;

                /** If it surrounds the position more tightly */
                const delta = (position - node.getStart()) + (node.getEnd() - position);
                const previousDelta = (position - previous.getStart()) + (previous.getEnd() - position);

                if (delta < previousDelta) {
                    found = node as ts.JsxSelfClosingElement;;
                }
            }
            else {
                found = node as ts.JsxSelfClosingElement;
            }
        }
        ts.forEachChild(node, collectTags);
    }
    ts.forEachChild(sourceFile, collectTags);

    if (found) {
        /**
         * For
         * <div|Hello
         * We want <div only. But tag name full text gives us `<divHello`.
         * So fix it by simply only giving `<div` text before position
         */
        const tagName = found.tagName;
        const start = found.tagName.getStart();
        const end = position;
        return sourceFile.getFullText().substring(start, end);
    }

    return null;
}
