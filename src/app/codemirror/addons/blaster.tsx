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
type Editor = CodeMirror.EditorFromTextArea;

interface Props {
    cm: Editor;
}

export class Blaster extends ui.BaseComponent<Props, any>{

    canvas = (): HTMLCanvasElement => this.refs['canvas'] as any;
    render() {
        let style = this.props.cm ? {} : { display: 'none' };

        return <canvas style={style} ref="canvas" />
    }

    componentWillReceiveProps(props: Props, oldProps: Props) {
        if (!oldProps.cm && props.cm) {
            props.cm.on('change', this.handleChange);
            this.initCanvas();
            this.loop();
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.cm.off('change', this.handleChange);
    }

    ctx: CanvasRenderingContext2D;
    initCanvas = () => {
        let canvas = this.canvas();
        this.ctx = canvas.getContext('2d'),

            canvas.style.position = 'absolute';
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.zIndex = '1';
        canvas.style.pointerEvents = 'none';
    }

    lastTime = 0;
    shakeTime = 0;
    shakeTimeMax = 0;
    shakeIntensity = 5;
    loop = () => {
        if (this.isUnmounted) return;

        this.canvas().width = this.canvas().clientWidth;
        this.canvas().height = this.canvas().clientHeight;
        this.ctx.clearRect(0, 0, this.canvas().clientHeight, this.canvas().clientWidth);

        this.drawShake();
        this.drawParticles();
        requestAnimationFrame(this.loop);
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
    effect = 2; // 1 or 2
    drawParticles = (timeDelta?: number) => {
        // return if no particles
        if (!this.particles.length) return;

        // animate the particles
        for (let particle of this.particles) {
            if (this.effect === 1) { this.effect1(particle); }
            else if (this.effect === 2) { this.effect2(particle); }
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
        particle.theta += random(-0.5, 0.5); // TODO: pretty sure this is not used
        particle.vx += Math.sin(particle.theta) * 0.1;
        particle.vy += Math.cos(particle.theta) * 0.1;
        particle.size *= 0.96;

        this.ctx.fillStyle = 'rgba(' + particle.color[0] + ',' + particle.color[1] + ',' + particle.color[2] + ',' + particle.alpha + ')';
        this.ctx.beginPath();
        this.ctx.arc(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    throttledShake = throttle((time) => {
        this.shakeTime = this.shakeTimeMax = time;
    }, 100);

    PARTICLE_NUM_RANGE = { min: 5, max: 10 };
    throttledSpawnParticles = throttle((type) => {
        let cm = this.props.cm;
        var cursorPos = cm.getDoc().getCursor();

        let posForNode = cm.cursorCoords(cursorPos, 'window');
        var node = document.elementFromPoint(posForNode.left - 5, posForNode.top + 5);

        type = cm.getTokenAt(cursorPos);
        if (type) { type = type.type; };
        var numParticles = random(this.PARTICLE_NUM_RANGE.min, this.PARTICLE_NUM_RANGE.max);
        let color = getRGBComponents(node);
        let pos = cm.cursorCoords(cursorPos, 'page');

        for (var i = 0; i <= numParticles; i++) {
            this.particles[i] = this.createParticle(pos.left + 10, pos.top, color);
        }
    }, 100);

    PARTICLE_VELOCITY_RANGE = {
        x: [-1, 1],
        y: [-3.5, -1.5]
    }
    createParticle(x: number, y: number, color: [string, string, string]) {
        var p = {
            x: x,
            y: y + 10,
            alpha: 1,
            color: color,

            // modifed below
            drag: 0,
            wander: 0,
            theta: 0,
            size: 0,
            vx: 0,
            vy: 0,
        };
        if (this.effect === 1) {
            p.size = random(2, 4);
            p.vx = this.PARTICLE_VELOCITY_RANGE.x[0] + Math.random() *
                (this.PARTICLE_VELOCITY_RANGE.x[1] - this.PARTICLE_VELOCITY_RANGE.x[0]);
            p.vy = this.PARTICLE_VELOCITY_RANGE.y[0] + Math.random() *
                (this.PARTICLE_VELOCITY_RANGE.y[1] - this.PARTICLE_VELOCITY_RANGE.y[0]);
        } else if (this.effect === 2) {
            p.size = random(2, 8);
            p.drag = 0.92;
            p.vx = random(-3, 3);
            p.vy = random(-3, 3);
            p.wander = 0.15;
            p.theta = random(0, 360) * Math.PI / 180;
        }
        return p;
    }

    handleChange = () => {
        this.throttledShake(0.3);
        this.throttledSpawnParticles();
    };
}

interface Particle {
    x: number;
    y: number;
    alpha: number;
    color: [string, string, string];

    // modifed below
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

/** Throttles the callback */
function throttle(callback, limit) {
    var wait = false;
    return function(...args) {
        if (!wait) {
            callback.apply(this, args);
            wait = true;
            setTimeout(function() {
                wait = false;
            }, limit);
        }
    }
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

 ;(function () {
 	var shakeTime = 0,
 		shakeTimeMax = 0,
 		shakeIntensity = 5,
 		lastTime = 0,
 		particles = [],
 		particlePointer = 0,
 		MAX_PARTICLES = 500,
 		PARTICLE_NUM_RANGE = { min: 5, max: 10 },
 		PARTICLE_GRAVITY = 0.08,
 		PARTICLE_ALPHA_FADEOUT = 0.96,
 		PARTICLE_VELOCITY_RANGE = {
 			x: [-1, 1],
 			y: [-3.5, -1.5]
 		},
 		w = window.innerWidth,
 		h = window.innerHeight,
 		effect;

 	var cmNode;
 	var cm: CodeMirror.Editor;
 	var ctx;
 	var throttledShake = throttle(shake, 100);
 	var throttledSpawnParticles = throttle(spawnParticles, 100);

 	function initCanvas() {
 		var canvas = document.createElement('canvas');
 		ctx = canvas.getContext('2d'),

 		canvas.style.position = 'absolute';
 		canvas.style.top = '0';
 		canvas.style.left = '0';
 		canvas.style.zIndex = '1';
 		canvas.style.pointerEvents = 'none';
 		canvas.width = w;
 		canvas.height = h;

 		document.body.appendChild(canvas);
 	}

 	function getRGBComponents(node):[string,string,string] {
 		if (node) {
 			try {
                var color = getComputedStyle(node).color;
 				return color.match(/(\d+), (\d+), (\d+)/).slice(1) as any;
 			} catch(e) {
                return ['255', '255', '255'];
 			}
 		} else {
            return ['255', '255', '255'];
 		}
 	}

 	function spawnParticles(type) {
 		var cursorPos = cm.getDoc().getCursor();
 		var pos = cm.cursorCoords(cursorPos,'window');
 		var node = document.elementFromPoint(pos.left - 5, pos.top + 5);
 		type = cm.getTokenAt(cursorPos);
 		if (type) { type = type.type; };
 		var numParticles = random(PARTICLE_NUM_RANGE.min, PARTICLE_NUM_RANGE.max);
 		let color = getRGBComponents(node);
 		for (var i = numParticles; i--;) {
 			particles[particlePointer] = createParticle(pos.left + 10, pos.top, color);
 			particlePointer = (particlePointer + 1) % MAX_PARTICLES;
 		}
 	}

 	function createParticle(x, y, color) {
 		var p = {
 			x: x,
 			y: y + 10,
 			alpha: 1,
 			color: color,

            // modifed below
            drag: 0,
            wander: 0,
            theta: 0,
            size: 0,
            vx: 0,
            vy: 0,
 		};
 		if (effect === 1) {
 			p.size = random(2, 4);
 			p.vx = PARTICLE_VELOCITY_RANGE.x[0] + Math.random() *
 					(PARTICLE_VELOCITY_RANGE.x[1] - PARTICLE_VELOCITY_RANGE.x[0]);
 			p.vy = PARTICLE_VELOCITY_RANGE.y[0] + Math.random() *
 					(PARTICLE_VELOCITY_RANGE.y[1] - PARTICLE_VELOCITY_RANGE.y[0]);
 		} else if (effect === 2) {
 			p.size = random(2, 8);
 			p.drag = 0.92;
 			p.vx = random(-3, 3);
 			p.vy = random(-3, 3);
 			p.wander = 0.15;
 			p.theta = random(0, 360) * Math.PI / 180;
 		}
 		return p;
 	}

 	function effect1(particle) {
 		particle.vy += PARTICLE_GRAVITY;
 		particle.x += particle.vx;
 		particle.y += particle.vy;

 		particle.alpha *= PARTICLE_ALPHA_FADEOUT;

 		ctx.fillStyle = 'rgba('+ particle.color[0] +','+ particle.color[1] +','+ particle.color[2] + ',' + particle.alpha + ')';
 		ctx.fillRect(Math.round(particle.x - 1), Math.round(particle.y - 1), particle.size, particle.size);
 	}

 	// Effect based on Soulwire's demo: http://codepen.io/soulwire/pen/foktm
 	function effect2(particle) {
 		particle.x += particle.vx;
 		particle.y += particle.vy;
 		particle.vx *= particle.drag;
 		particle.vy *= particle.drag;
 		particle.theta += random( -0.5, 0.5 );
 		particle.vx += Math.sin( particle.theta ) * 0.1;
 		particle.vy += Math.cos( particle.theta ) * 0.1;
 		particle.size *= 0.96;

        ctx.fillStyle = 'rgba('+ particle.color[0] +','+ particle.color[1] +','+ particle.color[2] + ',' + particle.alpha + ')';
 		ctx.beginPath();
 		ctx.arc(Math.round(particle.x - 1), Math.round(particle.y - 1), particle.size, 0, 2 * Math.PI);
 		ctx.fill();
 	}

 	function drawParticles(timeDelta?) {
 		var particle;
 		for (var i = particles.length; i--;) {
 			particle = particles[i];
 			if (!particle || particle.alpha < 0.01 || particle.size <= 0.5) { continue; }

 			if (effect === 1) { effect1(particle); }
 			else if (effect === 2) { effect2(particle); }
 		}
 	}

 	function shake(time) {
 		shakeTime = shakeTimeMax = time;
 	}

 	function random(min, max) {
 		if (!max) { max = min; min = 0; }
 		return min + ~~(Math.random() * (max - min + 1))
 	}

 	function throttle (callback, limit) {
 		var wait = false;
 		return function (...args) {
 			if (!wait) {
 				callback.apply(this, args);
 				wait = true;
 				setTimeout(function () {
 					wait = false;
 				}, limit);
 			}
 		}
 	}

 	function loop() {
 		ctx.clearRect(0, 0, w, h);

 		// get the time past the previous frame
 		var current_time = new Date().getTime();
        var last_time;
 		if (!lastTime) last_time = current_time;
 		var dt = (current_time - lastTime) / 1000;
 		lastTime = current_time;

 		if (shakeTime > 0) {
 			shakeTime -= dt;
 			var magnitude = (shakeTime / shakeTimeMax) * shakeIntensity;
 			var shakeX = random(-magnitude, magnitude);
 			var shakeY = random(-magnitude, magnitude);
 			cmNode.style.transform = 'translate(' + shakeX + 'px,' + shakeY + 'px)';
 		}
 		drawParticles();
 		requestAnimationFrame(loop);
 	}

 	CodeMirror.defineOption("blastCode", false, function(c, val, old) {
 		if (val) {
 			cm = c;
 			(cm as any).state.blastCode = true;
 			effect = val.effect || 2;
 			cmNode = cm.getWrapperElement();
 			initCanvas();
 			loop();
 			cm.on("change", function (instance, change) {
 				throttledShake(0.3);
 				throttledSpawnParticles();
 			});
 		}
 	});
 })();
