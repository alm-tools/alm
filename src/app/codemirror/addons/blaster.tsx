/**
 * Based on https://github.com/chinchang/code-blast-codemirror
 */
/*
Based on Joel Besada's lovely experiment
https://twitter.com/JoelBesada/status/670343885655293952
 */

import CodeMirror = require('codemirror');
import ui = require('../../ui');
import * as React from "react";
import onresize = require('onresize');
import * as utils from "../../../common/utils";
type Editor = CodeMirror.EditorFromTextArea;

interface Props {
    cm: Editor;
}

enum Effect {
    Add = 1,
    Delete = 2,
}

export class Blaster extends ui.BaseComponent<Props, any>{

    canvas = (): HTMLCanvasElement => this.refs['canvas'] as any;
    render() {
        let style = this.props.cm ? {} : { display: 'none' };

        return <canvas style={style} ref="canvas" />
    }

    componentWillReceiveProps(props: Props) {
        if (!this.props.cm && props.cm) {
            props.cm.on('change', this.handleChange);
            this.initCanvas(props.cm);
            this.loop();
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.cm.off('change', this.handleChange);
    }

    ctx: CanvasRenderingContext2D;
    initCanvas = (cm:Editor) => {
        let canvas = this.canvas();
        this.ctx = canvas.getContext('2d');

        canvas.style.position = 'absolute';
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.zIndex = '1';
        canvas.style.pointerEvents = 'none';

        let measureCanvas = () => {
            let parent = this.getParentDomNode();
            this.canvas().width = parent.clientWidth
            this.canvas().height = parent.clientHeight;
        }
        this.disposible.add(onresize.on(measureCanvas));
        cm.refresh = utils.intercepted({context:cm,orig:cm.refresh,intercept:measureCanvas});
        measureCanvas();
    }

    lastTime = 0;
    shakeTime = 0;
    shakeTimeMax = 0;
    shakeIntensity = 5;
    loop = () => {
        // If unmounted stop
        if (this.isUnmounted) return;

        // Setup for next loop
        requestAnimationFrame(this.loop);

        // If not enabled right now try again later
        if (!enabled){
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas().width, this.canvas().height);
        this.drawShake();
        this.drawParticles();
    }

    drawShake(){
        // get the time past the previous frame
        var current_time = new Date().getTime();
        var last_time;
        if (!this.lastTime) last_time = current_time;
        var dt = (current_time - this.lastTime) / 1000;
        this.lastTime = current_time;

        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            var magnitude = (this.shakeTime / this.shakeTimeMax) * this.shakeIntensity;
            var shakeX = random(-magnitude, magnitude);
            var shakeY = random(-magnitude, magnitude);
            this.props.cm.getWrapperElement().style.transform = 'translate(' + shakeX + 'px,' + shakeY + 'px)';
        }
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
        this.ctx.arc(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    throttledShake = utils.throttle((time) => {
        this.shakeTime = this.shakeTimeMax = time;
    }, 100);

    PARTICLE_NUM_RANGE = { min: 5, max: 10 };
    throttledSpawnParticles = utils.throttle((effect: Effect) => {
        let cm = this.props.cm;
        var cursorPos = cm.getDoc().getCursor();

        // Get color from the node
        let posForNode = cm.cursorCoords(cursorPos, 'window');
        var node = document.elementFromPoint(posForNode.left - 5, posForNode.top + 5);
        let color = getRGBComponents(node);

        // Now create the particles
        var numParticles = random(this.PARTICLE_NUM_RANGE.min, this.PARTICLE_NUM_RANGE.max);
        let pos = cm.cursorCoords(cursorPos, 'page');
        for (var i = 0; i < numParticles; i++) {
            this.particles.push(this.createParticle(pos.left, pos.top - 25, color, effect));
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

    handleChange = (doc: any, change: CodeMirror.EditorChange) => {
        if (!enabled){
            return;
        }

        // setup shake
        this.throttledShake(0.3);

        // setup particles
        if (change.text.join('')){
            this.throttledSpawnParticles(Effect.Add);
        }
        else {
            this.throttledSpawnParticles(Effect.Delete);
        }
    };
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

let enabled = false;
import * as commands from "../../commands/commands";
CodeMirror.commands[commands.additionalEditorCommands.toggleBlaster] = (editor: CodeMirror.EditorFromTextArea) => {
    enabled = !enabled;
}
