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
import {server} from "../socket/socketClient";
import {Types} from "../socket/socketContract";
import {modal} from "./styles/styles";
import {Robocop} from "./robocop";
import * as docCache from "./codemirror/mode/docCache";
import {CodeEditor} from "./codemirror/codeEditor";

export interface Props extends React.Props<any> {
    info: Types.GetRenameInfoResponse;
}
export interface State {
    filePaths?: string[];
    invalidMessage?: string;
    selectedIndex?: number;
}

let validationErrorStyle = {
    color: 'red',
    fontFamily: 'monospace',
    fontSize: '1.2rem',
    padding: '5px',
}

@ui.Radium
export class RenameVariable extends BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            filePaths : Object.keys(props.info.locations),
            selectedIndex: 0
        };
    }

    componentDidMount() {
        this.disposible.add(commands.esc.on(() => {
            this.unmount();
        }));

        setTimeout(() => {
            this.focus();
            let input = (ReactDOM.findDOMNode(this.refs.mainInput) as HTMLInputElement)
            let len = input.value.length;
            input.setSelectionRange(0, len);
        });
    }

    refs: {
        [string: string]: any;
        mainInput: any;
    }

    render() {
        let filePaths = this.state.filePaths;
        let selectedFilePath = filePaths[this.state.selectedIndex];

        let filePathsRendered = filePaths.map((filePath,i)=>{
            let active = i == this.state.selectedIndex ? styles.tabHeaderActive : {}
            return (
                <div key={filePath} style={[styles.tabHeader,active,{overflow:'auto'}]} onClick={()=>this.selectAndRefocus(i)}>
                    <div>{utils.getFileName(filePath)} (count: {this.props.info.locations[filePath].length})</div>
                </div>
            );
        });

        let previewsRendered = this.props.info.locations[selectedFilePath].slice().reverse().map(preview=>{
            return <div key={selectedFilePath + preview.start} style={[{height:'21px'}]}>
                <CodeEditor
                filePath={selectedFilePath}
                readOnly={"nocursor"}
                preview={preview}
                />
            </div>
        });

        return (
            <Modal
                  isOpen={true}
                  onRequestClose={this.unmount}>
                  <div style={[csx.vertical, csx.flex]}>
                      <div style={[csx.horizontal]}>
                          <h4>Rename</h4>
                          <div style={[csx.flex]}></div>
                          <div style={{fontSize:'0.9rem', color:'grey'} as any}>
                            <code style={modal.keyStrokeStyle}>Esc</code> to exit <code style={modal.keyStrokeStyle}>Enter</code> to select
                            {' '}<code style={modal.keyStrokeStyle}>Tab / Shift Tab</code> to see usages
                          </div>
                      </div>

                      <div style={[styles.padded1TopBottom, csx.vertical]}>
                          <input
                              defaultValue={this.props.info.displayName}
                              style={styles.modal.inputStyle}
                              type="text"
                              ref="mainInput"
                              placeholder="Filter"
                              onChange={this.onChangeFilter}
                              onKeyDown={this.onChangeSelected}
                              />
                      </div>

                      {
                          this.state.invalidMessage &&
                          <div style={validationErrorStyle}>{this.state.invalidMessage}</div>
                      }

                      <div style={[csx.horizontal, csx.flex, { overflow: 'hidden' }]}>
                          <div style={{width:'200px'} as any}>
                            {filePathsRendered}
                          </div>
                          <div style={[csx.flex]}>
                                {previewsRendered}
                          </div>
                      </div>
                  </div>
            </Modal>
        );
    }

    onChangeFilter = (e) => {
        let newText = (ReactDOM.findDOMNode(this.refs.mainInput) as HTMLInputElement).value;

        if (newText.replace(/\s/g, '') !== newText.trim()) {
            this.setState({ invalidMessage: 'The new variable must not contain a space' });
        }
        else if (!newText.trim()) {
            this.setState({ invalidMessage: 'Press esc to abort or continue typing' });
        }
        else {
            this.setState({ invalidMessage: '' });
        }
    };

    onChangeSelected = (event) => {
        let keyStates = ui.getKeyStates(event);

        if (keyStates.up || keyStates.tabPrevious) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex - 1, min: 0, max: this.state.filePaths.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.down || keyStates.tabNext) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex + 1, min: 0, max: this.state.filePaths.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.enter) {
            event.preventDefault();
            // TODO:
        }
    };

    selectAndRefocus = (index: number) => {
        this.setState({selectedIndex:index});
        this.focus();
    };

    focus = () => {
        let input = (ReactDOM.findDOMNode(this.refs.mainInput) as HTMLInputElement)
        input.focus();
    }
}

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.renameVariable] = (editor: CodeMirror.EditorFromTextArea) => {
    let cursor = editor.getDoc().getCursor();
    let filePath = editor.filePath;
    let position = editor.getDoc().indexFromPos(cursor);
    server.getRenameInfo({filePath,position}).then((res)=>{
        if (!res.canRename){
            ui.notifyInfoNormalDisappear("Rename not available at cursor location");
        }
        else {
            let node = document.createElement('div');
            ReactDOM.render(<RenameVariable info={res}/>, node);
        }
    });
}
