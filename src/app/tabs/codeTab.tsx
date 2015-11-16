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
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
        };
    }

    refs: { [string: string]: any; editor: CodeEditor; }

    filePath: string;
    componentDidMount() {

        server.getFileStatus({filePath:this.filePath}).then((res)=>{
            this.props.onSavedChanged(res.saved);
        });

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
            filePath={this.filePath}
            />
        );
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

    search = (options: FindOptions) => {
        this.refs.editor.search(options);
    }

    hideSearch = () => {
        this.refs.editor.hideSearch();
    }

    findNext = (options: FindOptions) => {
        this.refs.editor.findNext(options);
    }

    findPrevious = (options: FindOptions) => {
        this.refs.editor.findPrevious(options);
    }

    replaceNext = (newText: string) => {
        this.refs.editor.replaceNext(newText);
    }

    replaceAll = (newText: string) => {
        this.refs.editor.replaceAll(newText);
    }
}
