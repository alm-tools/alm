import * as ui from "../../ui";
import * as csx from "csx";
import * as React from "react";
import * as tab from "./tab";
import {server, cast} from "../../../socket/socketClient";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";
import * as d3 from "d3";
import {Types} from "../../../socket/socketContract";
import * as types from "../../../common/types";
import {IconType} from "../../../common/types";
import * as $ from "jquery";
import * as styles from "../../styles/styles";
import * as onresize from "onresize";
import {Clipboard} from "../../components/clipboard";
import * as typeIcon from "../../components/typeIcon";
import * as gls from "../../base/gls";
import * as fstyle from "../../base/fstyle";
import {MarkDown} from "../../markdown/markdown";

let {inputBlackStyle} = styles.Input;
import {CodeEditor} from "../../codemirror/codeEditor";

/**
 * A color that looks nice over the "Codemirror" background black
 */
const blackHighlightColor = "#1C1D18"

export interface Props extends tab.TabProps {
}
export interface State {
    filter?: string;
    classes?: types.UMLClass[];
    selected?: types.UMLClass;
}

export namespace DocumentationViewStyles {
    export const header = fstyle.style({
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        }
    });

    export const folderName = fstyle.style({
        padding: "2px",
        fontSize: '.5em',
        '-webkitUserSelect': 'none',
        maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis'
    });
}

export class UmlView extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
            filter: '',
            classes: [],
            selected: null,
        };
    }

    refs: {
        [string: string]: any;
        root: HTMLDivElement;
        graphRoot: HTMLDivElement;
        controlRoot: HTMLDivElement;
    }

    filePath: string;
    componentDidMount() {

        /**
         * Initial load + load on project change
         */
        this.loadData();
        this.disposible.add(
            cast.activeProjectFilePathsUpdated.on(() => {
                this.loadData();
            })
        );

        /**
         * If a file is selected and it gets edited, reload the file module information
         */
        const loadDataDebounced = utils.debounce(this.loadData, 3000);
        this.disposible.add(
            commands.fileContentsChanged.on((res) => {
                if (this.filePath !== res.filePath) return;
                loadDataDebounced();
            })
        );

        /**
         * Handle focus to inform tab container
         */
        const focused = () => {
            this.props.onFocused();
        }
        this.refs.root.addEventListener('focus', focused);
        this.disposible.add({
            dispose: () => {
                this.refs.root.removeEventListener('focus', focused);
            }
        })

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

    render() {
        return (
            <div
                ref="root"
                tabIndex={0}
                style={csx.extend(csx.vertical, csx.flex, csx.newLayerParent, styles.someChildWillScroll, {color: styles.textColor}) }
                onKeyPress={this.handleKey}>
                <div style={{overflow: 'hidden', padding:'10px', display: 'flex'}}>

                </div>
            </div>
        );
    }

    handleKey = (e: any) => {
        let unicode = e.charCode;
        if (String.fromCharCode(unicode).toLowerCase() === "r") {
            this.loadData();
        }
    }

    filter = () => {
        // TODO:
    }

    loadData = () => {
        server.getUmlDiagramForFile({filePath: this.filePath}).then(res => {
            this.setState({classes:res.classes, selected: null});
            console.log(res.classes);
            this.filter();
        })
    }

    /**
     * TAB implementation
     */
    resize = () => {
        // Not needed
    }

    focus = () => {
        this.refs.root.focus();
    }

    save = () => {
    }

    close = () => {
    }

    gotoPosition = (position: EditorPosition) => {
    }

    search = {
        doSearch: (options: FindOptions) => {
            this.setState({ filter: options.query });
        },

        hideSearch: () => {
            this.setState({ filter: '' });
        },

        findNext: (options: FindOptions) => {
        },

        findPrevious: (options: FindOptions) => {
        },

        replaceNext: ({newText}: { newText: string }) => {
        },

        replacePrevious: ({newText}: { newText: string }) => {
        },

        replaceAll: ({newText}: { newText: string }) => {
        }
    }
}
