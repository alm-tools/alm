import * as ui from "../../ui";
import * as csx from "../../base/csx";
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

const {blackHighlightColor} = styles;

export interface Props extends tab.TabProps {
}
export interface State {
    filter?: string;
    classes?: types.UMLClass[];
    selected?: types.UMLClass;
}

export namespace UmlViewStyles {
    export const classNameHeaderSection = typestyle.style({
        border: '1px solid grey',
        padding: '5px',

        /** A nice clickable look */
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        }
    });

    export const classMemberSection = typestyle.style({
        // Common with header
        border: '1px solid grey',
        padding: '5px',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        },

        // To eat top border
        marginTop: '-1px'
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
                <div style={{overflow: 'hidden', padding:'10px 0px 10px 10px', display: 'flex'}}>
                    <gls.FlexHorizontal style={{}}>
                        <gls.Content style={{ minWidth: '150px', maxWidth: '250px', overflow: 'auto' }}>
                            <typeIcon.SectionHeader text="Classes"/>
                            <gls.SmallVerticalSpace/>
                            {
                                this.state.classes.length
                                ? this.renderClasses()
                                : "No classes in file"
                            }
                        </gls.Content>
                        <gls.FlexVertical style={{marginLeft: '5px', overflow: 'auto'}}>
                            {
                                this.state.selected
                                ? this.renderSelectedClass()
                                : 'Select a class from the left to view its diagram 🌹 🎼'
                            }
                            <div style={{marginTop: '10px', marginRight: '10px'}}>
                                <hr/>
                                <typeIcon.TypeIconClassDiagramLegend />
                            </div>
                        </gls.FlexVertical>
                    </gls.FlexHorizontal>
                </div>
            </div>
        );
    }

    renderClasses()  {
        return this.state.classes.map((c, i) => {
            const backgroundColor = this.state.selected && this.state.selected.name === c.name
                ? blackHighlightColor
                : 'transparent';
            return (
                <div
                    title={c.name + ' ' + c.location.position.line}
                    key={i}
                    style={{ cursor: 'pointer', backgroundColor, paddingTop: '2px', paddingBottom: '2px', paddingLeft: '2px' }}
                    onClick={() => this.handleClassSelected(c) }>
                    <typeIcon.DocumentedTypeHeader name={c.name} icon={c.icon}/>
                </div>
            );
        });
    }

    renderSelectedClass() {
        const c = this.state.selected;
        return <gls.Content style={{textAlign: 'center'}}>
            <code style={{fontWeight: 'bold'}}>{c.name}</code>
            <gls.SmallVerticalSpace/>
            {this.renderClass(c)}
        </gls.Content>
    }

    renderClass(c: types.UMLClass) {
        const renderSection = (section,i) => {
            return <div key={i} style={{border:'1px solid grey', padding: '5px', marginTop: '-1px'}}>
                {section}
            </div>
        }
        return (
            <gls.Content style={{textAlign: 'center'}}>
                <gls.InlineBlock style={{paddingTop:'1px'}}>
                    <div className={UmlViewStyles.classNameHeaderSection} onClick={()=>this.handleGotoTypeLocation(c.location)}>
                        <typeIcon.DocumentedTypeHeader name={c.name} icon={c.icon}/>
                    </div>
                    {
                        c.members.map((m,i)=>{
                            return <div key={i} className={UmlViewStyles.classMemberSection} onClick={()=>this.handleGotoTypeLocation(m.location)}>
                                <typeIcon.DocumentedTypeHeader name={m.name} icon={m.icon} visibility={m.visibility} lifetime={m.lifetime} override={!!m.override}/>
                            </div>
                        })
                    }
                    {
                        !!c.extends &&
                        <gls.Content>
                            <code>extends</code>
                            {this.renderClass(c.extends)}
                        </gls.Content>
                    }
                </gls.InlineBlock>
            </gls.Content>
        );
    }

    handleClassSelected(c: types.UMLClass) {
        this.setState({ selected: c });
    }

    handleGotoTypeLocation(location: types.DocumentedTypeLocation) {
        commands.doOpenOrFocusFile.emit({
            filePath: location.filePath,
            position: location.position
        });
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
            // Preserve selected
            let selected = this.state.selected && res.classes.find(c => c.name === this.state.selected.name);
            // otherwise auto select first
            if (!selected && res.classes.length) {
                selected = res.classes[0];
            }
            this.setState({ classes: res.classes, selected });
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
