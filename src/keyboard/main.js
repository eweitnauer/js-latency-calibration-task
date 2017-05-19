let deltas = [];

let settings = { 'bar-width': 50// px
	             , 'bar-height': 50 // px
	             , 'target-x': 0.5 // factor of path length
	             , 'step-dist': 0.1 // factor of path length
               , 'bar-speed': 3 // steps/sec
               /*, 'bar-separation': 0.1*/ } // factor of path length

let path, target;
let troughs = []
  , bars = [];
window.onload = function() {
	path = document.getElementById('path').getBoundingClientRect();
	target = createTarget(path);
	createTroughs(path);
}

let stop_animation = false;
// The timestamp sent to the requestAnimationFrame callback is the perfomance
// time on the page. Subtract the timestamp sent to the first call to "step"
// so the animation starts correctly.
let start_t;

function onUserInput(time) {
	let key_time = performance.now()/1000 - start_t; // convert performance time to sec
	let closest_bar = getBarClosestToTarget(key_time);
	deltas.push(closest_bar.dx);

	// remove bar closest to target and all those to the right of that bar
	let cutoff = bars.indexOf(closest_bar)+1
	bars.slice(0, cutoff).forEach(bar => remove(bar.el));
	bars = bars.slice(cutoff);
}

document.addEventListener('keydown', function(event) {
	let key_time = performance.now()/1000 - start_t; // convert performance time to sec

	if (event.keyCode === 32) {
		event.preventDefault();
		onUserInput(key_time);
	}
});

document.addEventListener('mousedown', function(event) {
	let click_time = performance.now()/1000 - start_t; // convert performance time to sec
	if (!start_t) return;
	event.preventDefault();
	onUserInput(click_time);
});

function start() {
	setTimeout(function() {	window.requestAnimationFrame(step); }, 1000);
	setTimeout(stop, 30000);
}

// Function to pass as the callback to window.requestAnimationFrame.
function step() {
	// Get the timestamp when the animation callback fires. Don't use the timestamp
	// parameter, which is a different value across browsers.
	let timestamp = performance.now();
	if (stop_animation) return;
	let seconds_elapsed = timestamp/1000;
	if (!start_t) start_t = seconds_elapsed;
	let now = seconds_elapsed - start_t;

	if (bars.length === 0) {
		addBar(path, now);
	} else {
		bars.forEach((bar, idx) => {
			let dt = now - bar.t0
			  , x = settings['step-dist'] * /*Math.floor(*/settings['bar-speed']*dt/*)*/;
			if (x >= settings['step-dist'] && idx === bars.length-1) addBar(path, bar.t0+settings['step-dist']/settings['bar-speed']);
			setPosOfBar(bar.el, getPosOnPath(path, x));
		});
	}

	window.requestAnimationFrame(step);
}

function stop() {
	stop_animation = true;
	removeAll();
	let sum = deltas.reduce(function(a, b) { return a+b })
	  , avg = sum/deltas.length;
	displayValue('avg. dist to target (% of path length)', avg);
	displayValue('lag (ms)', avg/settings['bar-speed']*1000);

	plotSets({ type: 'keypress', data: deltas.map((d,i) => [i, d/settings['bar-speed']*1000]) });
}

// Sets the distance to the target position on the closest bar.
function getBarClosestToTarget(t) {
	let closest_bar;
	bars.forEach(bar => {
		let dt = t - bar.t0 // lifetime of bar at time t
		  , x = (/*settings['step-dist']**/settings['bar-speed']*dt) // where the bar should be positioned at time t
		  , dx = x - settings['target-x']; // distance to target position
		if (!closest_bar || Math.abs(dx) < Math.abs(closest_bar.dx)) {
			bar.dx = dx;
			closest_bar = bar;
		}
	});
	return closest_bar;
}

function addBar(path, t0) {
	bars.push({el: setPosOfBar(createBar(path, target), getPosOnPath(path, 0)), t0});
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

function createTarget(path) {
	let target = setPosOfBar(createBar(path), getPosOnPath(path, settings['target-x']));
	target.id = 'target';
	return target;
}

function createTroughs(path) {
	[0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1].forEach((x) => {
		let trough = setPosOfBar(createBar(path), getPosOnPath(path, x));
		trough.classList.add('trough');
		troughs.push(trough);
	});
}

function remove(el) {
	if (el.parentElement) el.parentElement.removeChild(el);
}

function removeAll() {
	bars.forEach(bar => remove(bar.el));
	troughs.forEach(trough => remove(trough));
	remove(target);
	remove(document.getElementById('container'));
}

function px(str) { return str + 'px'; }

function displayValue(text, value) {
	var p = document.createElement('p');
	p.innerHTML = text + ': ' + value;
	document.body.appendChild(p);
}

