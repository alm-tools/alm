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

export interface Props extends tab.TabProps {
}
export interface State {
    files?: types.DocumentedType[];
    selected?: types.DocumentedType | null;
}

export namespace DocumentationViewStyles {
    export const header = fstyle.style({
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        }
    })
}

export class DocumentationView extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
            files: [],
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
                    <gls.FlexHorizontal style={{padding:'10px 0px 10px 10px'}}>
                        <gls.Content style={{ minWidth: '150px', maxWidth: '250px', overflow: 'hidden' }}>
                            <typeIcon.SectionHeader text="Files"/>
                            <gls.SmallVerticalSpace/>
                            {
                                this.state.files.map((l, i) => {
                                    const name = l.name.length > 20 ? utils.getFileName(l.name) : l.name;
                                    return (
                                        <div key={i} style={{ cursor: 'pointer' }} onClick={() => this.setState({ selected: l }) }>
                                            <typeIcon.DocumentedTypeHeader name={name} icon={l.icon}/>
                                        </div>
                                    )
                                })
                            }
                        </gls.Content>
                        <gls.FlexVertical style={{marginLeft: '5px'}}>
                            {
                                this.state.selected
                                ? this.renderSelectedNode()
                                : 'Select a module from the left to view its documentation 🌹'
                            }
                            <div style={{marginTop: '10px', marginRight: '10px'}}>
                                <hr/>
                                <typeIcon.TypeIconLegend />
                            </div>
                        </gls.FlexVertical>
                    </gls.FlexHorizontal>

                </div>
            </div>
        );
    }

    renderSelectedNode() {
        const node = this.state.selected;
        return this.renderNode(node);
    }

    renderNode(node: types.DocumentedType, i = 0) {
        return (
            <div key={i} style={{ padding: '5px' }}>
                <gls.InlineBlock className={DocumentationViewStyles.header} onClick={()=>this.handleNodeClick(node)}>
                    <typeIcon.DocumentedTypeHeader name={node.name} icon={node.icon} />
                </gls.InlineBlock>
                {
                    node.comment &&
                    <div style={{ padding: '5px', backgroundColor: 'rgb(28, 29, 24)'}}>
                        <MarkDown markdown={node.comment}/>
                    </div>
                }
                {
                    node.subItems && !!node.subItems.length &&
                    <div style={{ border: '1px solid grey', marginTop:'5px', padding: '5px' }}>
                        {node.subItems.map((n, i) => this.renderNode(n, i)) }
                    </div>
                }
            </div>
        );
    }

    handleNodeClick = (node: types.DocumentedType) => {
        commands.doOpenOrFocusFile.emit({
            filePath: node.location.filePath,
            position: node.location.position
        });
    }

    handleKey = (e: any) => {
        let unicode = e.charCode;
        if (String.fromCharCode(unicode).toLowerCase() === "r") {
            this.loadData();
        }
    }

    loadData = () => {
        server.getTopLevelModuleNames({}).then(res => {
            this.setState({files:res.files, selected: null});
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
