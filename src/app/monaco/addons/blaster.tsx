import {server} from "../../../socket/socketClient";
import * as ui from "../../ui";
import * as React from "react";
import onresize = require('onresize');
import * as utils from "../../../common/utils";
type Editor = monaco.editor.ICommonCodeEditor;



/**
 * General Utilities
 */
enum Effect {
    Add = 1,
    Delete = 2,
}

interface Particle {
    x: number;
    y: number;
    alpha: number;
    color: [string, string, string];
    effect: Effect;

    // Based on effect
    drag?: number;
    wander?: number;
    theta?: number;
    size?: number;
    vx?: number;
    vy?: number;
}

/** Get a random number in the min-max range, inclusive */
function random(min: number, max: number) {
    if (!max) { max = min; min = 0; }
    return min + ~~(Math.random() * (max - min + 1))
}

/** Get the colors of the html node */
function getRGBComponents(node: Element): [string, string, string] {
    if (node) {
        try {
            var color = getComputedStyle(node).color;
            return color.match(/(\d+), (\d+), (\d+)/).slice(1) as any;
        } catch (e) {
            return ['255', '255', '255'];
        }
    } else {
        return ['255', '255', '255'];
    }
}

/**
 * Registering it with monaco
 */

import CommonEditorRegistry = monaco.CommonEditorRegistry;
import EditorActionDescriptor = monaco.EditorActionDescriptor;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import ContextKey = monaco.ContextKey;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;


let enabled = false;
class ToggleBlasterAction extends EditorAction {

    static ID = 'editor.action.toggleBlaster';

    constructor(descriptor: IEditorActionDescriptorData, editor: ICommonCodeEditor) {
        super(descriptor, editor);
    }

    public run(): TPromise<boolean> {
        enabled = !enabled;
        if (enabled) {
            ui.notifySuccessNormalDisappear('Have fun 🌹!');
        }
        else {
            ui.notifyInfoQuickDisappear('Hope you had fun 💖');
        }

        return TPromise.as(true);
    }
}

CommonEditorRegistry.registerEditorAction(new EditorActionDescriptor(ToggleBlasterAction, ToggleBlasterAction.ID, 'Toggle Blaster', {
    context: ContextKey.EditorTextFocus,
    primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_O
}));
