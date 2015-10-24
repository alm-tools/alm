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

import {server, cast} from "../socket/socketClient";
var Modal = require('react-modal');


// prevent backspace
import {preventBackspaceNav} from "./utils/preventBackspaceNav";
preventBackspaceNav();

// Normalize css
require('normalize.css');

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
    })
    cast.errorsUpdated.on((errorsByFilePath)=>{
        state.setErrorsByFilePath(errorsByFilePath);
    });
});
