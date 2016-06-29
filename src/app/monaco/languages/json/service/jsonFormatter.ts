/**
 * From https://raw.githubusercontent.com/Microsoft/vscode-json-languageservice/master/src/services/jsonFormatter.ts
 * - Redirected dependencies
 * - Made `getEol` use editorconfig ;)
 */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Json = require('../core/jsonc-parser');

import Thenable = monaco.Thenable;
import PromiseConstructor = monaco.Promise;
import CompletionItem = monaco.languages.CompletionItem;
import CompletionItemKind = monaco.languages.CompletionItemKind;
import CompletionList = monaco.languages.CompletionList;
import TextDocument = monaco.editor.IReadOnlyModel;
import Position = monaco.Position;
import Range = monaco.Range;
import FormattingOptions = monaco.languages.FormattingOptions;
import TextEdit = monaco.editor.ISingleEditOperation;
/**
 * BAS: Was simple so I wrote it :)
 */
namespace TextEditReplace {
    export function replace(range: Range, text: string):monaco.editor.ISingleEditOperation{
        const result: monaco.editor.ISingleEditOperation = {
            range: range,
            text: text
        };
        return result;
    }
}


export function format(document: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
	const documentText = document.getValue();
	let initialIndentLevel: number;
	let value: string;
	let rangeOffset: number;
	if (range) {
		let startPosition = new Position(range.startLineNumber, 0);
		rangeOffset = document.getOffsetAt(startPosition);

		let endOffset = document.getOffsetAt(new Position(range.endLineNumber + 1, 0));
		let endLineStart = document.getOffsetAt(new Position(range.endLineNumber, 0));
		while (endOffset > endLineStart && isEOL(documentText, endOffset - 1)) {
			endOffset--;
		}
        const endPosition = document.getPositionAt(endOffset);
        range = new Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
		value = documentText.substring(rangeOffset, endOffset);
		initialIndentLevel = computeIndentLevel(value, 0, options);
	} else {
		value = documentText;
        const endPosition = document.getPositionAt(value.length);
		range = new Range(0, 0, endPosition.lineNumber,endPosition.column);
		initialIndentLevel = 0;
		rangeOffset = 0;
	}
	let eol = getEOL(document);

	let lineBreak = false;
	let indentLevel = 0;
	let indentValue: string;
	if (options.insertSpaces) {
		indentValue = repeat(' ', options.tabSize);
	} else {
		indentValue = '\t';
	}

	let scanner = Json.createScanner(value, false);

	function newLineAndIndent(): string {
		return eol + repeat(indentValue, initialIndentLevel + indentLevel);
	}
	function scanNext(): Json.SyntaxKind {
		let token = scanner.scan();
		lineBreak = false;
		while (token === Json.SyntaxKind.Trivia || token === Json.SyntaxKind.LineBreakTrivia) {
			lineBreak = lineBreak || (token === Json.SyntaxKind.LineBreakTrivia);
			token = scanner.scan();
		}
		return token;
	}
	let editOperations: TextEdit[] = [];
	function addEdit(text: string, startOffset: number, endOffset: number) {
		if (documentText.substring(startOffset, endOffset) !== text) {
            const startPos = document.getPositionAt(startOffset);
            const endPos = document.getPositionAt(endOffset)
            let replaceRange = new Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column);
			editOperations.push(TextEditReplace.replace(replaceRange, text));
		}
	}

	let firstToken = scanNext();
	if (firstToken !== Json.SyntaxKind.EOF) {
		let firstTokenStart = scanner.getTokenOffset() + rangeOffset;
		let initialIndent = repeat(indentValue, initialIndentLevel);
		addEdit(initialIndent, rangeOffset, firstTokenStart);
	}

	while (firstToken !== Json.SyntaxKind.EOF) {
		let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + rangeOffset;
		let secondToken = scanNext();

		let replaceContent = '';
		while (!lineBreak && (secondToken === Json.SyntaxKind.LineCommentTrivia || secondToken === Json.SyntaxKind.BlockCommentTrivia)) {
			// comments on the same line: keep them on the same line, but ignore them otherwise
			let commentTokenStart = scanner.getTokenOffset() + rangeOffset;
			addEdit(' ', firstTokenEnd, commentTokenStart);
			firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + rangeOffset;
			replaceContent = secondToken === Json.SyntaxKind.LineCommentTrivia ? newLineAndIndent() : '';
			secondToken = scanNext();
		}

		if (secondToken === Json.SyntaxKind.CloseBraceToken) {
			if (firstToken !== Json.SyntaxKind.OpenBraceToken) {
				indentLevel--;
				replaceContent = newLineAndIndent();
			}
		} else if (secondToken === Json.SyntaxKind.CloseBracketToken) {
			if (firstToken !== Json.SyntaxKind.OpenBracketToken) {
				indentLevel--;
				replaceContent = newLineAndIndent();
			}
		} else {
			switch (firstToken) {
				case Json.SyntaxKind.OpenBracketToken:
				case Json.SyntaxKind.OpenBraceToken:
					indentLevel++;
					replaceContent = newLineAndIndent();
					break;
				case Json.SyntaxKind.CommaToken:
				case Json.SyntaxKind.LineCommentTrivia:
					replaceContent = newLineAndIndent();
					break;
				case Json.SyntaxKind.BlockCommentTrivia:
					if (lineBreak) {
						replaceContent = newLineAndIndent();
					} else {
						// symbol following comment on the same line: keep on same line, separate with ' '
						replaceContent = ' ';
					}
					break;
				case Json.SyntaxKind.ColonToken:
					replaceContent = ' ';
					break;
				case Json.SyntaxKind.NullKeyword:
				case Json.SyntaxKind.TrueKeyword:
				case Json.SyntaxKind.FalseKeyword:
				case Json.SyntaxKind.NumericLiteral:
					if (secondToken === Json.SyntaxKind.NullKeyword || secondToken === Json.SyntaxKind.FalseKeyword || secondToken === Json.SyntaxKind.NumericLiteral) {
						replaceContent = ' ';
					}
					break;
			}
			if (lineBreak && (secondToken === Json.SyntaxKind.LineCommentTrivia || secondToken === Json.SyntaxKind.BlockCommentTrivia)) {
				replaceContent = newLineAndIndent();
			}

		}
		let secondTokenStart = scanner.getTokenOffset() + rangeOffset;
		addEdit(replaceContent, firstTokenEnd, secondTokenStart);
		firstToken = secondToken;
	}
	return editOperations;
}

function repeat(s: string, count: number): string {
	let result = '';
	for (let i = 0; i < count; i++) {
		result += s;
	}
	return result;
}

function computeIndentLevel(content: string, offset: number, options: FormattingOptions): number {
	let i = 0;
	let nChars = 0;
	let tabSize = options.tabSize || 4;
	while (i < content.length) {
		let ch = content.charAt(i);
		if (ch === ' ') {
			nChars++;
		} else if (ch === '\t') {
			nChars += tabSize;
		} else {
			break;
		}
		i++;
	}
	return Math.floor(nChars / tabSize);
}

function getEOL(document: TextDocument): string {
    return document._editorOptions.newLineCharacter;
}

function isEOL(text: string, offset: number) {
	return '\r\n'.indexOf(text.charAt(offset)) !== -1;
}
