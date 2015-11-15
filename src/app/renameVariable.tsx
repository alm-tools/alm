import React = require("react");
import ReactDOM = require("react-dom");
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
import Modal = require('react-modal');

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
        };
    }

    componentDidMount() {
        this.disposible.add(commands.esc.on(() => {
            this.unmount();
        }));
    }

    render() {
        return (
            <Modal
                  isOpen={true}
                  onRequestClose={this.unmount}>
                <div>
                    Rename
                </div>
            </Modal>
        );
    }
}

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.renameVariable] = (editor: CodeMirror.EditorFromTextArea) => {
    let cursor = editor.getDoc().getCursor();
    // TODO: query server

    let node = document.createElement('div');
    ReactDOM.render(<RenameVariable/>, node);
}
