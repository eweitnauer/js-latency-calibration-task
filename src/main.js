// Data collected is in the form [performance time (ms), position on track (rad)]
let mouse_data = []
  , pacer_data = [];

let settings = { 'border-w': 1
               , 'pacer-r': 40
               , 'rot-per-sec': 0.25 };

let track, pacer;
window.onload = function() {
	track = initTrack(); // position and radius
	pacer = createPacer(getPositionOnTrack(track, 0)); // DOM element
}

let collect = false;
let stop_animation = false;

document.addEventListener("mousemove", function(event) {
	moveHandler(event.pageX, event.pageY);
});

document.addEventListener("touchmove", function(event) {
	event.preventDefault();
	moveHandler(event.touches[0].pageX, event.touches[0].pageY);
})

function start() {
	setTimeout(function() {	window.requestAnimationFrame(step); }, 1000);
	setTimeout(stop, 12000);
}

function moveHandler(pageX, pageY) {
	let radians = Math.atan2(pageY-track.center[1], pageX-track.center[0]);
	radians = (radians + 2*Math.PI) % (2*Math.PI); // converts from -π,π to 0,2π
	if (collect) mouse_data.push([performance.now(), radians]);
}

// Stops the animation. Removes the track and pacer from the page.
// Adjusts data and analyzes lag. Plots data w/ d3.
function stop() {
	collect = false;
	stop_animation = true;
	removeTrackAndPacer();

	if (mouse_data.length === 0) return;
	mouse_data = alignWithPacer(mouse_data, pacer_data);
	let t_start = mouse_data[0][0]
	  , t_end = mouse_data[mouse_data.length-1][0];
	pacer_data = alignStartAndEnd(pacer_data, t_start, t_end);

	plotSets({ type: 'pacer', data: pacer_data }
		      ,{ type: 'mouse', data: mouse_data });

	let p_area = getTotalArea(pacer_data)
	  , m_area = getTotalArea(mouse_data);
	displayValue('pacer area', p_area);
	displayValue('mouse area', m_area);
	displayValue('delta area', p_area-m_area);

	let avg_d_angle = (p_area-m_area)/(t_end-t_start);
	displayValue('avg. angle delta', avg_d_angle);
	displayValue('avg. lag in ms', (avg_d_angle / (settings['rot-per-sec']*Math.PI*2) * 1000).toFixed(1));
}

function setPosOfPacer(pacer, track, radians) {
	let pos = getPositionOnTrack(track, radians);
	pacer.style.left = px(pos[0]);
	pacer.style.top = px(pos[1]);
}

// Corrects for the pacer's origin being at the top-left corner of a square div.
function getPositionOnTrack(track, radians) {
	let pos = getRadialPos(track.center, track.radius, radians);
	return [ pos[0] - settings['pacer-r']
	       , pos[1] - settings['pacer-r'] ];
}

// The position returned will be midway through the track border.
function getRadialPos(center, radius, radians) {
	return [ center[0] + (radius-settings['border-w']/2)*Math.cos(radians)
	       , center[1] + (radius-settings['border-w']/2)*Math.sin(radians) ];
}

// The timestamp sent to the requestAnimationFrame callback is the perfomance
// time on the page. Subtract the timestamp sent to the first call to "step"
// so the pacer does not jump when the animation starts.
let start_t, theta;
// Function to pass as the callback to window.requestAnimationFrame.
function step(timestamp) {
	if (stop_animation) return;
	let seconds_elapsed = timestamp/1000;
	if (!start_t) start_t = seconds_elapsed;
	theta = 2*Math.PI*settings['rot-per-sec']*(seconds_elapsed - start_t);
	// Do not collect data from the first corner-turn of the pacer. This is so
	// the user has time to react to the motion and start following.
	if (theta > Math.PI/2) collect = true;
	if (collect) pacer_data.push([timestamp, theta]);

	setPosOfPacer(pacer, track, theta);

	window.requestAnimationFrame(step);
}

function removeTrackAndPacer() {
	let container = document.getElementById('container');
	container.parentElement.removeChild(container);
	let pacer = document.getElementById('pacer');
	pacer.parentElement.removeChild(pacer);
}

function coordinateDemo() {
	createPacer(getPositionOnTrack(track, 0));
	createPacer(getPositionOnTrack(track, Math.PI/2));
	createPacer(getPositionOnTrack(track, Math.PI));
	createPacer(getPositionOnTrack(track, 3*Math.PI/2));
}

// There must be a div with the "track" id on the page, and that div should
// have the correct width and position set. Returns the radius and absolute
// position of the track's center. The radius includes the width of the border.
function initTrack() {
	let track_div = document.getElementById('track');
	let track_dims = track_div.getBoundingClientRect();
	console.log('track dims', track_dims);
	// The width of the track is a percentage of the page width. The height in the
	// track_dims object will not accurately represent the height of the track.
	track_div.style.height = px(track_dims.width);
	track_div.style['border-width'] = px(settings['border-w']);
	// The width of the track includes the width of the border.
	let radius = track_dims.width/2
	  , center = [track_dims.left + radius, track_dims.top + radius];
	return { radius, center };
}

// Pacers are appended to the body of the document and positioned absolutely.
function createPacer(pos) {
	let pacer = document.createElement('div');
	pacer.id = 'pacer';
	pacer.className = 'pacer';
	pacer.style.width = px(2*settings['pacer-r']);
	pacer.style.height = px(2*settings['pacer-r']);
	pacer.style.left = px(pos[0]);
	pacer.style.top = px(pos[1]);
	document.body.appendChild(pacer);
	return pacer;
}

function px(str) { return str + 'px'; }
