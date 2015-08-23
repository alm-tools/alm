/**
 * Convinient export point for all the stuff used by other UI parts
 */

export import React = require("react");
export import Radium = require('radium');
export import csx = require('csx');
import * as theme from "./styles/theme";

// needed for material UI
let injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

let mui = require('material-ui');

// Components
export let {RaisedButton, AppBar, IconButton, MenuItem, LeftNav, Tabs, Tab} = mui;

// http://material-ui.com/#/get-started : 
// Please note that since v0.8.0, you also need to define a theme for components to start working.
let ThemeManager = new mui.Styles.ThemeManager();
ThemeManager.setTheme(theme.DarkTheme);
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