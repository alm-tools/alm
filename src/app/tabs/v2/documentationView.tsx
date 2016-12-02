import * as ui from "../../ui";
import * as csx from '../../base/csx';
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
import * as styles from "../../styles/themes/current/base";
import * as onresize from "onresize";
import {Clipboard} from "../../components/clipboard";
import * as typeIcon from "../../components/typeIcon";
import * as gls from "../../base/gls";
import * as typestyle from "typestyle";
import {MarkDown} from "../../markdown/markdown";

import {blackHighlightColor} from "../../styles/themes/current/base";

export interface Props extends tab.TabProps {
}
export interface State {
    files?: types.DocumentedType[];
    selected?: types.DocumentedType | null;
    filtered?: types.DocumentedType[];
    filter?: string;

    selectedDoesNotMatchFilter?: boolean;
}

export namespace DocumentationViewStyles {
    export const header = typestyle.style({
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        }
    });

    export const folderName = typestyle.style({
        padding: "2px",
        fontSize: '.5em',
        '-webkitUserSelect': 'none',
        maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis'
    });
}

export class DocumentationView extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
            filtered: [],
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
        const isFilePathOfSignificance = (filePath:string) => !!this.state.selected && this.state.selected.location.filePath === filePath;
        const reloadSelectedDebounced = utils.debounce((filePath) => {
            if (!isFilePathOfSignificance(filePath)) return;
            server.getUpdatedModuleInformation({
                filePath
            }).then((res)=>{
                if (!isFilePathOfSignificance(filePath)) return;
                const files = this.state.files.map(f => { return (f.location.filePath === filePath) ? res : f });
                this.setState({ files, selected: res });
                this.filter();
            })
        }, 3000);
        this.disposible.add(
            commands.fileContentsChanged.on((res) => {
                if (!isFilePathOfSignificance(res.filePath)) return;
                reloadSelectedDebounced(res.filePath);
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
                                this.state.selected && this.state.selectedDoesNotMatchFilter &&
                                <gls.Content style={{backgroundColor: '#111', padding: '5px'}}>
                                    Note: Nothing in the selected module matches the filter, so showing it all
                                </gls.Content>
                            }
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

    renderFiles(){
        /** For two items in different file paths we render the folder name in between */
        const toRender: {
            folder?: string,
            type?: types.DocumentedType,
        }[] = [];

        let lastKnownFolder = ''
        this.state.filtered.forEach(type => {
            const folder = utils.getDirectory(type.name);
            if (folder !== lastKnownFolder){
                toRender.push({
                    folder
                });
                lastKnownFolder = folder;
            }
            toRender.push({
                type
            });
        });

        return toRender.map((item, i) => {
            if (item.type){
                const file = item.type;
                const name = utils.getFileName(file.name);
                const backgroundColor = this.state.selected && this.state.selected.name === file.name
                    ? blackHighlightColor
                    : 'transparent';
                return (
                    <div
                        title={file.name}
                        key={i}
                        style={{ cursor: 'pointer', backgroundColor, paddingTop: '2px', paddingBottom: '2px', paddingLeft: '2px' }}
                        onClick={() => this.handleRootSelected(file)}>
                        <typeIcon.DocumentedTypeHeader name={name} icon={file.icon}/>
                    </div>
                )
            }
            else {
                const folder = item.folder;
                return (
                    <div
                        title={folder}
                        key={i}
                        className={DocumentationViewStyles.folderName}>
                        {folder}
                    </div>
                )
            }
        });
    }

    renderSelectedNode() {
        const node = this.state.selected;
        return this.renderNode(node);
    }

    renderNode(node: types.DocumentedType, i = 0) {
        return (
            <div key={i} style={{paddingTop: '5px'}}>
                <gls.InlineBlock className={DocumentationViewStyles.header} onClick={()=>this.handleNodeClick(node)}>
                    <typeIcon.DocumentedTypeHeader name={node.name} icon={node.icon} />
                </gls.InlineBlock>
                {
                    node.comment &&
                    <div style={{ padding: '5px', backgroundColor: blackHighlightColor}}>
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

    handleRootSelected = (node: types.DocumentedType) => {
        this.setState({ selected: node });
        setTimeout(() => this.filter());
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
            this.filter();
        })
    }

    filter = () => {
        const filter = (this.state.filter || '').toLowerCase();
        if (!filter) {
            const filtered = this.state.files;
            const selected = this.state.selected && filtered.find(f => f.name == this.state.selected.name);
            this.setState({ filtered, selected, selectedDoesNotMatchFilter: false });
            return;
        }

        /**
         * Does the name match or does some subItem name match
         */
        const doesNameMatchRecursive = (type: types.DocumentedType) => {
            return type.name.toLowerCase().indexOf(filter) !== -1 || type.subItems.some(t => doesNameMatchRecursive(t));
        }

        /**
         * Only leaves in the subItems that match
         */
        const mapChildrenRecursive = (item: types.DocumentedType) => {
            let subItems =
                item.subItems
                    .filter(doesNameMatchRecursive)
                    .map(mapChildrenRecursive);
            const result: types.DocumentedType = {
                name: item.name,
                icon: item.icon,
                comment: item.comment,
                location: item.location,
                subItems,
            }
            return result;
        }

        const filtered =
            this.state.files
                .filter(f => {
                    return doesNameMatchRecursive(f);
                })
                .map(mapChildrenRecursive);
        this.setState({filtered})

        // Also filter inside the selected if possible
        const selected = this.state.selected && filtered.find(f => f.name == this.state.selected.name);
        if (this.state.selected && !selected) {
            this.setState({selectedDoesNotMatchFilter: true});
        }
        else {
            this.setState({ selected, selectedDoesNotMatchFilter: false });
        }
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
            this.filter();
        },

        hideSearch: () => {
            this.setState({ filter: '' });
            this.filter();
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
