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
import {testResultsCache} from "../../clientTestResultsCache";

import {blackHighlightColor} from "../../styles/styles";

export interface Props extends tab.TabProps {
}
export interface State {
    tests?: types.TestSuitesByFilePath;
    selected?: types.TestModule | null;
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

export class TestedView extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            tests: Object.create(null),
            selected: null
        };
    }

    componentDidMount() {

        /**
         * Initial load + load on result change
         */
        this.loadData();
        this.disposible.add(
            testResultsCache.testResultsDelta.on(() => {
                this.loadData();
            })
        );


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

    ctrls: {
        root?: HTMLDivElement
    }  = {};

    render() {
        return (
            <div
                ref={(root)=>this.ctrls.root = root}
                onFocus={this.props.onFocused}
                tabIndex={0}
                style={csx.extend(csx.vertical, csx.flex, csx.newLayerParent, styles.someChildWillScroll, {color: styles.textColor}) }
                onKeyPress={this.handleKey}>
                <div style={{overflow: 'hidden', padding:'10px 0px 10px 10px', display: 'flex'}}>
                    <gls.FlexHorizontal style={{}}>
                        <gls.Content style={{ width: '200px', overflow: 'auto' }}>
                            <typeIcon.SectionHeader text="Files"/>
                            <gls.SmallVerticalSpace/>
                            {
                                this.renderFiles()
                            }
                        </gls.Content>
                        <gls.FlexVertical style={{marginLeft: '5px', overflow: 'auto'}}>
                            {
                                this.state.selected
                                ? this.renderSelectedNode()
                                : 'Select a module from the left to view results 🌹'
                            }
                        </gls.FlexVertical>
                    </gls.FlexHorizontal>

                </div>
            </div>
        );
    }

    renderFiles(){
        return Object.keys(this.state.tests).map((fp, i) => {
            const item = this.state.tests[fp];
            return (
                <div
                    title={item.filePath}
                    key={i}
                    style={{ cursor: 'pointer', paddingTop: '2px', paddingBottom: '2px', paddingLeft: '2px' }}
                    onClick={() => this.handleRootSelected(item) }>
                </div>
            )
        });
    }

    renderSelectedNode() {
        const node = this.state.selected;
        return this.renderNode(node);
    }

    renderNode(node: types.TestModule, i = 0) {
        return (
            <div key={i} style={{paddingTop: '5px'}}>
                {node.filePath}
            </div>
        );
    }

    handleNodeClick = (node: types.DocumentedType) => {
        commands.doOpenOrFocusFile.emit({
            filePath: node.location.filePath,
            position: node.location.position
        });
    }

    handleRootSelected = (node: types.TestModule) => {
        this.setState({ selected: node });
    }

    handleKey = (e: any) => {
        let unicode = e.charCode;
        if (String.fromCharCode(unicode).toLowerCase() === "r") {
            this.loadData();
        }
    }

    loadData = () => {
        const results = testResultsCache.getResults();
        this.setState({tests: results});
    }

    /**
     * TAB implementation
     */
    resize = () => {
        // Not needed
    }

    focus = () => {
        this.ctrls.root.focus();
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
