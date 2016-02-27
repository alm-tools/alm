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

// Load hint.css for fancy (styleable) titles
require('hint.css/hint.css');

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
    server.getErrors({}).then((errorsUpdate)=>{
        state.setErrorsUpdate(errorsUpdate);
    });
    cast.errorsUpdated.on((errorsByFilePath)=>{
        state.setErrorsUpdate(errorsByFilePath);
    });
    pendingRequestsChanged.on((r)=>{
        state.setPendingRequests(r.pending);
    });
    connectionStatusChanged.on(r=> {
        state.setSocketConnected(r.connected);
    });
    server.activeProjectFilePaths({}).then(res=>{
        state.setFilePathsInActiveProject(res.filePaths);
    });
    cast.activeProjectFilePathsUpdated.on(res=>{
        state.setFilePathsInActiveProject(res.filePaths);
    });
    server.filePaths({}).then((res) => {
        state.setFilePaths({filePaths:res.filePaths,rootDir:res.rootDir, completed: res.completed});
    });
    cast.filePathsUpdated.on((res) => {
        state.setFilePaths({filePaths:res.filePaths,rootDir:res.rootDir, completed: res.completed});
    });
    commands.toggleDoctor.on(()=>{
        if (!state.inActiveProjectFilePath(state.getSelectedFilePath())){
            ui.notifyWarningNormalDisappear('Doctor is only available for files in active project');
            return;
        }
        state.toggleDoctor({});
    });

    commands.duplicateWindow.on(()=>{
        const width = window.innerWidth;
        const height = window.innerHeight;
        window.open(`${window.location.href.replace(location.href,'')}#new-session`, '',`innerWidth=${width}, innerHeight=${height}`);
    });
});
