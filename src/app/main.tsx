import {Root} from "./root";
import * as React from "react";

// Normalize css 
require('normalize.css');

document.addEventListener('DOMContentLoaded', () => {
    React.render(<Root />, document.getElementById('app'));
});
