import {Root} from "./root";
import * as commands from "./commands/commands";
import * as React from "react";
import {echo} from "./socket/socket";
var Modal = require('react-modal');

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
    
    echo({echo:123,num:345}).then((res)=>console.log(res));
});
