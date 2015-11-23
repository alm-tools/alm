/**
 * The main entry point for the front end
 */
import {Root} from "./root";
import * as commands from "./commands/commands";
import * as React from "react";
var ReactDOM = require("react-dom");
import { Provider } from 'react-redux';
import * as state from "./state/state";
import {store} from "./state/state";
import * as ui from "./ui";

import {server, cast, pendingRequestsChanged, connectionStatusChanged} from "../socket/socketClient";
var Modal = require('react-modal');


// prevent backspace
import {preventBackspaceNav} from "./utils/preventBackspaceNav";
preventBackspaceNav();

// Normalize css
require('normalize.css');

// Load clipboard and enable for all things clipboard
let Clipboard = require('clipboard/dist/clipboard.min');
new Clipboard('[data-clipboard-text]');

// Setup font awesome
require('font-awesome/css/font-awesome.css');

// Setup ntypescript
require('ntypescript');

document.addEventListener('DOMContentLoaded', () => {
    // The main app element
    var appElement = document.getElementById('app');

    // Register a modal location
    Modal.setAppElement(appElement);

    // Render the main app
    ReactDOM.render(<Provider store={store}><Root /></Provider>, appElement);

    // Register commands
    commands.register();

    // For testing
    // server.echo({text:"123",num:345}).then((res)=>console.log(res));

    // Anything that should mutate the state
    server.getErrors({}).then((errorsByFilePath)=>{
        state.setErrorsByFilePath(errorsByFilePath);
    });
    cast.errorsUpdated.on((errorsByFilePath)=>{
        state.setErrorsByFilePath(errorsByFilePath);
    });
    pendingRequestsChanged.on((r)=>{
        state.setPendingRequests(r.pending);
    });
    connectionStatusChanged.on(r=> {
        state.setSocketConnected(r.connected);
    });
    server.filePaths({}).then((res) => {
        res.completed
            ?state.setCompleteFilePaths(res.filePaths)
            :state.setPartialFilePaths(res.filePaths);
    });
    cast.filePathsCompleted.on((update) => {
        state.setCompleteFilePaths(update.filePaths);
    });
    cast.filePathsPartial.on((update) => {
        state.setPartialFilePaths(update.filePaths);
    });
    commands.toggleDoctor.on(()=>{
        if (!state.inActiveProject(state.getSelectedFilePath())){
            ui.notifyWarningNormalDisappear('Doctor is only available for files in active project');
            return;
        }
        state.toggleDoctor({});
    });
});
