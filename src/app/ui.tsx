/**
 * Convinient base component and ui utilities
 */
export import React = require("react");
export import Radium = require('radium');
export import csx = require('csx');
import * as theme from "./styles/theme";
import {CompositeDisposible} from "../common/events";
export import $ = require("jquery");
import * as commands from "./commands/commands";

/** The base component that provides an easy access point for overall app behaviour changes */
export class BaseComponent<Props, State> extends React.Component<Props, State>{
    disposible = new CompositeDisposible();
    componentWillUnmount() {
        this.disposible.dispose();
    }
}

// Setup VelocityReact
// Need to load it to get UIPack working
require('velocity-animate');
require('velocity-animate/velocity.ui');
let VelocityReact = require('velocity-react');
export let {VelocityTransitionGroup, VelocityComponent} = VelocityReact;

/**
 * Straight out of codemirror.js
 */
export var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
export var mac = ios || /Mac/.test(navigator.platform);
export var windows = /win/i.test(navigator.platform);
/** Nice display name for the mod by user platform */
export var modName = mac ? '⌘' : 'Ctrl';

/**
 * Toggle component
 * http://instructure-react.github.io/react-toggle/
 */

export let Toggle = require('react-toggle')
require('react-toggle/style.css')

/**
 * Notifications
 */
import toastr = require("toastr");
require('toastr/build/toastr.css');
commands.esc.on(()=>{
    toastr.clear();
});
export function notifyInfoQuickDisappear(message: string) {
    toastr.info(message, null, { timeOut: 600 });
}
export function notifyInfoNormalDisappear(message: string) {
    toastr.info(message);
}
export function notifyWarningNormalDisappear(message: string, options?:{onClick:()=>void}) {
    toastr.warning(message, null, options && { onclick: options.onClick });
}
export function notifySuccessNormalDisappear(message: string){
    toastr.success(message);
}
export function comingSoon(featureName: string) {
    toastr.info(`Coming soon! : ${featureName}`);
}


/**
 * Keyboard handling
 */
 /** Utility function for keyboard handling */
export function getKeyStates(e: React.SyntheticEvent) {
    let event: KeyboardEvent = e as any; // This is a lie .... but a convinient one as react provides the same stuff
    let nativeEvent: KeyboardEvent = e.nativeEvent as any; // This is the truth

    let tab = event.key == 'Tab';
    let shift = nativeEvent.shiftKey;
    let mod = nativeEvent.metaKey || nativeEvent.ctrlKey;
    let enter = event.key == 'Enter';
    let up = event.key == 'ArrowUp';
    let down = event.key == 'ArrowDown';

    let tabNext = tab && !shift;
    let tabPrevious = tab && shift;

    return { tab, tabNext, tabPrevious, up, down, shift, mod, enter };
}

export let {DraggableCore} = require('react-draggable');

/**
 * General react utilities
 */
 /** 0 based length */
 export function indent(indent: number) {
     return Array(indent + 1).join().split('').map(i => "\u00a0\u00a0\u00a0\u00a0");
 }
