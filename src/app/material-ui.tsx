import React = require("react");

// needed for material UI
let injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

let mui = require('material-ui');

// Components
export let {RaisedButton, AppBar, IconButton, MenuItem,LeftNav} = mui;

// http://material-ui.com/#/get-started : 
// Please note that since v0.8.0, you also need to define a theme for components to start working.
let ThemeManager = new mui.Styles.ThemeManager();
function getChildContext() {
    return {
        muiTheme: ThemeManager.getCurrentTheme()
    };
}
let childContextTypes = {
    muiTheme: React.PropTypes.object
};

export class BaseComponent<Props, State> extends React.Component<Props, State>{
    /** Make material-ui happy */
    static childContextTypes = childContextTypes;
    getChildContext = getChildContext;
    
}