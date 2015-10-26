import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import * as utils from "../../common/utils";

export interface Props extends React.Props<any> {

}
export interface State {
    selected: number;
}

var tipStyle = {
    fontSize: '2rem',
    color: '#776666',
    fontWeight: 'bold',
    userSelect: 'none',
    whiteSpace: 'pre',
}

var tipKeyboardStyle = {
    border: '2px solid',
    borderRadius: '6px'
}

interface TipMessage {
    message: string;
    keyboard: string;
}

/**
 * Straight out of codemirror.js
 */
var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
var mac = ios || /Mac/.test(navigator.platform);
var windows = /win/i.test(navigator.platform);

function platformKeyboard(keyboard: string): string {
    if (mac) {
        return keyboard.replace('Ctrl', '⌘');
    }
    return keyboard;
}


@ui.Radium
export class Tips extends BaseComponent<Props, State>{

    constructor(props) {
        super(props);
        ``
        this.state = {
            selected: 0
        };
    }

    tips: TipMessage[] = [
        {
            message: 'Find a file to work with',
            keyboard: platformKeyboard('Ctrl+P')
        },
        {
            message: 'Select the project',
            keyboard: platformKeyboard('Alt+Shift+P')
        }
    ]

    componentDidMount() {
        let next = () => utils.rangeLimited({ num: this.state.selected + 1, min: 0, max: this.tips.length - 1, loopAround: true });

        let loop = setInterval(() => this.setState({ selected: next() }), 2000);
        this.disposible.add({ dispose: () => clearInterval(loop) });
    }
    componentWillUnmount() {
        this.disposible.dispose();
    }

    render() {
        let tip = this.tips[this.state.selected];
        return (
            <div style={[csx.flex, csx.centerCenter, tipStyle]}>
                {tip.message} using <span style={tipKeyboardStyle}> {tip.keyboard} </span>
            </div>
        );
    }
}
