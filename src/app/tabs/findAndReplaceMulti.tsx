import * as ui from "../ui";
import * as csx from "csx";
import * as React from "react";
var ReactDOM = require("react-dom");
import * as tab from "./tab";
import {server,cast} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";
import * as d3 from "d3";
import * as $ from "jquery";
import * as styles from "../styles/styles";
import * as onresize from "onresize";
import {Clipboard} from "../clipboard";
import {CodeEditor} from "../codemirror/codeEditor";
import {Types} from "../../socket/socketContract";
import {Icon} from "../icon";

type NodeDisplay = Types.NodeDisplay;
let EOL = '\n';

/**
 * The styles
 */
let {inputBlackStyle} = styles.Input;
import {inputCodeStyle,searchOptionsLabelStyle}
 from "../findAndReplace";

namespace ResultsStyles {
    const textColor = '#DDD';

    export const root = csx.extend(
        csx.flex,
        csx.scroll,
        styles.padded1,
        {
            border: '1px solid grey',
            ':focus':{
                border: '1px solid ' + styles.highlightColor,
            }
        }
    );

    export const header = {
        fontSize:'1.2em',
        fontWeight: 'bold',
        color:textColor,
    }
}

/**
 * Props / State
 */
export interface Props extends tab.ComponentProps {
}
export interface State {
    farmResultByFilePath?: Types.FarmResultsByFilePath;

    /**
     * Search state
     */
    findQuery?: string;
    replaceQuery?: string;
    isRegex?: boolean;
    isCaseSensitive?: boolean;
    isFullWord?: boolean;
}

@ui.Radium
export class FindAndReplaceView extends ui.BaseComponent<Props, State> implements tab.Component {
    constructor(props: Props) {
        super(props);
        let {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(props.url);
        this.filePath = filePath;
        this.state = {
        };
    }

    filePath: string;
    mode: Types.ASTMode;
    componentDidMount() {
        this.disposible.add(commands.esc.on(()=>{
            server.stopFarmingIfRunning({});
        }));

        this.disposible.add(commands.findAndReplace.on(()=>{
            this.findInput().focus();
        }));

        this.disposible.add(commands.findAndReplaceMulti.on(()=>{
            this.findInput().focus();
        }));
    }

    refs: {
        [string: string]: any;
        results: HTMLDivElement;

        find: JSX.Element;
        replace: JSX.Element;
        regex: {refs:{input: JSX.Element}};
        caseInsensitive: {refs:{input: JSX.Element}};
        fullWord: {refs:{input: JSX.Element}};
    }
    findInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);
    replaceInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.replace);
    regexInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.regex.refs.input);
    caseInsensitiveInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.caseInsensitive.refs.input);
    fullWordInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.fullWord.refs.input);

    replaceWith = () => this.replaceInput().value;

    render() {
        let noSearch = true;
        return (
            <div
                style={csx.extend(csx.vertical, csx.flex, styles.noFocusOutline) }>
                <div ref="results" tabIndex={0} style={ResultsStyles.root}>
                    {
                        noSearch
                        ? <div style={ResultsStyles.header}>No Search</div>
                        : <noscript/>

                        // TODO: The search results go here
                    }
                </div>
                <div style={csx.extend(csx.flexRoot, styles.padded1) }>
                    {
                        this.renderSearchControls()
                    }
                </div>
            </div>
        );
    }

    renderSearchControls() {
        return (
            <div style={csx.flex}>
                <div style={[csx.horizontal]}>
                    <div style={[csx.flex, csx.vertical]}>
                        <div style={[csx.horizontal, csx.center, styles.padded1]}>
                            <input tabIndex={1} ref="find"
                                placeholder="Find"
                                style={[inputBlackStyle, inputCodeStyle, csx.flex]}
                                onKeyDown={this.findKeyDownHandler}
                                onChange={this.findChanged} defaultValue={''}/>
                        </div>
                        <div style={[csx.horizontal, csx.center, styles.padded1]}>
                            <input tabIndex={2} ref="replace"
                                placeholder="Replace"
                                style={[inputBlackStyle, inputCodeStyle, csx.flex]}
                                onKeyDown={this.replaceKeyDownHandler} />
                        </div>
                    </div>
                    <div style={[csx.centerCenter]}>
                        <div style={[csx.horizontal, csx.aroundJustified, styles.padded1]}>
                            <label style={[csx.horizontal,csx.center]}>
                                <ui.Toggle
                                    tabIndex={3}
                                    ref="regex"
                                    onChange={this.handleRegexChange}/>
                                <span style={searchOptionsLabelStyle}>
                                    .*
                                </span>
                            </label>
                            <label style={[csx.horizontal,csx.center]}>
                                <ui.Toggle
                                    tabIndex={4}
                                    ref="caseInsensitive"
                                    onChange={this.handleCaseSensitiveChange}/>
                                <span style={searchOptionsLabelStyle}>
                                    Aa
                                </span>
                            </label>
                            <label style={[csx.horizontal,csx.center]}>
                                <ui.Toggle
                                    tabIndex={5}
                                    ref="fullWord"
                                    onKeyDown={this.fullWordKeyDownHandler}
                                    onChange={this.handleFullWordChange}/>
                                <span style={searchOptionsLabelStyle}>
                                    <Icon name="text-width"/>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
                <div style={[styles.Tip.root]}>
                    <span style={styles.Tip.keyboardShortCutStyle}>Esc</span> to focus on results
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>Up/Down</span> to go through results
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>Enter</span> to open a search result
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>{commands.modName} + Enter</span> to replace
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>{commands.modName} + Shift + Enter</span> to replace all
                </div>
            </div>
        );
    }

    /**
     * Input Change handlers
     */
     fullWordKeyDownHandler = (e:React.SyntheticEvent) => {
         let {tab,shift,enter} = ui.getKeyStates(e);

         if (tab && !shift) {
             this.findInput().focus();
             e.preventDefault();
             return;
         }
     };
     findKeyDownHandler = (e:React.SyntheticEvent) => {
         let {tab,shift,enter,mod} = ui.getKeyStates(e);

         if (shift && tab) {
             this.fullWordInput() && this.fullWordInput().focus();
             e.preventDefault();
             return;
         }

         /**
          * Handling commit
          */
         if (!this.state.findQuery) {
             return;
         }
         if (enter) {
             this.startSearch();
         }
     };
     replaceKeyDownHandler = (e:React.SyntheticEvent) => {
         let {tab,shift,enter,mod} = ui.getKeyStates(e);

         /**
          * Handling commit
          */
         if (!this.state.findQuery) {
             return;
         }
         if (mod && enter) {
             commands.replaceAll.emit({newText:this.replaceWith()});
             return;
         }
         if (shift && enter) {
             commands.replacePrevious.emit({newText:this.replaceWith()});
             return;
         }
         if (enter) {
             commands.replaceNext.emit({newText:this.replaceWith()});
             return;
         }
     };
     findChanged = utils.debounce(() => {
         let val = this.findInput().value.trim();
         this.setState({findQuery:val});
     },200);
     handleRegexChange = (e) => {
         let val: boolean = e.target.checked;
         this.setState({isRegex:val});
     }
     handleCaseSensitiveChange = (e) => {
         let val: boolean = e.target.checked;
         this.setState({isCaseSensitive:val});
     }
     handleFullWordChange = (e) => {
         let val: boolean = e.target.checked;
         this.setState({isFullWord:val});
     }

     startSearch() {
         server.startFarming({
             query: this.state.findQuery,
             isRegex: this.state.isRegex,
             isFullWord: this.state.isFullWord,
             isCaseSensitive: this.state.isCaseSensitive,
             globs:[]
         });
     }

    /**
     * TAB implementation
     */
    focus = () => {
        this.refs.results.focus();
    }

    save = () => {
    }

    close = () => {
    }

    gotoPosition = (position: EditorPosition) => {
    }

    search = {
        doSearch: (options: FindOptions) => {
            // not needed
        },

        hideSearch: () => {
            // not needed
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
