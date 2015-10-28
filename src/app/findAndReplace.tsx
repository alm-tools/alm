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


export interface Props extends React.Props<any> {
    // connected using redux
    findQuery?: FindQuery;
}
export interface State {
}


let labelStyle = {
    color: 'grey',
    padding: '4px'
}
let inputBlackStyle = {
    backgroundColor: '#333',
    color: 'white',
    outline: 'none',
    padding: '2px',
    border: '2px solid #3C3C3C',
    transition: 'border .2s',
    ':focus':{
        border: '2px solid #0090E0',
        boxShadow: '0px 0px 1px 1px #0090E0'
    }
}
let tipMessageStyle = {
    color: 'grey',
    lineHeight: '1.5rem'
}
var keyboardShortCutStyle = {
    border: '2px solid',
    borderRadius: '6px',
    padding: '2px',
    fontSize: '.7rem',
    backgroundColor: 'black',
}
let searchOptionsLabelStyle = {
    color: 'grey',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor:'pointer',
    paddingLeft: '5px',
    paddingRight: '5px',
}

@connect((state: state.StoreState): Props => {
    return {
        findQuery: state.findQuery
    };
})
@ui.Radium
export class FindAndReplace extends BaseComponent<Props, State>{

    componentDidMount() {
        this.disposible.add(commands.findAndReplace.on(() => {
            state.setFindQueryIsShown(true);
            this.findInput().focus();
        }));

        this.disposible.add(commands.esc.on(() => {
            state.setFindQueryIsShown(false);
            this.findInput().focus();
        }));
    }

    refs: {
        [string: string]: any;
        find: JSX.Element;
        replace: JSX.Element;
    }
    findInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);
    replaceInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.replace);
    // searchLocation = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);

    render() {
        if (!this.props.findQuery.isShown) {
            return <span></span>;
        }

        return (
            <div style={csx.vertical}>
                <div style={[csx.horizontal, csx.center, styles.padded1]}>
                    <input ref="find" placeholder="Find" style={[inputBlackStyle, csx.flex]} onKeyDown={this.findKeyDownHandler} onChange={this.findChanged}/>
                    <div style={[csx.horizontal, csx.aroundJustified, styles.padded1]}>
                        <label style={[csx.horizontal,csx.center]}><ui.Toggle/><span style={searchOptionsLabelStyle}>.*</span></label>
                        <label style={[csx.horizontal,csx.center]}><ui.Toggle/><span style={searchOptionsLabelStyle}>Aa</span></label>
                        <label style={[csx.horizontal,csx.center]}><ui.Toggle/><span style={searchOptionsLabelStyle}><Icon name="text-width"/></span></label>
                    </div>
                </div>
                <div style={[csx.horizontal, csx.center, styles.padded1]}>
                    <input ref="replace" placeholder="Replace" style={[inputBlackStyle, csx.flex]} onKeyDown={this.replaceKeyDownHandler} />
                </div>
                <div style={[tipMessageStyle,styles.padded1]}>
                    <span style={keyboardShortCutStyle}>Esc</span> to exit
                    {' '}<span style={keyboardShortCutStyle}>Enter</span> in the find field to search, or in the replace field to replace
                    {' '}<span style={keyboardShortCutStyle}>Shift + Enter</span> to do it in the reverse
                    {' '}<span style={keyboardShortCutStyle}>{ui.modName} + Enter</span> to do them all at once
                </div>
            </div>
        );
    }

    /** Utility function for keyboard handling */
    getKeyStates(e:React.SyntheticEvent){
        let event: KeyboardEvent = e as any; // This is a lie .... but a convinient one
        let nativeEvent: KeyboardEvent = e.nativeEvent as any;

        let tab = event.key == 'Tab';
        let shift = nativeEvent.shiftKey;
        let mod = nativeEvent.metaKey || nativeEvent.ctrlKey;
        let enter = event.key == 'Enter';

        return {tab,shift,mod,enter};
    }

    /** Tab key is only called on key down :) */
    findKeyDownHandler = (e:React.SyntheticEvent) => {
        let states = this.getKeyStates(e);

        if (states.tab && states.shift) {
            this.replaceInput().focus();
            e.preventDefault();
        }
    };

    replaceKeyDownHandler = (e:React.SyntheticEvent) => {
        let states = this.getKeyStates(e);

        if (states.tab && !states.shift) {
            this.findInput().focus();
            e.preventDefault();
        }
    };

    findChanged = utils.debounce(() => {
        let val = this.findInput().value;
        state.setFindQueryQuery(val)
    },200);
}
