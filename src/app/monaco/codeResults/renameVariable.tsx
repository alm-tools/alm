import React = require("react");
import ReactDOM = require("react-dom");
import * as csx from '../../base/csx';
import {BaseComponent} from "../../ui";
import * as ui from "../../ui";
import * as utils from "../../../common/utils";
import * as styles from "../../styles/themes/current/base";
import * as state from "../../state/state";
import * as uix from "../../uix";
import * as commands from "../../commands/commands";
import Modal = require('react-modal');
import {server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import {modal} from "../../styles/themes/current/base";
import {Robocop} from "../../components/robocop";
import * as docCache from "../model/docCache";
import {CodeEditor} from "../editor/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../../../common/types";
import * as typestyle from "typestyle";

const inputClassName = typestyle.style(styles.modal.inputStyleBase);

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
    backgroundColor: '#1e1e1e',
    color: '#CCC',
    fontSize: '.8rem',
}

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
                <div
                    ref={ref}
                    key={item.filePath + i}
                    style={csx.extend(styles.tabHeader,active,{overflow:'hidden'})}
                    onClick={()=>this.selectAndRefocus(i)}>
                    <div title={item.filePath} style={{overflow:'hidden',textOverflow:'ellipsis'}}>{utils.getFileName(item.filePath)} ({item.indexForFilePath} of {item.totalForFilePath})</div>
                </div>
            );
        });

        let previewRendered = <CodeEditor
                key={selectedPreview.filePath}
                filePath={selectedPreview.filePath}
                readOnly={true}
                preview={selectedPreview.preview}
                />;

        return (
            <Modal
                  isOpen={true}
                  onRequestClose={this.props.unmount}>
                  <div style={csx.extend(csx.vertical, csx.flex)}>
                      <div style={csx.extend(csx.horizontal, csx.content)}>
                          <h4>Rename</h4>
                          <div style={csx.flex}></div>
                          <div style={{fontSize:'0.9rem', color:'grey'} as any}>
                            <code style={modal.keyStrokeStyle}>Esc</code> to exit <code style={modal.keyStrokeStyle}>Enter</code> to select
                            {' '}<code style={modal.keyStrokeStyle}>Up / Down</code> to see usages
                          </div>
                      </div>

                      <div style={csx.extend(styles.padded1TopBottom, csx.vertical, csx.content)}>
                          <input
                              defaultValue={this.props.info.displayName}
                              className={inputClassName}
                              type="text"
                              ref="mainInput"
                              placeholder="Filter"
                              onChange={this.onChangeFilter}
                              onKeyDown={this.onChangeSelected}
                              />
                      </div>

                      {
                          this.state.invalidMessage &&
                          <div style={csx.extend(csx.content,validationErrorStyle)}>{this.state.invalidMessage}</div>
                      }

                      <div style={csx.extend(csx.content,summaryStyle)}>
                        {this.state.flattened.length} usages, {this.props.alreadyOpenFilePaths.length} files open,  {this.props.currentlyClosedFilePaths.length} files closed
                      </div>

                      <div style={csx.extend(csx.horizontal, csx.flex, { overflow: 'hidden' })}>
                          <div style={{width:'200px', overflow:'auto'} as any}>
                              {filePathsRendered}
                          </div>
                          <div style={csx.extend(csx.flex, csx.flexRoot, styles.modal.previewContainerStyle)}>
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
            this.setState({ invalidMessage: 'Please provide a new name or press esc to abort rename' });
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

import * as monacoUtils from "../monacoUtils";

import CommonEditorRegistry = monaco.CommonEditorRegistry;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;
import ServicesAccessor = monaco.ServicesAccessor;
import IActionOptions = monaco.IActionOptions;
import EditorContextKeys = monaco.EditorContextKeys;

class RenameVariableAction extends EditorAction {

	constructor() {
        super({
            id: 'editor.action.renameVariable',
			label: 'TypeScript: Rename Variable',
			alias: 'TypeScript: Rename Variable',
			precondition: EditorContextKeys.Writable,
			kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
				primary: KeyCode.F2
			}
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        const filePath = editor.filePath;

        if (!state.inActiveProjectFilePath(filePath)) {
            ui.notifyInfoNormalDisappear('The current file is no in the active project');
            return;
        }

        let position = monacoUtils.getCurrentPosition(editor);

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
}

CommonEditorRegistry.registerEditorAction(new RenameVariableAction());

/** Selects the locations keeping the current one as the first (to allow easy escape back to current cursor) */
function selectName(editor: monaco.ICommonCodeEditor, locations: ts.TextSpan[]) {
    const ranges: monaco.ISelection[] = [];
    const curPos = editor.getSelection();

    for (var i = 0; i < locations.length; i++) {
        var ref = locations[i];

        let from = editor.getModel().getPositionAt(ref.start);
        let to = editor.getModel().getPositionAt(ref.start + ref.length);
        const range = new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column);
        const selection: monaco.ISelection = {
            selectionStartLineNumber: from.lineNumber,
            selectionStartColumn: from.column,
            positionLineNumber: to.lineNumber,
            positionColumn: to.column
        }

        if (!monaco.Range.containsRange(range, curPos))
            ranges.push(selection);
        else
            ranges.unshift(selection);
    }
    editor.setSelections(ranges);
}
