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
import CodeMirror = require('codemirror');

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
        // Wire up the code mirror command to come here
        CodeMirror.commands[commands.additionalEditorCommands.renameVariable] = (editor: CodeMirror.EditorFromTextArea) => {
            this.setState({ isShown: true });
        }

        this.disposible.add(commands.esc.on(() => {
            this.setState({ isShown: false });
        }));
    }

    render() {
        let shownStyle = this.state.isShown ? {} : { display: 'none' };

        return (
            <div style={[shownStyle,{color:'white'}]}>
                Rename
            </div>
        );
    }
}

// This can work too
// // Wire up the code mirror command to come here
// CodeMirror.commands[commands.additionalEditorCommands.renameVariable] = (editor: CodeMirror.EditorFromTextArea) => {
//     let cursor = editor.getDoc().getCursor();
//     // TODO: query server
//
//     let node = document.createElement('div');
//     ReactDOM.render(<RenameVariable/>, node);
//     editor.addLineWidget(cursor.line,node);
// }
