import * as ui from "../../ui";
import * as React from "react";
import * as tab from "./tab";
import {server,cast} from "../../../socket/socketClient";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";

import {store} from "../../state/state";
import { Provider } from 'react-redux';

import {CodeEditor} from "../../codemirror/codeEditor";

export interface Props extends tab.TabProps {
}
export interface State {
}

/**
 * This is a thin wrapper around `CodeEditor` with the following key motivations
 * - All server code must go through here
 * - All tab type stuff must go through here
 */
export class Code extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
        };
    }

    refs: { [string: string]: any; editor: CodeEditor; }

    filePath: string;
    saved: boolean = true;
    componentDidMount() {

        server.getFileStatus({filePath:this.filePath}).then((res)=>{
            this.saved = res.saved;
            this.props.onSavedChanged(res.saved);
        });

        this.disposible.add(cast.didStatusChange.on(res=>{
            if (res.filePath == this.filePath) {
                this.saved = res.saved;
                this.props.onSavedChanged(res.saved);
            }
        }));

        this.props.setCodeEditor(this.refs.editor);

        // Listen to tab events
        const api = this.props.api;
        this.disposible.add(api.resize.on(this.resize));
        this.disposible.add(api.focus.on(this.focus));
        this.disposible.add(api.save.on(this.save));
        this.disposible.add(api.close.on(this.close));
        this.disposible.add(api.gotoPosition.on(this.gotoPosition));
        // Listen to search tab events
        this.disposible.add(api.search.doSearch.on(this.search.doSearch));
        this.disposible.add(api.search.hideSearch.on(this.search.hideSearch));
        this.disposible.add(api.search.findNext.on(this.search.findNext));
        this.disposible.add(api.search.findPrevious.on(this.search.findPrevious));
        this.disposible.add(api.search.replaceNext.on(this.search.replaceNext));
        this.disposible.add(api.search.replacePrevious.on(this.search.replacePrevious));
        this.disposible.add(api.search.replaceAll.on(this.search.replaceAll));
    }
    componentWillUnmount() {
        this.disposible.dispose();
    }

    render() {
        return (
            <Provider store={store}>
                <CodeEditor
                ref='editor'
                filePath={this.filePath}
                onFocusChange={
                    (focus) => {
                        /* Auto save on focus loss */
                        !focus && !this.saved && this.save();
                        /** Tell tab container of activation */
                        focus && this.props.onFocused();
                    }
                }
                />
            </Provider>
        );
    }

    resize = () => {
        this.refs.editor.resize();
    }

    focus = () => {
        this.refs.editor.focus();
    }

    save = () => {
        server.saveFile({ filePath: this.filePath }).then(()=>{
            this.saved = true;
            this.props.onSavedChanged(true);
        });
    }

    close = () => {
        server.closeFile({filePath: this.filePath});
    }

    gotoPosition = (position: EditorPosition) => {
        this.refs.editor.gotoPosition(position);
    }

    search = {
        doSearch: (options: FindOptions) => {
            this.refs.editor.search(options);
        },

        hideSearch: () => {
            this.refs.editor.hideSearch();
        },

        findNext: (options: FindOptions) => {
            this.refs.editor.findNext(options);
        },

        findPrevious: (options: FindOptions) => {
            this.refs.editor.findPrevious(options);
        },

        replaceNext: ({newText}: { newText: string }) => {
            this.refs.editor.replaceNext(newText);
        },

        replacePrevious: ({newText}: { newText: string }) => {
            this.refs.editor.replacePrevious(newText);
        },

        replaceAll: ({newText}: { newText: string }) => {
            this.refs.editor.replaceAll(newText);
        }
    }
}
