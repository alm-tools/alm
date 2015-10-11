/**
 * The main entry point for the front end
 */
import {Root} from "./root";
import * as commands from "./commands/commands";
import * as React from "react";
import { Provider } from 'react-redux';
import {store} from "../state/state";

import {server} from "../socket/socketClient";
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
    Modal.injectCSS();

    // Render the main app
    React.render(<Provider store={store}>{() => <Root />}</Provider>, appElement);

    // Register commands
    commands.register();

    // For testing
    // server.echo({text:"123",num:345}).then((res)=>console.log(res));
});
