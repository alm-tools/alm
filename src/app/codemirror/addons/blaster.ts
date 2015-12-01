/**
 * Based on https://github.com/chinchang/code-blast-codemirror
 */
 /*
 Based on Joel Besada's lovely experiment
 https://twitter.com/JoelBesada/status/670343885655293952
  */

import CodeMirror = require('codemirror');

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

 	function getRGBComponents(node):[number,number,number] {
 		var color = getComputedStyle(node).color;
 		if (color) {
 			try {
 				return color.match(/(\d+), (\d+), (\d+)/).slice(1) as any;
 			} catch(e) {
 				return [255, 255, 255];
 			}
 		} else {
 			return [255, 255, 255];
 		}
 	}

 	function spawnParticles(type) {
 		var cursorPos = cm.getDoc().getCursor();
 		var pos = (cm as any).cursorCoords();
 		var node = document.elementFromPoint(pos.left - 5 , pos.top + 5); // TODO: this is wrong
        // console.log(node);
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
