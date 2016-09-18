import {server} from "../../../socket/socketClient";
import * as ui from "../../ui";
import onresize = require('onresize');
import * as utils from "../../../common/utils";
import {CompositeDisposible} from "../../../common/events";
type Editor = monaco.editor.ICodeEditor;
type Change = monaco.editor.IModelContentChangedEvent2;

export class Blaster {
    private disposible = new CompositeDisposible();
    private detached = false;
    constructor(private cm: Editor) {
        this.disposible.add(cm.onDidChangeModelContent(this.handleChange));
        this.initCanvas();
        this.loop();
    }
    dispose() {
        this.detached = true;
        this.disposible.dispose();
    }

    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    initCanvas = () => {
        const cm = this.cm;
        this.canvas = document.createElement('canvas');
        cm.getDomNode().parentElement.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.canvas.style.position = 'absolute';
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.bottom = "0";
        this.canvas.style.right = "0";
        this.canvas.style.zIndex = '1';
        this.canvas.style.pointerEvents = 'none';

        let measureCanvas = () => {
            let parent = cm.getDomNode();
            this.canvas.width = parent.clientWidth
            this.canvas.height = parent.clientHeight;
        }
        this.disposible.add(onresize.on(measureCanvas));
        cm.layout = utils.intercepted({ context: cm, orig: cm.layout, intercept: measureCanvas });
        measureCanvas();
    }

    loop = () => {
        // If unmounted stop
        if (this.detached) return;

        // Setup for next loop
        requestAnimationFrame(this.loop);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawParticles();
    }

    particles: Particle[] = [];
    drawParticles = (timeDelta?: number) => {
        // return if no particles
        if (!this.particles.length) return;

        // animate the particles
        for (let particle of this.particles) {
            if (particle.effect === Effect.Add) { this.effect1(particle); }
            else if (particle.effect === Effect.Delete) { this.effect2(particle); }
        }

        // clear out the particles that are no longer relevant post animation
        this.particles = this.particles.filter(particle => particle && particle.alpha > 0.01 && particle.size > 0.5);
    }

    PARTICLE_GRAVITY = 0.08;
    PARTICLE_ALPHA_FADEOUT = 0.96;
    effect1(particle: Particle) {
        particle.vy += this.PARTICLE_GRAVITY;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha *= this.PARTICLE_ALPHA_FADEOUT;

        this.ctx.fillStyle = 'rgba(' + particle.color[0] + ',' + particle.color[1] + ',' + particle.color[2] + ',' + particle.alpha + ')';
        this.ctx.fillRect(Math.round(particle.x - 1), Math.round(particle.y - 1), particle.size, particle.size);
    }

    // Effect based on Soulwire's demo: http://codepen.io/soulwire/pen/foktm
    effect2(particle: Particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= particle.drag;
        particle.vy *= particle.drag;
        particle.theta += random(-0.5, 0.5);
        particle.vx += Math.sin(particle.theta) * 0.1;
        particle.vy += Math.cos(particle.theta) * 0.1;
        particle.size *= 0.96;

        this.ctx.fillStyle = 'rgba(' + particle.color[0] + ',' + particle.color[1] + ',' + particle.color[2] + ',' + particle.alpha + ')';
        this.ctx.beginPath();
        this.ctx.arc(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    // spawn particles
    PARTICLE_NUM_RANGE = { min: 5, max: 10 };
    throttledSpawnParticles = utils.throttle((effect: Effect) => {
        let editor = this.cm;
        var cursorPos = editor.getPosition();

        /** The position relative to dom node of editor */
        let pos = editor.getScrolledVisiblePosition(cursorPos);

        /** Get the color for the dom token */
        const editorNode = editor.getDomNode();
        const editorNodeRect = editorNode.getBoundingClientRect();
        const posForNode = {
            x: editorNodeRect.left + pos.left,
            y: editorNodeRect.top + pos.top,
        }
        const node = document.elementFromPoint(posForNode.x - 5, posForNode.y + 5);
        let color = getRGBComponents(node);

        // Now create the particles
        var numParticles = random(this.PARTICLE_NUM_RANGE.min, this.PARTICLE_NUM_RANGE.max);
        for (var i = 0; i < numParticles; i++) {
            this.particles.push(this.createParticle(pos.left + 15, pos.top - 5, color, effect));
        }
    }, 100);

    PARTICLE_VELOCITY_RANGE = {
        x: [-1, 1],
        y: [-3.5, -1.5]
    }
    createParticle(x: number, y: number, color: [string, string, string], effect: Effect) {
        var p: Particle = {
            x: x,
            y: y + 10,
            alpha: 1,
            color: color,
            effect: effect,

            // modifed below
            drag: 0,
            wander: 0,
            theta: 0,
            size: 0,
            vx: 0,
            vy: 0,
        };
        if (effect == Effect.Add) {
            p.size = random(2, 4);
            p.vx = this.PARTICLE_VELOCITY_RANGE.x[0] + Math.random() *
                (this.PARTICLE_VELOCITY_RANGE.x[1] - this.PARTICLE_VELOCITY_RANGE.x[0]);
            p.vy = this.PARTICLE_VELOCITY_RANGE.y[0] + Math.random() *
                (this.PARTICLE_VELOCITY_RANGE.y[1] - this.PARTICLE_VELOCITY_RANGE.y[0]);
        } else if (effect == Effect.Delete) {
            p.size = random(2, 8);
            p.drag = 0.92;
            p.vx = random(-3, 3);
            p.vy = random(-3, 3);
            p.wander = 0.15;
            p.theta = random(0, 360) * Math.PI / 180;
        }
        return p;
    }

    handleChange = (change: Change) => {
        // setup particles
        if (change.text) {
            this.throttledSpawnParticles(Effect.Add);
        }
        else {
            this.throttledSpawnParticles(Effect.Delete);
        }
    };
}

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
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;
import ServicesAccessor = monaco.ServicesAccessor;
import IActionOptions = monaco.IActionOptions;
import EditorContextKeys = monaco.EditorContextKeys;

class ToggleBlasterAction extends EditorAction {

    constructor() {
        super({
            id: 'editor.action.toggleBlaster',
			label: 'Toggle Blaster',
			alias: 'Toggle Blaster',
			precondition: EditorContextKeys.Writable,
			kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
				primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_O
			}
        });
    }

    public blaster: Blaster | null = null;
    public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        if (!this.blaster) {
            this.blaster = new Blaster(editor as Editor);
            ui.notifySuccessNormalDisappear('Have fun 🌹!');
        }
        else {
            this.blaster.dispose();
            this.blaster = null;
            ui.notifyInfoQuickDisappear('Hope you had fun 💖');
        }
    }
}

CommonEditorRegistry.registerEditorAction(new ToggleBlasterAction());
