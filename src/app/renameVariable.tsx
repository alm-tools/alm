import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import * as uix from "./uix";
import * as commands from "./commands/commands";

export interface Props extends React.Props<any> {

}
export interface State {
    isShown?: boolean;
}

@ui.Radium
export class RenameVariable extends BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            isShown: false
        };
    }

    componentDidMount() {
        commands.rename.on(() => {
            let editor = uix.API.getFocusedCodeEditorIfAny();
            if (editor) {
                console.log(editor); // Debug
                this.setState({ isShown: true });
            }
        });
        this.disposible.add(commands.esc.on(() => {
            this.setState({ isShown: false });
        }));
    }

    render() {
        let shownStyle = this.state.isShown ? {} : { display: 'none' };

        return (
            <div style={shownStyle}>
                Rename
            </div>
        );
    }
}
