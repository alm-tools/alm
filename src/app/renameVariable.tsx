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
import {Robocop} from "./components/robocop";
import * as docCache from "./codemirror/mode/docCache";
import {CodeEditor} from "./codemirror/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../common/types";

export interface Props {
    info: Types.GetRenameInfoResponse;
    alreadyOpenFilePaths: string[];
    currentlyClosedFilePaths: string[];
    unmount: () => any;
}
export interface State {
    invalidMessage?: string;
    selectedIndex?: number;
    flattened?: { filePath: string, preview: ts.TextSpan, indexForFilePath: number, totalForFilePath: number }[];
}

let validationErrorStyle = {
    color: 'red',
    fontFamily: 'monospace',
    fontSize: '1.2rem',
    padding: '5px',
}

let summaryStyle = {
    padding: '5px',
    backgroundColor: '#222',
    color: '#CCC',
    fontSize: '.8rem',
}

@ui.Radium
export class RenameVariable extends BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);


        let flattended = utils.selectMany(Object.keys(props.info.locations).map(filePath => {
            let refs = props.info.locations[filePath].slice().reverse();
            return refs.map((preview,i) => {
                return {
                    filePath,
                    preview,
                    indexForFilePath: i + 1,
                    totalForFilePath: refs.length,
                };
            });
        }));

        this.state = {
            selectedIndex: 0,
            flattened: flattended
        };
    }

    componentDidMount() {
        this.disposible.add(commands.esc.on(() => {
            this.props.unmount();
        }));

        setTimeout(() => {
            this.focus();
            let input = (ReactDOM.findDOMNode(this.refs.mainInput) as HTMLInputElement)
            let len = input.value.length;
            input.setSelectionRange(0, len);
        });
    }

    componentDidUpdate() {
        setTimeout(() => {
            let selected = ReactDOM.findDOMNode(this.refs.selectedTabTitle) as HTMLDivElement;
            if (selected) {
                selected.scrollIntoViewIfNeeded(false);
            }
        });
    }

    refs: {
        [string: string]: any;
        mainInput: any;
        selectedTabTitle: any;
    }

    render() {
        let selectedPreview = this.state.flattened[this.state.selectedIndex];

        let filePathsRendered = this.state.flattened.map((item,i)=>{
            let selected = i == this.state.selectedIndex;
            let active = selected ? styles.tabHeaderActive : {};
            let ref = selected && "selectedTabTitle";
            return (
                <div ref={ref} key={item.filePath + i} style={[styles.tabHeader,active,{overflow:'auto'}]} onClick={()=>this.selectAndRefocus(i)}>
                    <div>{utils.getFileName(item.filePath)} ({item.indexForFilePath} of {item.totalForFilePath})</div>
                </div>
            );
        });

        let previewRendered = <CodeEditor
                key={this.state.selectedIndex}
                filePath={selectedPreview.filePath}
                readOnly={"nocursor"}
                preview={selectedPreview.preview}
                />;

        return (
            <Modal
                  isOpen={true}
                  onRequestClose={this.props.unmount}>
                  <div style={[csx.vertical, csx.flex]}>
                      <div style={[csx.horizontal]}>
                          <h4>Rename</h4>
                          <div style={[csx.flex]}></div>
                          <div style={{fontSize:'0.9rem', color:'grey'} as any}>
                            <code style={modal.keyStrokeStyle}>Esc</code> to exit <code style={modal.keyStrokeStyle}>Enter</code> to select
                            {' '}<code style={modal.keyStrokeStyle}>Up / Down</code> to see usages
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

                      <div style={summaryStyle}>
                        {this.state.flattened.length} usages, {this.props.alreadyOpenFilePaths.length} files open,  {this.props.currentlyClosedFilePaths.length} files closed
                      </div>

                      <div style={[csx.horizontal, csx.flex, { overflow: 'hidden' }]}>
                          <div style={{width:'200px', overflow:'auto'} as any}>
                              {filePathsRendered}
                          </div>
                          <div style={[csx.flex, csx.flexRoot, styles.modal.previewContainerStyle]}>
                                {previewRendered}
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
            this.setState({ invalidMessage: 'Press esc to abort rename' });
        }
        else {
            this.setState({ invalidMessage: '' });
        }
    };

    onChangeSelected = (event) => {
        let keyStates = ui.getKeyStates(event);

        if (keyStates.up || keyStates.tabPrevious) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex - 1, min: 0, max: this.state.flattened.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.down || keyStates.tabNext) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex + 1, min: 0, max: this.state.flattened.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.enter) {
            event.preventDefault();
            let newText = (ReactDOM.findDOMNode(this.refs.mainInput) as HTMLInputElement).value.trim();

            let refactorings: RefactoringsByFilePath = {};
            Object.keys(this.props.info.locations).map(filePath => {
                refactorings[filePath] = [];
                let forPath = refactorings[filePath];
                this.props.info.locations[filePath].forEach(loc=>{
                    let refactoring: Refactoring = {
                        filePath: filePath,
                        span: loc,
                        newText
                    }
                    forPath.push(refactoring);
                });
            });

            uix.API.applyRefactorings(refactorings);
            setTimeout(()=>{this.props.unmount()});
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
            let filePaths = Object.keys(res.locations);

            // if there is only a single file path and that is the current and there aren't that many usages
            // we do the rename inline
            if (filePaths.length == 1
                && filePaths[0] == filePath
                && res.locations[filePath].length < 5) {
                selectName(editor, res.locations[filePath]);
            }

            else {
                let {alreadyOpenFilePaths, currentlyClosedFilePaths} = uix.API.getClosedVsOpenFilePaths(filePaths);
                const {node,unmount} = ui.getUnmountableNode();
                ReactDOM.render(<RenameVariable info={res} alreadyOpenFilePaths={alreadyOpenFilePaths} currentlyClosedFilePaths={currentlyClosedFilePaths} unmount={unmount} />, node);
            }
        }
    });
}

/** Based out of tern http://codemirror.net/addon/tern/tern.js selectName */
function selectName(cm: CodeMirror.EditorFromTextArea, locations: ts.TextSpan[]) {
    var ranges = [], cur = 0;
    let doc = cm.getDoc();
    var curPos = doc.getCursor();
    for (var i = 0; i < locations.length; i++) {
        var ref = locations[i];
        let from = doc.posFromIndex(ref.start);
        let to = doc.posFromIndex(ref.start + ref.length);
        ranges.push({ anchor: from, head: to });
        if (CodeMirror.cmpPos(curPos, from) >= 0 && CodeMirror.cmpPos(curPos, to) <= 0)
            cur = ranges.length - 1;
    }
    (cm as any).setSelections(ranges, cur);
}
