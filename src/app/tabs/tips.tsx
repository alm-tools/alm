import React = require("react");
import * as csx from '../base/csx';
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as styles from "../styles/themes/current/base";
import * as commands from "../commands/commands";

export interface Props {

}
export interface State {
    selected: number;
}

var tipStyle = {
    fontSize: '2rem',
    color: styles.successColor,
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

export class Tips extends BaseComponent<Props, State>{

    constructor(props) {
        super(props);
        this.state = {
            selected: 0
        };
    }

    tips: TipMessage[] = [
        {
            message: 'Find a file to work with',
            keyboard: `${commands.modName}+P`
        },
        {
            message: 'Set active project',
            keyboard: `Alt+Shift+P`
        },
        {
            message: 'Close a tab',
            keyboard: 'Alt+W'
        },
        {
            message: 'Undo close tab',
            keyboard: 'Alt+Shift+W'
        },
        {
            message: 'Editor keybindings:',
            keyboard: 'Sublime Text'
        },
        {
            message: 'Editor focus from anywhere',
            keyboard: 'Escape'
        }
    ]

    componentDidMount() {
        let next = () => utils.rangeLimited({ num: this.state.selected + 1, min: 0, max: this.tips.length - 1, loopAround: true });

        let loop = setInterval(() => this.setState({ selected: next() }), 5000);
        this.disposible.add({ dispose: () => clearInterval(loop) });
    }
    componentWillUnmount() {
        this.disposible.dispose();
    }

    render() {
        let tip = this.tips[this.state.selected];
        {
            /**
             * To use velocity animation group
             *  - The first sub element must change ... hence `key` otherwise react reuses DOM
             *  - The first sub element will be forced to have `display:block`
             *  	(velocity does that for some reason ... so no flexbox ... we use newLayer)
             *  - Restore flexbox using newLayer + some flex root
             */
        }
        return (
            <div key={this.state.selected} style={csx.extend(csx.newLayer)}>

                <span style={csx.extend(csx.newLayer, csx.flexRoot) }>
                    <span style={csx.extend(csx.flex, csx.centerCenter, tipStyle)}>
                        {tip.message}&nbsp;<span style={tipKeyboardStyle}> {tip.keyboard} </span>
                    </span>
                </span>

            </div>
        );
    }
}
