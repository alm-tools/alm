import React = require("react");
import ReactDOM = require("react-dom");
import * as csx from '../../base/csx';
import * as ui from "../../ui";
import * as utils from "../../../common/utils";
import * as styles from "../../styles/themes/current/base";
import * as state from "../../state/state";
import * as commands from "../../commands/commands";
import Modal = require('react-modal');
import {server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import {modal} from "../../styles/themes/current/base";
import {Robocop} from "../../components/robocop";
import {CodeEditor} from "../editor/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../../../common/types";

export interface Props {
    data: Types.GetReferencesResponse;
    unmount: () => any;
}
export interface State {
    selectedIndex?: number;
}

export class FindReferences extends ui.BaseComponent<Props, State>{

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
        let references = this.props.data.references;
        let selectedPreview = this.props.data.references[this.state.selectedIndex];

        let filePathsRendered = references.map((item,i)=>{
            let selected = i == this.state.selectedIndex;
            let active = selected ? styles.tabHeaderActive : {};
            let ref = selected && "selectedTabTitle";
            return (
                <div
                    ref={ref} key={item.filePath + i}
                    style={csx.extend(styles.tabHeader,active,{overflow:'hidden'})}
                    onClick={()=>this.selectAndRefocus(i)}
                    onDoubleClick={()=>this.openIndex(i)}>
                    <div title={item.filePath} style={{overflow:'hidden',textOverflow:'ellipsis'}}>{utils.getFileName(item.filePath)} (line: {item.position.line + 1})</div>
                </div>
            );
        });

        let previewRendered = <CodeEditor
                key={selectedPreview.filePath}
                filePath={selectedPreview.filePath}
                readOnly={true}
                preview={selectedPreview.span}
                />;

        return (
            <Modal
                  isOpen={true}
                  onRequestClose={this.props.unmount}>
                  <div style={csx.extend(csx.vertical, csx.flex)}>
                      <div style={csx.extend(csx.horizontal, csx.content)}>
                          <h4>References</h4>
                          <div style={csx.flex}></div>
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

    onChangeSelected = (event) => {
        let keyStates = ui.getKeyStates(event);

        if (keyStates.up || keyStates.tabPrevious) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex - 1, min: 0, max: this.props.data.references.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.down || keyStates.tabNext) {
            event.preventDefault();
            let selectedIndex = utils.rangeLimited({ num: this.state.selectedIndex + 1, min: 0, max: this.props.data.references.length - 1, loopAround: true });
            this.setState({selectedIndex});
        }
        if (keyStates.enter) {
            event.preventDefault();
            this.openIndex(this.state.selectedIndex);
        }
    };

    openIndex = (index: number) => {
        let def = this.props.data.references[index];
        commands.doOpenOrFocusFile.emit({
            filePath: def.filePath,
            position: def.position
        });
        setTimeout(()=>{this.props.unmount()});
    }

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

class FindReferencesAction extends EditorAction {

	constructor() {
        super({
            id: 'editor.action.findReferencesAction',
            label: 'TypeScript: Find references',
            alias: 'TypeScript: Find references',
            precondition: EditorContextKeys.Focus,
            kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
                primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_B
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
        server.getReferences({filePath,position}).then((res)=>{
            if (res.references.length == 0){
                ui.notifyInfoNormalDisappear('No references for item at cursor location');
            }
            else if (res.references.length == 1) {
                // Go directly 🌹
                let def = res.references[0];
                commands.doOpenOrFocusFile.emit({
                    filePath: def.filePath,
                    position: def.position
                });
            }
            else {
                const {node,unmount} = ui.getUnmountableNode();
                ReactDOM.render(<FindReferences data={res} unmount={unmount}/>, node);
            }
        });
	}
}

CommonEditorRegistry.registerEditorAction(new FindReferencesAction());
