/**
 * Convinient base component and ui utilities
 */
export import React = require("react");
export import Radium = require('radium');
export import csx = require('csx');
import * as theme from "./styles/theme";
import {CompositeDisposible} from "../common/events";
// Setup VelocityReact
// Need to load it to get UIPack working
require('velocity-animate');
require('velocity-animate/velocity.ui');
let VelocityReact = require('velocity-react');
export let {VelocityTransitionGroup} = VelocityReact;


export class BaseComponent<Props, State> extends React.Component<Props, State>{
    disposible = new CompositeDisposible();
    componentWillUnmount() {
        this.disposible.dispose();
    }
}
