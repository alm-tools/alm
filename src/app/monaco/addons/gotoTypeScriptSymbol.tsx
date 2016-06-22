import {server} from "../../../socket/socketClient";
import * as ui from "../../ui";
import * as utils from "../../../common/utils";
import * as monacoUtils from "../monacoUtils";
import * as state from "../../state/state";
import * as selectListView from "../../selectListView";
import * as React from "react";
import * as csx from "csx";

import CommonEditorRegistry = monaco.CommonEditorRegistry;
import EditorActionDescriptor = monaco.EditorActionDescriptor;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import ContextKey = monaco.ContextKey;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;

class GotoTypeScriptSymbolAction extends EditorAction {

    static ID = 'editor.action.gotoTypeScriptSymbol';

	constructor(descriptor:IEditorActionDescriptorData, editor:ICommonCodeEditor) {
		super(descriptor, editor);
	}

	public run():TPromise<boolean> {
        let editor = this.editor;
        const filePath = editor.filePath;

        if (!state.inActiveProjectFilePath(filePath)) {
            ui.notifyInfoNormalDisappear('The current file is no in the active project');
            return TPromise.as(true);
        }


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
                    monacoUtils.gotoPosition({editor, position:item.position});
                }
            });
        });

		return TPromise.as(true);
	}
}

CommonEditorRegistry.registerEditorAction(new EditorActionDescriptor(GotoTypeScriptSymbolAction, GotoTypeScriptSymbolAction.ID, 'Goto TypeScript Symbol in file', {
	context: ContextKey.EditorTextFocus,
	primary: KeyMod.CtrlCmd | KeyCode.KEY_H
}));
