import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import * as commands from "../commands/commands";
import {server} from "../../socket/socketClient";
import {inputDialog} from "../dialogs/inputDialog";
import {jumpToLine} from "../codemirror/cmUtils";
import * as selectListView from "../selectListView";
import * as ui from "../ui";
import * as utils from "../../common/utils";

import CodeMirror = require('codemirror');
// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.gotoTypeScriptSymbol] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;

    server.getNavigateToItemsForFilePath({filePath}).then((res)=>{
        if (!res.items) {
            ui.notifyInfoNormalDisappear('No TypeScript symbols found for file');
            return; // potentially show a message
        }
        selectListView.selectListView.show({
            header:`TypeScript symbols in ${utils.getFileName(filePath)}`,
            data: res.items,
            render: (symbol, matched) => {
                // NOTE: Code duplicated in `omniSearch.tsx` (except this needs to set font explicitly)
                const color = ui.kindToColor(symbol.kind);
                const icon = ui.kindToIcon(symbol.kind);
                return (
                    <div style={{fontFamily: 'monospace'}}>
                        <div style={csx.horizontal}>
                            <span>{matched}</span>
                            <span style={csx.flex}></span>
                            <strong style={{color}}>{symbol.kind}</strong>
                            &nbsp;
                            <span style={csx.extend({color, fontFamily:'FontAwesome'})}>{icon}</span>
                        </div>
                        <div>{symbol.fileName}:{symbol.position.line+1}</div>
                    </div>
                );
            },
            textify: (item) => item.name,
            onSelect: (item) => {
                jumpToLine({ line: item.position.line, editor });
            }
        });
    });
}
