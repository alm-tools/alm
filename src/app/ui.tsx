/**
 * Convinient base component and ui utilities
 */
export import React = require("react");
export import ReactDOM = require("react-dom");
import * as csx from './base/csx';
import {CompositeDisposible} from "../common/events";
export import $ = require("jquery");

/** The base component that provides an easy access point for overall app behaviour changes */
export class BaseComponent<Props, State> extends React.Component<Props, State>{
    disposible = new CompositeDisposible();
    isUnmounted: boolean = false;
    componentWillUnmount() {
        this.disposible.dispose();
        this.isUnmounted = true;
    }

    // Making it easier to deal with refs
    ref(name: string): HTMLElement {
        return this.refs[name] as any;
    }

    private _afterComponentDidUpdateQueue = [];
    /**
     * Register stuff to call after component did update
     * Note: For redux-connected component,
     * - call this *before* calling state action
     *   (as its a bit undeterministic and sometimes runs render / didUpdate immediately after calling action)
     */
    afterComponentDidUpdate(cb: () => void): void {
        this._afterComponentDidUpdateQueue.push(cb);
    }
    /**
     * You generally want afterComponentDidUpdate.
     */
    componentDidUpdate() {
        this._afterComponentDidUpdateQueue.forEach(cb => cb());
        this._afterComponentDidUpdateQueue = [];
    }

    getParentDomNode = () => {
        let node = ReactDOM.findDOMNode(this);
        return node.parentElement;
    }
}

/**
 * Certain components control when they unmount themselves
 * e.g. Modals
 * This gives a convinient point for this logic
 */
export function getUnmountableNode() {
    let node = document.createElement('div');
    const unmount = () => {
        ReactDOM.unmountComponentAtNode(node);
        node.remove();
    }
    return { node, unmount };
}

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
export function notifyInfoQuickDisappear(message: string) {
    toastr.info(message, null, { timeOut: 600 });
}
export function notifyInfoNormalDisappear(message: string,  options?: { onClick: () => void }) {
    toastr.info(message, null, options && { onclick: options.onClick });
}
export function notifyWarningNormalDisappear(message: string, options?: { onClick: () => void }) {
    toastr.warning(message, null, options && { onclick: options.onClick });
}
export function notifySuccessNormalDisappear(message: string,  options?: { onClick: () => void }) {
    toastr.success(message, null, options && { onclick: options.onClick });
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
/** Creates whitespace from a 0 based indent */
export function indent(indent: number, tabSize = 4) {
    return Array((indent * tabSize) + 1).join().split('').map(i => "\u00a0");
}

/**
 * General utility for consistent coloring
 */
export function kindToColor(kind: string, lighten = false) {
    let add = lighten ? 50 : 0;
    let opacity = lighten ? 0.2 : 1;
    switch (kind) {
        case ts.ScriptElementKind.keyword:
        case 'snippet':
            // redish
            return `rgba(${0xf9 + add},${0x26 + add},${0x72 + add},${opacity})`;
        case ts.ScriptElementKind.scriptElement:
        case ts.ScriptElementKind.moduleElement:
        case ts.ScriptElementKind.classElement:
        case ts.ScriptElementKind.localClassElement:
        case ts.ScriptElementKind.interfaceElement:
        case ts.ScriptElementKind.typeElement:
        case ts.ScriptElementKind.enumElement:
        case ts.ScriptElementKind.alias:
        case ts.ScriptElementKind.typeParameterElement:
        case ts.ScriptElementKind.primitiveType:
            // yelloish
            // #e6db74
            return `rgba(${0xe6 + add},${0xdb + add},${0x74 + add},${opacity})`;
        case ts.ScriptElementKind.variableElement:
        case ts.ScriptElementKind.localVariableElement:
        case ts.ScriptElementKind.memberVariableElement:
        case ts.ScriptElementKind.letElement:
        case ts.ScriptElementKind.constElement:
        case ts.ScriptElementKind.label:
        case ts.ScriptElementKind.parameterElement:
        case ts.ScriptElementKind.indexSignatureElement:
            // blueish
            // #66d9ef
            return `rgba(${0x66 + add},${0xd9 + add},${0xef + add},${opacity})`;
        case ts.ScriptElementKind.functionElement:
        case ts.ScriptElementKind.localFunctionElement:
        case ts.ScriptElementKind.memberFunctionElement:
        case ts.ScriptElementKind.memberGetAccessorElement:
        case ts.ScriptElementKind.memberSetAccessorElement:
        case ts.ScriptElementKind.callSignatureElement:
        case ts.ScriptElementKind.constructorImplementationElement:
        case 'path':
            // greenish
            // #a6e22e
            return `rgba(${0xa6 + add},${0xe2 + add},${0x2e + add},${opacity})`;
        default:
            return `rgba(${0xaa + add},${0xaa + add},${0xaa + add},${opacity})`;
    }
}

/**
 * For consitent icon lookup against kind
 */
import {FAIconName,toFontAwesomeCharCode} from "./utils/fontAwesomeToCharCode";
export function kindToIcon(kind: string):string {
    switch (kind) {
        case 'snippet':
            return toFontAwesomeCharCode(FAIconName.exchange);
        case 'path':
            return toFontAwesomeCharCode(FAIconName.fileText);
        case ts.ScriptElementKind.keyword:
            return toFontAwesomeCharCode(FAIconName.key);
        case ts.ScriptElementKind.classElement:
            return toFontAwesomeCharCode(FAIconName.copyright);
        case ts.ScriptElementKind.interfaceElement:
            return toFontAwesomeCharCode(FAIconName.infoCircle);
        case ts.ScriptElementKind.scriptElement:
        case ts.ScriptElementKind.moduleElement:
        case ts.ScriptElementKind.localClassElement:
        case ts.ScriptElementKind.typeElement:
        case ts.ScriptElementKind.enumElement:
        case ts.ScriptElementKind.alias:
        case ts.ScriptElementKind.typeParameterElement:
        case ts.ScriptElementKind.primitiveType:
            return toFontAwesomeCharCode(FAIconName.archive);
        case ts.ScriptElementKind.variableElement:
        case ts.ScriptElementKind.localVariableElement:
        case ts.ScriptElementKind.memberVariableElement:
        case ts.ScriptElementKind.letElement:
        case ts.ScriptElementKind.constElement:
        case ts.ScriptElementKind.label:
        case ts.ScriptElementKind.parameterElement:
        case ts.ScriptElementKind.indexSignatureElement:
            return toFontAwesomeCharCode(FAIconName.at);
        case ts.ScriptElementKind.functionElement:
        case ts.ScriptElementKind.localFunctionElement:
        case ts.ScriptElementKind.memberFunctionElement:
        case ts.ScriptElementKind.memberGetAccessorElement:
        case ts.ScriptElementKind.memberSetAccessorElement:
        case ts.ScriptElementKind.callSignatureElement:
        case ts.ScriptElementKind.constructorImplementationElement:
            return toFontAwesomeCharCode(FAIconName.circleArrowRight);
        default:
            return toFontAwesomeCharCode(FAIconName.info);
    }
}
