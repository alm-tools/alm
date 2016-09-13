import * as React from "react";
import * as Modal from "react-modal";
import * as ui from "../ui";
import * as csx from "../base/csx";
import {cast, server} from "../../socket/socketClient";

export class ServerExit extends ui.BaseComponent<{}, { isOpen }>{
    constructor(props) {
        super(props)
        this.state = {
            isOpen: false
        };
    }
    componentDidMount() {
        cast.serverExiting.on(() => {
            this.setState({ isOpen: true });
            document.title = "Server Exited 🌹";
        })
    }
    render() {
        return (
            <Modal
                isOpen={this.state.isOpen}
                onRequestClose={this.askUserToClose}>
                <div
                    style={csx.extend(csx.centerCenter, csx.flex, { color: 'white', fontSize: '20px' }) }
                    onClick={this.askUserToClose}>
                    The server has exited. Please close this browser tab.
                </div>
            </Modal>
        );
    }
    askUserToClose = () => ui.notifyInfoQuickDisappear("Please close the browser tab manually")
}
