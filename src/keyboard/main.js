let deltas = [];

let settings = { 'bar-width': 4 // px
	             , 'bar-height': 200 // px
	             , 'target-x': 0.5 // % of path length
               , 'bar-speed': 0.25 // (path length)/sec
               , 'bar-separation': 0.2 } // % of path length

let path, target;
let bars = [];
window.onload = function() {
	path = document.getElementById('path').getBoundingClientRect();
	target = createTarget(path);
}

let stop_animation = false;
// The timestamp sent to the requestAnimationFrame callback is the perfomance
// time on the page. Subtract the timestamp sent to the first call to "step"
// so the animation starts correctly.
let start_t;

document.addEventListener('keydown', function(event) {
	let key_time = performance.now()/1000 - start_t; // convert performance time to sec
	if (event.keyCode === 32) {
		event.preventDefault();

		let closest_bar = getBarClosestToTarget(key_time);
		deltas.push(closest_bar.dx);

		// remove bar closest to target and all those to the right of that bar
		let cutoff = bars.indexOf(closest_bar)+1
		bars.slice(0, cutoff).forEach(bar => remove(bar.el));
		bars = bars.slice(cutoff);
	}
});

function start() {
	setTimeout(function() {	window.requestAnimationFrame(step); }, 1000);
	setTimeout(stop, 12000);
}

// Function to pass as the callback to window.requestAnimationFrame.
function step(timestamp) {
	if (stop_animation) return;
	let seconds_elapsed = timestamp/1000;
	if (!start_t) start_t = seconds_elapsed;
	let now = seconds_elapsed - start_t;

	if (bars.length === 0) {
		addBar(path, now);
	} else {
		bars.forEach((bar, idx) => {
			let dt = now - bar.t0
			  , x = settings['bar-speed']*dt;
			if (x >= settings['bar-separation'] && idx === bars.length-1) addBar(path, now);
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
	displayValue('lag (ms)', avg/settings['bar-speed']*1000)
}

// Sets the distance to the target position on the closest bar.
function getBarClosestToTarget(t) {
	let closest_bar;
	bars.forEach(bar => {
		let dt = t - bar.t0 // lifetime of bar at time t
		  , x = (settings['bar-speed']*dt) // where the bar should be positioned at time t
		  , dx = x - settings['target-x']; // distance to target position
		if (!closest_bar || Math.abs(dx) < Math.abs(closest_bar.dx)) {
			bar.dx = dx;
			closest_bar = bar;
		}
	});
	return closest_bar;
}

function addBar(path, t0) {
	bars.push({el: setPosOfBar(createBar(path), getPosOnPath(path, 0)), t0});
}

function createBar(path) {
	let bar = document.createElement('div');
	bar.className = 'bar';
	bar.style.width = px(settings['bar-width']);
	bar.style.height = px(settings['bar-height']);
	bar.style.top = px(path.top - settings['bar-height']/2);
	document.body.appendChild(bar);
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

function remove(el) {
	el.parentElement.removeChild(el);
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

