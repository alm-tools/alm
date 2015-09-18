import {Root} from "./root";
import * as commands from "./commands/commands";
import * as React from "react";
import {server} from "../socket/socketClient";
var Modal = require('react-modal');
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
    React.render(<Root />, appElement);
    
    // Register commands
    commands.register();
    
    // For testing
    // server.echo({text:"123",num:345}).then((res)=>console.log(res));
});
