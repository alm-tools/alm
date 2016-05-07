import React = require("react");
var ReactDOM = require('react-dom');
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import * as commands from "./commands/commands";
import {connect} from "react-redux";
import {Icon} from "./icon";
import * as tabRegistry from "./tabs/v2/tabRegistry";
import {tabState,tabStateChanged} from "./tabs/v2/appTabsContainer";

let {inputBlackStyle} = styles.Input;
export let inputCodeStyle = {
    fontFamily: 'monospace',
}
export let searchOptionsLabelStyle = {
    color: 'grey',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor:'pointer',
    paddingLeft: '5px',
    paddingRight: '5px',
}

let labelStyle = {
    color: 'grey',
    padding: '4px'
}

export interface Props {
    // connected using redux
    findQuery?: FindOptions;
    selectedTabIndex?: number;
}
export interface State {
}

@connect((state: state.StoreState): Props => {
    return {
        findQuery: state.findOptions,
        selectedTabIndex: state.selectedTabIndex,
    };
})
@ui.Radium
export class FindAndReplace extends BaseComponent<Props, State>{

    componentDidMount() {
        this.disposible.add(commands.findAndReplace.on(() => {
            state.setFindOptionsIsShown(true);

            /** Find input might not be there if current tab doesn't support search */
            if (!this.findInput()){
                return;
            }
            this.findInput().select();
            this.replaceInput() && this.replaceInput().select();
            this.findInput().focus();
        }));

        this.disposible.add(commands.esc.on(() => {
            state.setFindOptionsIsShown(false);
            this.findInput() && this.findInput().focus();
        }));

        this.disposible.add(tabStateChanged.on(()=>{
            this.forceUpdate()
        }));
    }

    refs: {
        [string: string]: any;
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
    // searchLocation = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);

    render() {
        let shownStyle = this.props.findQuery.isShown ? {} : { display: 'none' };

        /** Detect advanced find needed or not */
        let tab = tabState.getSelectedTab();
        let advancedFind = tab && tabRegistry.getTabConfigByUrl(tab.url).advancedSearch;

        /** For Find and Replace Multi ... completely bail out */
        if (tab && tab.url.startsWith('farm')) {
            return <noscript/>;
        }

        if (!advancedFind){
            return (
                <div style={[csx.horizontal,shownStyle]}>
                    <div style={[csx.flex, csx.vertical]}>
                        <div style={[csx.horizontal, csx.center, styles.padded1]}>
                            <input tabIndex={1} ref="find"
                            	placeholder="Find"
                                style={[inputBlackStyle, inputCodeStyle, csx.flex]}
                                onKeyDown={this.findKeyDownHandler}
                                onChange={this.findChanged} defaultValue={this.props.findQuery.query}/>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={[csx.vertical,shownStyle]}>
                <div style={[csx.horizontal,shownStyle]}>
                    <div style={[csx.flex, csx.vertical]}>
                        <div style={[csx.horizontal, csx.center, styles.padded1]}>
                            <input tabIndex={1} ref="find"
                            	placeholder="Find"
                                style={[inputBlackStyle, inputCodeStyle, csx.flex]}
                                onKeyDown={this.findKeyDownHandler}
                                onChange={this.findChanged} defaultValue={this.props.findQuery.query}/>
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
                    <span style={styles.Tip.keyboardShortCutStyle}>Esc</span> to exit
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>Enter</span> to find/replace next
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>Shift + Enter</span> to find/replace previous
                    {' '}<span style={styles.Tip.keyboardShortCutStyle}>{commands.modName} + Enter</span> to replace all
                </div>
            </div>
        );
    }

    /** Tab key is only called on key down :) */
    findKeyDownHandler = (e:React.SyntheticEvent) => {
        let {tab,shift,enter,mod} = ui.getKeyStates(e);

        if (shift && tab) {
            this.fullWordInput() && this.fullWordInput().focus();
            e.preventDefault();
            return;
        }

        if (!state.getState().findOptions.query){
            return;
        }

        if (mod && enter && !shift) { // Because `shift` is used by jump tab mode
            commands.replaceAll.emit({newText:this.replaceWith()});
            return;
        }

        if (shift && enter) {
            commands.findPrevious.emit({});
            return;
        }

        if (enter) {
            commands.findNext.emit({});
            return;
        }
    };

    replaceKeyDownHandler = (e:React.SyntheticEvent) => {
        let {tab,shift,enter,mod} = ui.getKeyStates(e);

        if (!state.getState().findOptions.query){
            return;
        }

        if (mod && enter) {
            commands.replaceAll.emit({newText:this.replaceWith()});
            return;
        }

        // The cursor.replace function in code mirror focuses the editor *with a delay* :-/
        let focusBackOnReplaceInput = () => setTimeout(()=>this.replaceInput().focus(),50);

        if (shift && enter) {
            commands.replacePrevious.emit({newText:this.replaceWith()});
            focusBackOnReplaceInput();
            return;
        }

        if (enter) {
            commands.replaceNext.emit({newText:this.replaceWith()});
            focusBackOnReplaceInput();
            return;
        }
    };

    fullWordKeyDownHandler = (e:React.SyntheticEvent) => {
        let {tab,shift,enter} = ui.getKeyStates(e);

        if (tab && !shift) {
            this.findInput().focus();
            e.preventDefault();
            return;
        }
    };

    handleSearchKeys(e: React.SyntheticEvent) {

    }

    findChanged = utils.debounce(() => {
        let val = this.findInput().value;
        state.setFindOptionsQuery(val)
    },200);

    handleRegexChange = (e) => {
        let val: boolean = e.target.checked;
        state.setFindOptionsIsRegex(val);
    }
    handleCaseSensitiveChange = (e) => {
        let val: boolean = e.target.checked;
        state.setFindOptionsIsCaseSensitive(val);
    }
    handleFullWordChange = (e) => {
        let val: boolean = e.target.checked;
        state.setFindOptionsIsFullWord(val);
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
        if (nextProps.findQuery.isShown !== this.props.findQuery.isShown) {
            tabState.debouncedResize();
        }
    }
}
