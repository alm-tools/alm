/**
 * The main dialog
 */
import React = require("react");
var ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import Modal = require('react-modal');
import * as styles from "../styles/styles";
import {debounce, createMap, rangeLimited, getFileName} from "../../common/utils";
import {cast, server} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import * as utils from "../../common/utils";

/** The singleton dialog instance */
export var inputDialog: InputDialog;

type DataItem = any;

export interface Props {
}
export interface State {
    isOpen?: boolean;
    header?: string;
}
export interface Options {
    header: string;
    onOk: (value:string) => void;
    filterValue?: string;
}

@ui.Radium
export class InputDialog extends BaseComponent<Props, State>{
    private onOk: (value:string) => void = () => null;

    /**
     * The main public API from the component
     */
    open(options: Options) {
        this.setState({
            isOpen: true,
            header: options.header
        });
        this.onOk = options.onOk;

        this.refs.mainInput.focus();
        this.refs.mainInput.value = options.filterValue || '';
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
        return <Modal
            ref="modal"
            isOpen={this.state.isOpen}
            onRequestClose={this.handleClose}
            /** We want the modal to be auto fitting in height for this case */
            style={{
                content:{bottom:'auto'}
            }as any}
            >
            <div style={[csx.vertical, csx.flex]}>
                <div style={[csx.horizontal]}>
                    <h4>{this.state.header}</h4>
                    <div style={[csx.flex]}></div>
                    <div style={{ fontSize: '0.9rem', color: 'grey' } as any}><code style={styles.modal.keyStrokeStyle}>Esc</code> to exit <code style={styles.modal.keyStrokeStyle}>Enter</code> to commit</div>
                </div>

                <div style={[styles.padded1TopBottom, csx.vertical]}>
                    <input
                        type="text"
                        ref="mainInput"
                        style={styles.modal.inputStyle}
                        onChange={this.onChangeFilter}
                        onKeyDown={this.onChangeSelected}
                        />
                </div>
            </div>
        </Modal>;
    }

    handleClose = () => {
        this.setState({isOpen:false});
    }

    onChangeFilter = debounce((e) => {
        let filterValue = this.refs.mainInput.value;
        // TODO:
    }, 50);
    onChangeSelected = (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            this.onOk(this.refs.mainInput.value);
            this.handleClose();
        }
    };
}
