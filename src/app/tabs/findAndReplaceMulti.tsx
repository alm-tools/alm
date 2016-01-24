import * as ui from "../ui";
import * as csx from "csx";
import * as React from "react";
var ReactDOM = require("react-dom");
import * as tab from "./tab";
import {server, cast} from "../../socket/socketClient";
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
import * as Mousetrap from "mousetrap";

type NodeDisplay = Types.NodeDisplay;
let EOL = '\n';

/**
 * The styles
 */
let {inputBlackStyle} = styles.Input;
import {inputCodeStyle, searchOptionsLabelStyle}
from "../findAndReplace";

namespace ResultsStyles {
    export const root = csx.extend(
        csx.flex,
        csx.scroll,
        styles.padded1,
        {
            border: '1px solid grey',
            ':focus': {
                border: '1px solid ' + styles.highlightColor,
            }
        }
    );

    export const header = csx.extend(
        styles.padded1,
        {
            cursor: 'default',
            fontSize: '1.5em',
            fontWeight: 'bold',
            color: styles.textColor,
            background: 'black',
            border:'2px solid grey',
        }
    );

    export let preview = {
        padding: '3px',
        background: 'black',
        cursor: 'pointer',
        userSelect: 'text',
    }

    export let selected = {
        backgroundColor: styles.selectedBackgroundColor
    };
}

/**
 * Props / State
 */
export interface Props extends tab.ComponentProps {
}
export interface State {
    completed?:boolean;
    results?: Types.FarmResultDetails[];
    farmResultByFilePath?: Types.FarmResultsByFilePath;

    /**
     * Results view state
     */
    collapsedState?: { [filePath: string]: boolean };
    selected?: { filePath?: string; line?: number /* If we have a filePath selected (instead of a search result) we set this to -1*/ };

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
        let {protocol, filePath} = utils.getFilePathAndProtocolFromUrl(props.url);
        this.filePath = filePath;
        this.state = {
            farmResultByFilePath: {},
            collapsedState: {},
            selected:{},
        };
    }

    filePath: string;
    mode: Types.ASTMode;
    componentDidMount() {
        /**
         * Keyboard: Focus
         */
        this.disposible.add(commands.findAndReplace.on(() => {
            this.findInput().focus();
        }));
        this.disposible.add(commands.findAndReplaceMulti.on(() => {
            this.findInput().focus();
        }));

        /**
         * Keyboard: Stop
         */
        this.disposible.add(commands.esc.on(() => {
            // Disabled as esc is used to focus search results as well
            // server.stopFarmingIfRunning({});
        }));

        /**
         * Initial load && keeping it updated
         */
        server.farmResults({}).then(res => {
            this.parseResults(res);
        });
        this.disposible.add(cast.farmResultsUpdated.on(res=>{
            this.parseResults(res);
        }));

        /**
         * Handle the keyboard in the search results
         */
        let treeRoot = this.refs.results;
        let handlers = new Mousetrap(treeRoot);

        let selectFirst = () => {
            if (this.state.results && this.state.results.length) {
                this.setSelected(this.state.results[0].filePath, -1);
            }
        }
        handlers.bind('up',()=>{
            // initial state
            if (!this.state.results || !this.state.results.length) return false;
            if (!this.state.selected.filePath){
                selectFirst();
                return false;
            }
            /** If we have an actual line go to previous or filePath */
            if (this.state.selected.line !== -1){
                const relevantResults = this.state.farmResultByFilePath[this.state.selected.filePath];
                const indexInResults
                    = relevantResults
                        .map(x=>x.line)
                        .indexOf(this.state.selected.line);
                if (indexInResults === 0){
                    this.setSelected(this.state.selected.filePath, -1)
                }
                else {
                    this.setSelected(this.state.selected.filePath, relevantResults[indexInResults - 1].line);
                }
            }
            /** Else go to the previous filePath (if any)
                (collapsed) the filePath
                (expanded) last child
             */
            else {
                let filePaths = Object.keys(this.state.farmResultByFilePath);
                let filePathIndex = filePaths.indexOf(this.state.selected.filePath);
                if (filePathIndex === 0) return false;
                let previousFilePath = filePaths[filePathIndex - 1];
                if (this.state.collapsedState[previousFilePath]){
                    this.setSelected(previousFilePath, -1);
                }
                else {
                    let results = this.state.farmResultByFilePath[previousFilePath];
                    this.setSelected(previousFilePath, results[results.length - 1].line);
                }
            }
            return false;
        });
        handlers.bind('down',()=>{
            if (!this.state.results || !this.state.results.length) return false;
            if (!this.state.selected.filePath) {
                selectFirst();
                return false;
            }
            /** If we are on a filePath
                (collaped) go to next filePath if any
                (expanded) go to first child */
            if (this.state.selected.line === -1) {
                if (this.state.collapsedState[this.state.selected.filePath]){
                    let filePaths = Object.keys(this.state.farmResultByFilePath);
                    let filePathIndex = filePaths.indexOf(this.state.selected.filePath);
                    if (filePathIndex === filePaths.length - 1) return false;
                    let nextFilePath = filePaths[filePathIndex + 1];
                    this.setSelected(nextFilePath, -1);
                }
                else {
                    let results = this.state.farmResultByFilePath[this.state.selected.filePath];
                    this.setSelected(results[0].filePath, results[0].line);
                }
            }
            /** Else if last in the group go to next filePath if any, otherwise goto next sibling */
            else {
                let results = this.state.farmResultByFilePath[this.state.selected.filePath];
                let indexIntoResults = results.map(x => x.line).indexOf(this.state.selected.line);
                if (indexIntoResults === results.length - 1) {
                    // Goto next filePath if any
                    let filePaths = Object.keys(this.state.farmResultByFilePath);
                    let filePathIndex = filePaths.indexOf(this.state.selected.filePath);
                    if (filePathIndex === filePaths.length - 1) return false;
                    let nextFilePath = filePaths[filePathIndex + 1];
                    this.setSelected(nextFilePath, -1);
                }
                else {
                    let nextResult = results[indexIntoResults + 1];
                    this.setSelected(nextResult.filePath, nextResult.line);
                }
            }
            return false;
        });
        handlers.bind('left', () => {
            /** Just select and collapse the folder irrespective of our current state */
            if (!this.state.results || !this.state.results.length) return false;
            if (!this.state.selected.filePath) return false;
            this.state.collapsedState[this.state.selected.filePath] = true;
            this.setState({collapsedState: this.state.collapsedState});
            this.setSelected(this.state.selected.filePath, -1);
            return false;
        });
        handlers.bind('right', () => {
            /** Expand only if a filePath root is currently selected  */
            if (!this.state.results || !this.state.results.length) return false;
            this.state.collapsedState[this.state.selected.filePath] = false;
            this.setState({collapsedState: this.state.collapsedState});
            return false;
        });
        handlers.bind('enter',()=>{
            /** Enter always takes you into the filePath */
            if (!this.state.results || !this.state.results.length) return false;
            if (!this.state.selected.filePath) {
                selectFirst();
            }
            this.openSearchResult(this.state.selected.filePath, this.state.selected.line);
            return false;
        });
    }

    refs: {
        [string: string]: any;
        results: HTMLDivElement;

        find: JSX.Element;
        replace: JSX.Element;
        regex: { refs: { input: JSX.Element } };
        caseInsensitive: { refs: { input: JSX.Element } };
        fullWord: { refs: { input: JSX.Element } };
    }
    findInput = (): HTMLInputElement => ReactDOM.findDOMNode(this.refs.find);
    replaceInput = (): HTMLInputElement => ReactDOM.findDOMNode(this.refs.replace);
    regexInput = (): HTMLInputElement => ReactDOM.findDOMNode(this.refs.regex.refs.input);
    caseInsensitiveInput = (): HTMLInputElement => ReactDOM.findDOMNode(this.refs.caseInsensitive.refs.input);
    fullWordInput = (): HTMLInputElement => ReactDOM.findDOMNode(this.refs.fullWord.refs.input);

    replaceWith = () => this.replaceInput().value;

    render() {
        let hasResults = !!Object.keys(this.state.farmResultByFilePath).length;

        return (
            <div
                style={csx.extend(csx.vertical, csx.flex, styles.noFocusOutline) }>
                <div ref="results" tabIndex={0} style={ResultsStyles.root}>
                    {
                        hasResults
                            ? this.renderSearchResults()
                            : <div style={ResultsStyles.header}>No Search</div>
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
                            <label style={[csx.horizontal, csx.center]}>
                                <ui.Toggle
                                    tabIndex={3}
                                    ref="regex"
                                    onChange={this.handleRegexChange}/>
                                <span style={searchOptionsLabelStyle}>
                                    .*
                                </span>
                            </label>
                            <label style={[csx.horizontal, csx.center]}>
                                <ui.Toggle
                                    tabIndex={4}
                                    ref="caseInsensitive"
                                    onChange={this.handleCaseSensitiveChange}/>
                                <span style={searchOptionsLabelStyle}>
                                    Aa
                                </span>
                            </label>
                            <label style={[csx.horizontal, csx.center]}>
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

    renderSearchResults(){
        let filePaths = Object.keys(this.state.farmResultByFilePath);

        return (
            <div style={csx.extend(csx.flex, styles.errorsPanel.main, {userSelect:'none'}) }>
                <div style={ResultsStyles.header}>Total Results ({this.state.results.length})</div>
                {
                    filePaths.map((filePath,i)=>{
                            let results = this.state.farmResultByFilePath[filePath];
                            let selectedStyle = filePath === this.state.selected.filePath && this.state.selected.line === -1
                                ? ResultsStyles.selected
                                : {};

                            return (
                                <div key={i} onClick={()=>this.toggleFilePathExpansion(filePath)}>
                                    <div
                                        ref={filePath + ':' + -1}
                                        tabIndex={0}
                                        style={
                                            csx.extend(
                                                selectedStyle,
                                                styles.errorsPanel.filePath,
                                                {
                                                    margin:'8px 0px',
                                                    padding: '3px' ,
                                                    ':focus': {
                                                        outline: 'none',
                                                    }
                                                }
                                            )
                                        }>
                                        {this.state.collapsedState[filePath] ? "+" : "-" } {filePath} ({results.length})
                                    </div>
                                    {this.state.collapsedState[filePath] ? <noscript/> : this.renderResultsForFilePath(results) }
                                </div>
                            );
                        })
                }
            </div>
        );
    }

    renderResultsForFilePath(results:Types.FarmResultDetails[]){
        return results.map((result,i)=>{
            let selectedStyle = result.filePath === this.state.selected.filePath && result.line === this.state.selected.line
                ? ResultsStyles.selected
                : {};

            return (
                <div
                    key={i}
                    ref={result.filePath + ':' + result.line}
                    tabIndex={0}
                    style={
                        csx.extend(
                            styles.padded1,
                            {
                                cursor: 'pointer',
                                whiteSpace: 'pre',
                                ':focus': {
                                    outline: 'none',
                                }
                            },
                            selectedStyle
                        )
                    }
                    onClick={(e) => {e.stopPropagation(); this.openSearchResult(result.filePath, result.line)} }>
                    {utils.padLeft((result.line + 1).toString(),6)} : <span style={ResultsStyles.preview}>{result.preview}</span>
                </div>
            );
        })
    }

    toggleFilePathExpansion(filePath: string) {
        this.state.collapsedState[filePath] = !this.state.collapsedState[filePath];
        this.setState({collapsedState: this.state.collapsedState, selected:{filePath,line:-1}});
    }

    /**
     * Scrolling through results
     */
    resultRef(filePath: string, line: number) {
        const ref = filePath + ':' + line;
        return this.refs[ref] as HTMLDivElement;
    }

    /**
     * Input Change handlers
     */
    fullWordKeyDownHandler = (e: React.SyntheticEvent) => {
        let {tab, shift, enter} = ui.getKeyStates(e);

        if (tab && !shift) {
            this.findInput().focus();
            e.preventDefault();
            return;
        }
    };
    findKeyDownHandler = (e: React.SyntheticEvent) => {
        let {tab, shift, enter, mod} = ui.getKeyStates(e);

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
    replaceKeyDownHandler = (e: React.SyntheticEvent) => {
        let {tab, shift, enter, mod} = ui.getKeyStates(e);

        /**
         * Handling commit
         */
        if (!this.state.findQuery) {
            return;
        }
        if (mod && enter) {
            commands.replaceAll.emit({ newText: this.replaceWith() });
            return;
        }
        if (shift && enter) {
            commands.replacePrevious.emit({ newText: this.replaceWith() });
            return;
        }
        if (enter) {
            commands.replaceNext.emit({ newText: this.replaceWith() });
            return;
        }
    };
    findChanged = () => {
        let val = this.findInput().value.trim();
        this.setState({ findQuery: val });
    };
    handleRegexChange = (e) => {
        let val: boolean = e.target.checked;
        this.setState({ isRegex: val });
    }
    handleCaseSensitiveChange = (e) => {
        let val: boolean = e.target.checked;
        this.setState({ isCaseSensitive: val });
    }
    handleFullWordChange = (e) => {
        let val: boolean = e.target.checked;
        this.setState({ isFullWord: val });
    }

    /** Sends the search query */
    startSearch() {
        server.startFarming({
            query: this.state.findQuery,
            isRegex: this.state.isRegex,
            isFullWord: this.state.isFullWord,
            isCaseSensitive: this.state.isCaseSensitive,
            globs: []
        });

        this.setState({
            collapsedState:{},
            selected:{},
        });
    }

    /** Parses results as they come and puts them into the state */
    parseResults(response:Types.FarmNotification){
        // Convert as needed
        let results = response.results;
        let loaded: Types.FarmResultsByFilePath
            = utils.createMapByKey(results, result => result.filePath);

        // Finally rerender
        this.setState({
            results: results,
            completed:response.completed,
            farmResultByFilePath:loaded
        });
    }

    openSearchResult(filePath: string, line: number) {
        commands.doOpenOrFocusFile.emit({ filePath, position: { line: line - 1, ch: 0 } });
        this.setSelected(filePath,line);
    }

    setSelected = (filePath: string, line: number) => {
        this.setState({ selected: { filePath, line } });
        this.focusFilePath(filePath, line);
    }

    focusFilePath = (filePath: string, line: number) => {
        this.resultRef(filePath, line).scrollIntoViewIfNeeded(false);
    };

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
