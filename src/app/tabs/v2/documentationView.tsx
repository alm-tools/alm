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
import * as $ from "jquery";
import * as styles from "../../styles/styles";
import * as onresize from "onresize";
import {Clipboard} from "../../components/clipboard";
import {TypeIcon, IconType, TypeIconLegend} from "../../components/typeIcon";
import * as gls from "../../base/gls";

let {inputBlackStyle} = styles.Input;
import {CodeEditor} from "../../codemirror/codeEditor";

export interface Props extends tab.TabProps {
}
export interface State {
    locals: types.NavigateToItem[];
}

let controlRootStyle = {
    pointerEvents: 'none',
}
let controlRightStyle = {
    width: '200px',
    padding: '10px',

    overflow: 'auto',
    wordBreak: 'break-all'
}
let controlItemStyle = {
    pointerEvents: 'auto',

    padding: '.4rem',
    transition: 'background .2s',
    background: 'rgba(200,200,200,.05)',
    ':hover': {
        background: 'rgba(200,200,200,.25)',
    }
}
let cycleHeadingStyle = {
    fontSize: '1.2rem',
}

@ui.Radium
export class DocumentationView extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
            locals: []
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

        this.loadData();
        this.disposible.add(
            cast.activeProjectConfigDetailsUpdated.on(() => {
                this.loadData();
            })
        );

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
                <div style={{overflow: 'auto'}}>
                    <gls.FlexHorizontal style={{padding:'10px'}}>
                        <gls.Content style={{ width: '150px' }}>
                            {
                                // TODO: list the modules
                                this.state.locals.map((l, i) => {
                                    return (
                                        <div key={i}>{l.name} {l.fileName}</div>
                                    )
                                })
                            }
                        </gls.Content>
                        <gls.FlexVertical>
                            {
                                // TODO : list the current module or global help about the documentation view
                            }
                            Docs for the current module or global help
                        </gls.FlexVertical>
                    </gls.FlexHorizontal>
                    <TypeIconLegend />
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

    loadData = () => {
        server.getTopLevelModuleNames({}).then(res => {
            this.setState({locals:res.locals})
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
        },

        hideSearch: () => {
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
