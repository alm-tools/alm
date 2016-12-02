/**
 * The main dialog
 */
import React = require("react");
var ReactDOM = require("react-dom");
import * as csx from '../base/csx';
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import Modal = require('react-modal');
import * as styles from "../styles/themes/current/base";
import {debounce, createMap, rangeLimited, getFileName} from "../../common/utils";
import {cast, server} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import * as utils from "../../common/utils";
import * as typestyle from "typestyle";

const inputClassName = typestyle.style(styles.modal.inputStyleBase);

/** The singleton dialog instance */
export var inputDialog: InputDialog;

type DataItem = any;

export interface Props {
}
export interface State {
    isOpen?: boolean;
    header?: string;
    hideInput?: boolean;
}
export interface Options {
    header: string;
    onOk: (value:string) => void;
    onEsc: ()=>void;
    filterValue?: string;
    hideInput?: boolean;
}

export class InputDialog extends BaseComponent<Props, State>{
    constructor(props){
        super(props);
        this.state = {};
    }

    private onOk: (value:string) => void = () => null;
    private onEsc: () => void = () => null;

    /**
     * The main public API from the component
     */
    open(options: Options) {
        this.setState({
            isOpen: true,
            header: options.header,
            hideInput: !!options.hideInput
        });
        this.onOk = options.onOk;
        this.onEsc = options.onEsc;

        /** When we come here from another modal the input takes a while to load */
        setTimeout(() => {
            this.refs.mainInput.focus();
            this.refs.mainInput.value = options.filterValue || '';
        });
    }

    refs: {
        [string: string]: any;
        mainInput: HTMLInputElement;
        modal: any;
    }

    componentDidMount() {
        /** setup singleton */
        inputDialog = this;

        commands.esc.on(()=>{
            this.handleClose();
        });
    }

    render() {
        const inputStyle = this.state.hideInput ? { height: '0px', opacity: 0 } : { opacity: 1 };
        return <Modal
            ref="modal"
            isOpen={this.state.isOpen}
            onRequestClose={this.handleClose}
            /** We want the modal to be auto fitting in height for this case */
            style={{
                content:{bottom:'auto'}
            }}>
            <div style={csx.extend(csx.vertical, csx.flex)}>
                <div style={csx.horizontal}>
                    <h4>{this.state.header}</h4>
                    <div style={csx.flex}></div>
                    <div style={{ fontSize: '0.9rem', color: 'grey' } as any}><code style={styles.modal.keyStrokeStyle}>Esc</code> to exit <code style={styles.modal.keyStrokeStyle}>Enter</code> to commit</div>
                </div>

                <div style={csx.extend(styles.padded1TopBottom, csx.vertical)}>
                    <input
                        type="text"
                        ref="mainInput"
                        style={inputStyle}
                        className={inputClassName}
                        onChange={this.onChangeFilter}
                        onKeyDown={this.onChangeSelected}
                        />
                </div>
            </div>
        </Modal>;
    }

    handleClose = () => {
        this.onEsc();
        this.setState({isOpen:false});
        this.clearHandlers();
    }

    onChangeFilter = debounce((e) => {
        let filterValue = this.refs.mainInput.value;
        // TODO:
    }, 50);
    onChangeSelected = (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            this.onOk(this.refs.mainInput.value);
            this.setState({isOpen:false});
            this.clearHandlers();
        }
    };

    clearHandlers = () => {
        this.onEsc = () => null;
        this.onOk = () => null;
    }
}
