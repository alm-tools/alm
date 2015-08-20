import {RootComponent} from "./rootComponent";
import * as React from "react";

// Normalize css 
require('normalize.css');

document.addEventListener('DOMContentLoaded', () => {
    React.render(<RootComponent />, document.getElementById('app'));
});
