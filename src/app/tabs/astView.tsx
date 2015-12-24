import * as ui from "../ui";
import * as csx from "csx";
import * as React from "react";
import * as tab from "./tab";
import {server,cast} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";
import * as d3 from "d3";
import {Types} from "../../socket/socketContract";
import * as $ from "jquery";
import * as styles from "../styles/styles";
import * as onresize from "onresize";
import {Clipboard} from "../clipboard";

type FileDependency = Types.FileDependency;
let EOL = '\n';

let {inputBlackStyle} = styles.Input;

/**
 * The styles
 */
require('./dependencyView.less');

import {CodeEditor} from "../codemirror/codeEditor";

export interface Props extends tab.ComponentProps {
}
export interface State {
}

@ui.Radium
export class ASTView extends ui.BaseComponent<Props, State> implements tab.Component {

    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
            cycles:[]
        };
    }

    refs: {
        [string: string]: any;
        graphRoot: HTMLDivElement;
        controlRoot: HTMLDivElement;
    }

    filePath: string;
    componentDidMount() {
        // server.getAST();
        // server.getASTFull();
    }

    render() {
        return (
            <div
                style={csx.extend(csx.vertical,csx.flex)}>
                AST View comming soon
            </div>
        );
    }

    /**
     * TAB implementation
     */
    focus = () => {
    }

    save = () => {
    }

    close = () => {
    }

    gotoPosition = (position: EditorPosition) => {
    }

    search = {
        doSearch: (options: FindOptions) => {
            // TODO
        },

        hideSearch: () => {
            // TODO
        },

        findNext: (options: FindOptions) => {
        },

        findPrevious: (options: FindOptions) => {
        },

        replaceNext: (newText: string) => {
        },

        replacePrevious: (newText: string) => {
        },

        replaceAll: (newText: string) => {
        }
    }
}
