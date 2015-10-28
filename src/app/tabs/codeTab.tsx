import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {server,cast} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";

import {CodeEditor} from "../codemirror/codeEditor";

export interface Props extends tab.ComponentProps {
}
export interface State {
}

/**
 * This is a thin wrapper around `CodeEditor` with the following key motivations
 * - All server code must go through here
 * - All tab type stuff must go through here
 */
export class Code extends ui.BaseComponent<Props, State> implements tab.Component {

    constructor(props: Props) {
        super(props);
        this.state = {
        };
    }

    refs: { [string: string]: any; editor: CodeEditor; }

    filePath: string;
    componentDidMount() {
        this.filePath = utils.getFilePathFromUrl(this.props.url);

        server.openFile({ filePath: this.filePath }).then((res) => {
            this.refs.editor.setValue(res.contents, true);
            commands.didOpenFile.emit({ filePath: this.props.url });
            this.props.onSavedChanged(res.saved);
        });

        this.disposible.add(cast.savedFileChangedOnDisk.on((res)=>{
            if (res.filePath == this.filePath
                && this.refs.editor.getValue() !== res.contents) {
                this.refs.editor.setValue(res.contents, false);
            }
        }));

        this.disposible.add(cast.didEdit.on(res=> {
            if (res.filePath == this.filePath) {
                this.refs.editor.applyCodeEdit(res.edit);
            }
        }));

        this.disposible.add(cast.didStatusChange.on(res=>{
            if (res.filePath == this.filePath) {
                this.props.onSavedChanged(res.saved);
            }
        }));
    }
    componentWillUnmount(){
        this.disposible.dispose();
    }

    render() {
        return (
            <CodeEditor
            ref='editor'
            path={this.props.url}
            onEdit={this.onEdit}
            />
        );

        return <div>
            Code to go here: {this.props.url}
            </div>;
    }


    onEdit = (edit: CodeEdit) => {
        server.editFile({ filePath: this.filePath, edit: edit }).then((res)=>{
            this.props.onSavedChanged(res.saved);
        });
    }

    focus = () => {
        this.refs.editor.focus();
    }

    save = () => {
        server.saveFile({ filePath: this.filePath }).then(()=>{this.props.onSavedChanged(true)});
    }

    close = () => {
        server.closeFile({filePath: this.filePath});
    }

    gotoPosition = (position: EditorPosition) => {
        this.refs.editor.gotoPosition(position);
    }

    search = (query: FindOptions) => {
        this.refs.editor.search(query);
    }

    clearSearch = () => {
        this.refs.editor.clearSearch();
    }
}
