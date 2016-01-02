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
export var dialog: Dialog;

type DataItem = any;

export interface Props {
}
export interface State {
    isOpen?: boolean;
    header?: string;
}
export interface Options {
    header: string;
}

@ui.Radium
export class Dialog extends BaseComponent<Props, State>{
    open(options: Options) {
        this.setState({
            isOpen: true,
            header: options.header
        });
    }

    refs: {
        [string: string]: any;
        mainInput: HTMLInputElement;
    }

    componentDidMount() {
        dialog = this;

        commands.esc.on(()=>{
            this.handleClose();
        });
    }

    render() {
        return <Modal
            isOpen={this.state.isOpen}
            onRequestClose={this.handleClose}>
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
                        placeholder="Filter"
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
            // TODO:
        }
    };
}
