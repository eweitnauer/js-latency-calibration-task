let deltas = [];

let settings = { 'bar-width': 50 // px
	             , 'bar-height': 50 // px
	             , 'avg-frame-dur': 16.7 // ms
               , 'step-t': 300 // ms between each highlight
               , 'steps-to-target': 5 }; // # of time intervals until target is highlighted

let path, bars, target;
window.onload = function() {
	path = document.getElementById('path').getBoundingClientRect();
	bars = createBars(path);
	target = createTarget(path);
}

let stop_animation = false;
// Subtract the timestamp recorded in the first call to "step" from all animation
// timestamps so the animation starts correctly.
let start_t;

// The timestamp when the target was highlighted.
let last_cb_t;
// The timestamp when the key was pressed;
let kp_t;

function onUserInput(time) {
	if (time < bars[settings['steps-to-target']].t) {
		// If the target has not been highlighted yet, store the keypress time so we
		// can determine the time difference when the target is highlighted. (The user
		// pressed too early).
		kp_t = time;
	} else {
		// The user pressed too late.
		kp_t = false;
		// Restart the highlight sequence.
		setBarTimeOrigin(time);
		deltas.push(time - last_cb_t);
	}
}

document.addEventListener('keydown', function(event) {
	let key_time = performance.now() - start_t;
	if (!start_t) return;
	// spacebar
	if (event.keyCode === 32) {
		event.preventDefault();
		onUserInput(key_time);
	}
});

document.addEventListener('mousedown', function(event) {
	let click_time = performance.now() - start_t;
	if (!start_t) return;
	event.preventDefault();
	onUserInput(click_time);
});

function start() {
	setTimeout(function() {	window.requestAnimationFrame(step); }, 1000);
	setTimeout(stop, 30000/*50000*/);
}

// Function to pass as the callback to window.requestAnimationFrame.
function step() {
	if (stop_animation) return;

	// Get the timestamp when the animation callback fires. Don't use the timestamp
	// parameter, which may have a different definition across browsers.
	let animation_cb_t = performance.now();
	if (!start_t) start_t = animation_cb_t;
	animation_cb_t -= start_t;

	// If the step interval occurs during this animation frame, but after the cb,
	// act as if the step interval has happened.
	// If the timeline is `aF --> cb --> step --> aF`, then acting as if the step
	// has already occured will result in the bar being highlighted closer to the
	// step interval rather than waiting for another whole animation frame.
	let now = animation_cb_t + settings['avg-frame-dur'];

	bars.forEach((bar, idx) => {
		if (now >= bar.t) {
			// highlight
			fillBar(bar.el, true);
			if (idx === settings['steps-to-target'] && !bar.on) {
				if (kp_t) {
					// The spacebar has already been pressed. Now we know when the target
					// would have been highlighted.
					deltas.push(kp_t - animation_cb_t);
					kp_t = false;
					setBarTimeOrigin(animation_cb_t);
				} else {
					last_cb_t = animation_cb_t;
					// The target is another element on top of the "bars," so we need to
					// change its background, too.
					fillBar(target, true);
				}
			}
			// Prevent the last_cb_t from updating every time the target time has been
			// exceeded in the animation frame loop.
			bar.on = true;
		} else {
			// When the time origin of the bars is increased, this will unhighlight them.
			bar.on = false;
			fillBar(bar.el, false);
			if (idx === settings['steps-to-target']) fillBar(target, false);
		}
	});

	// Wait one step interval before restarting the highlighting sequence. This
	// only occurs if the user never pressed the key and all bars have been
	// highlighted, so we start the sequence over.
	if (now > bars[bars.length-1].t + settings['step-t']) setBarTimeOrigin(now);

	window.requestAnimationFrame(step);
}

function stop() {
	stop_animation = true;
	removeAll();
	let sum = deltas.reduce(function(a, b) { return a+b })
	  , avg = sum/deltas.length;
	displayValue('lag (ms)', avg);

	plotSets({ type: 'keypress', data: deltas.map((d,i) => [i, d]) });
}

function createBar(path, before_el) {
	let bar = document.createElement('div');
	bar.className = 'bar';
	bar.style.width = px(settings['bar-width']);
	bar.style.height = px(settings['bar-height']);
	bar.style.top = px(path.top - settings['bar-height']/2);
	if (before_el) document.body.insertBefore(bar, before_el);
	else document.body.appendChild(bar);
	return bar;
}

function setPosOfBar(bar, x) {
	bar.style.left = px(x - settings['bar-width']/2);
	return bar;
}

function getPosOnPath(path, percent) {
	return path.left + path.width*percent;
}

// Adds 11 equadistant bars to the path. Each bar has a time "t" which is the
// performance timestamp at which they should be highlighted.
function createBars(path) {
	let bars = [];
	[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach((x, idx) => {
		let bar = setPosOfBar(createBar(path), getPosOnPath(path, x));
		bar.classList.add('trough');
		bars.push({el: bar, t: idx*settings['step-t'], on: false});
	});
	return bars;
}

// Should be placed on top of the "bars" layer.
function createTarget(path) {
	let target = setPosOfBar(createBar(path), getPosOnPath(path, settings['steps-to-target']*0.1)); // convert to factor of path length
	target.id = 'target';
	return target;
}

function setBarTimeOrigin(t) {
	let rand_delay = settings['step-t'] + Math.random()*settings['step-t']; // add a small random delay
	bars.forEach((bar, idx) => bar.t = t + idx*settings['step-t'] + rand_delay);
}

function fillBar(el, fill) {
	el.style['background-color'] = fill ? 'black' : 'white';
}

function remove(el) {
	if (el.parentElement) el.parentElement.removeChild(el);
}

function removeAll() {
	bars.forEach(bar => remove(bar.el));
	remove(target);
	remove(document.getElementById('container'));
}

function px(str) { return str + 'px'; }

function displayValue(text, value) {
	var p = document.createElement('p');
	p.innerHTML = text + ': ' + value;
	document.body.appendChild(p);
}

