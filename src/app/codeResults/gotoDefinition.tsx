import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as styles from "../styles/styles";
import * as state from "../state/state";
import * as uix from "../uix";
import * as commands from "../commands/commands";
import CodeMirror = require('codemirror');
import Modal = require('react-modal');
import {server} from "../../socket/socketClient";
import {Types} from "../../socket/socketContract";
import {modal} from "../styles/styles";
import {Robocop} from "../components/robocop";
import * as docCache from "../codemirror/mode/docCache";
import {CodeEditor} from "../codemirror/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../../common/types";

export interface Props {
    data: Types.GetDefinitionsAtPositionResponse;
    unmount: () => any;
}
export interface State {
    selectedIndex?: number;
}


@ui.Radium
export class GotoDefinition extends BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedIndex: 0,
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
        selectedTabTitle: any;
        mainInput: any;
    }

    render() {
        let definitions = this.props.data.definitions;
        let selectedPreview = this.props.data.definitions[this.state.selectedIndex];

        let filePathsRendered = definitions.map((item,i)=>{
            let selected = i == this.state.selectedIndex;
            let active = selected ? styles.tabHeaderActive : {};
            let ref = selected && "selectedTabTitle";
            return (
                <div ref={ref} key={item.filePath + i} style={[styles.tabHeader,active,{overflow:'hidden'}]} onClick={()=>this.selectAndRefocus(i)}>
                    <div title={item.filePath} style={{overflow:'hidden',textOverflow:'ellipsis'}}>{utils.getFileName(item.filePath)} (line: {item.position.line + 1})</div>
                </div>
            );
        });

        let previewRendered = <CodeEditor
                key={this.state.selectedIndex}
                filePath={selectedPreview.filePath}
                readOnly={"nocursor"}
                preview={selectedPreview.span}
                />;

        return (
            <Modal
                  isOpen={true}
                  onRequestClose={this.props.unmount}>
                  <div style={[csx.vertical, csx.flex]}>
                      <div style={[csx.horizontal, csx.content]}>
                          <h4>Multiple Definitions Found</h4>
                          <div style={[csx.flex]}></div>
                          <div style={{fontSize:'0.9rem', color:'grey'} as any}>
                            <code style={modal.keyStrokeStyle}>Esc</code> to exit <code style={modal.keyStrokeStyle}>Enter</code> to select
                            {' '}<code style={modal.keyStrokeStyle}>Up / Down</code> to see usages
                          </div>
                      </div>

                      <input
                          defaultValue={''}
                          style={styles.hiddenInput}
                          type="text"
                          ref="mainInput"
                          placeholder="Filter"
                          onKeyDown={this.onChangeSelected}
                          />

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

    onChangeSelected = (event) => {
        let keyStates = ui.getKeyStates(event);

        if (keyStates.up || keyStates.tabPrevious) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex - 1, min: 0, max: this.props.data.definitions.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.down || keyStates.tabNext) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex + 1, min: 0, max: this.props.data.definitions.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.enter) {
            event.preventDefault();
            let newText = (ReactDOM.findDOMNode(this.refs.mainInput) as HTMLInputElement).value.trim();

            let def = this.props.data.definitions[this.state.selectedIndex];
            commands.doOpenOrFocusFile.emit({
                filePath: def.filePath,
                position: def.position
            });

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
CodeMirror.commands[commands.additionalEditorCommands.gotoDefinition] = (editor: CodeMirror.EditorFromTextArea) => {
    let cursor = editor.getDoc().getCursor();
    let filePath = editor.filePath;
    let position = editor.getDoc().indexFromPos(cursor);
    server.getDefinitionsAtPosition({filePath,position}).then((res)=>{
        if (res.definitions.length == 0){
            ui.notifyInfoNormalDisappear('No TypeScript definition at cursor location');
        }
        else if (res.definitions.length == 1) {
            // Go directly 🌹
            let def = res.definitions[0];
            commands.doOpenOrFocusFile.emit({
                filePath: def.filePath,
                position: def.position
            });
        }
        else {
            const {node,unmount} = ui.getUnmountableNode();
            ReactDOM.render(<GotoDefinition data={res} unmount={unmount}/>, node);
        }
    });
}
