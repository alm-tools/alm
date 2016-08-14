import { cast, server } from "../../../../socket/socketClient";
import { Types } from "../../../../socket/socketContract";
import * as state from "../../../state/state";
import * as classifierCache from "../../model/classifierCache";
import * as utils from "../../../../common/utils";
import * as types from "../../../../common/types";
import { defaultSnippets } from "./snippets";
import * as monacoUtils from "../../monacoUtils";

import CancellationToken = monaco.CancellationToken;
import Thenable = monaco.Thenable;
import Position = monaco.Position;

require('./autocomplete.css')

/**
 * You are allowed to create your own completion item as long as you provide what monaco needs
 */
interface MyCompletionItem extends monaco.languages.CompletionItem {
  // Original server response
  orig?: types.Completion,

  // Used to provide additional help later on
  filePath?: string,
  position?: number,
}

/**
 * Autocomplete
 */
export class SuggestAdapter implements monaco.languages.CompletionItemProvider {

  public get triggerCharacters(): string[] {
    return ['.', '('];
  }

  provideCompletionItems(model: monaco.editor.IReadOnlyModel, position: Position, token: CancellationToken): Promise<monaco.languages.CompletionItem[]> {
    const wordInfo = model.getWordUntilPosition(position);
    let prefix = wordInfo.word;

    // NOTE: monaco is a bit touchy about `wordInfo`
    // e.g. for `test(|` it will  return `wordInfo.word == ""`.
    // We would rather it give us `(`.
    // Lets fix that:
    if (prefix == '' && wordInfo.startColumn > 2) {
      prefix = model.getLineContent(position.lineNumber).substr(wordInfo.startColumn - 2, 1);
    }

    // console.log({ prefix }); // DEBUG

    const filePath = model.filePath;
    const offset = monacoUtils.positionToOffset(model, position);

    if (!state.inActiveProjectFilePath(model.filePath)) {
      return Promise.resolve([]);
    }

    return server
      .getCompletionsAtPosition({
        prefix,
        filePath,
        position: offset
      })
      .then(info => {
        if (!info) {
          return;
        }

        let suggestions: MyCompletionItem[] = info.completions.map(entry => {
          const result: MyCompletionItem = {
            label: entry.name,
            kind: SuggestAdapter.convertKind(entry.kind),

            // MyCompletionItem
            orig: entry,
            position: offset,
            filePath,
          };

          // Support function completions
          if (entry.kind === 'snippet') {
            result.insertText = entry.insertText;
          }

          // For path completions we should create a text edit that eats all the text content
          // This should work but doesn't (monaco bug). So disabling (= null) for now.
          if (entry.textEdit) {
            // console.log(entry.textEdit, {position}); // DEBUG
            result.textEdit = {
              range: {
                startLineNumber: entry.textEdit.from.line + 1,
                startColumn: entry.textEdit.from.ch + 1,
                endLineNumber: entry.textEdit.to.line + 1,
                endColumn: entry.textEdit.to.ch + 1,
              },
              text: entry.textEdit.newText,
            }
            // Need this otherwise monaco tries to filter based on `textEdit`
            // and that might remove our entry.
            result.filterText = entry.name;
          }

          return result;
        });

        // add all snips
        defaultSnippets.forEach(item => {

          const snip: MyCompletionItem = {
            label: item.name,
            kind: monaco.languages.CompletionItemKind.Snippet,

            detail: 'snippet',
            documentation: item.description,
            insertText: item.template,
          }

          suggestions.push(snip);
        });


        return suggestions;
      });
  }

  resolveCompletionItem(item: monaco.languages.CompletionItem, token: CancellationToken): Promise<monaco.languages.CompletionItem> | monaco.languages.CompletionItem {

    let myItem = item as MyCompletionItem;
    const filePath = myItem.filePath;
    const position = myItem.position;

    /** We have a chance to return `detail` and `documentation` */

    // If we already have the result return it
    if (myItem.orig && myItem.orig.display) {
      return utils.extend(myItem, { detail: myItem.orig.display, documentation: myItem.orig.comment });
    }
    if (myItem.detail || myItem.documentation) {
      return myItem;
    }

    // If not a resolvable completion then return orig
    if (!filePath || !position) {
      return myItem;
    }

    // Otherwise get it from the server
    return server
      .getCompletionEntryDetails({ filePath, position, label: myItem.label })
      .then(res => {
        // You basically return the same thing with comments if any. If we don't have them just return.
        if (!res.display && !res.comment) {
          return myItem;
        }
        const detail = res.display, documentation = res.comment;
        return utils.extend(myItem, { detail, documentation });
      });
  }

  private static convertKind(kind: string): monaco.languages.CompletionItemKind {
    switch (kind) {
      case Kind.primitiveType:
      case Kind.keyword:
        return monaco.languages.CompletionItemKind.Keyword;
      case Kind.variable:
      case Kind.localVariable:
        return monaco.languages.CompletionItemKind.Variable;
      case Kind.memberVariable:
      case Kind.memberGetAccessor:
      case Kind.memberSetAccessor:
        return monaco.languages.CompletionItemKind.Field;
      case Kind.function:
      case Kind.memberFunction:
      case Kind.constructSignature:
      case Kind.callSignature:
      case Kind.indexSignature:
        return monaco.languages.CompletionItemKind.Function;
      case Kind.enum:
        return monaco.languages.CompletionItemKind.Enum;
      case Kind.module:
        return monaco.languages.CompletionItemKind.Module;
      case Kind.class:
        return monaco.languages.CompletionItemKind.Class;
      case Kind.interface:
        return monaco.languages.CompletionItemKind.Interface;
      case Kind.warning:
      case Kind.file:
        return monaco.languages.CompletionItemKind.File;
    }

    return monaco.languages.CompletionItemKind.Property;
  }
}


export class Kind {
  public static unknown: string = '';
  public static keyword: string = 'keyword';
  public static script: string = 'script';
  public static module: string = 'module';
  public static class: string = 'class';
  public static interface: string = 'interface';
  public static type: string = 'type';
  public static enum: string = 'enum';
  public static variable: string = 'var';
  public static localVariable: string = 'local var';
  public static function: string = 'function';
  public static localFunction: string = 'local function';
  public static memberFunction: string = 'method';
  public static memberGetAccessor: string = 'getter';
  public static memberSetAccessor: string = 'setter';
  public static memberVariable: string = 'property';
  public static constructorImplementation: string = 'constructor';
  public static callSignature: string = 'call';
  public static indexSignature: string = 'index';
  public static constructSignature: string = 'construct';
  public static parameter: string = 'parameter';
  public static typeParameter: string = 'type parameter';
  public static primitiveType: string = 'primitive type';
  public static label: string = 'label';
  public static alias: string = 'alias';
  public static const: string = 'const';
  public static let: string = 'let';
  public static warning: string = 'warning';
  public static file: string = 'file';
}
