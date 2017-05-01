'use strict';

// Takes the mouse data for which the angle value is within the range 0,2π
// and adds 2π to the value until it is within π of the closest corresponding
// pacer angle value. The purpose of this is to make the angle values of the
// mouse data ever-increasing like the pacer angle values.
function alignWithPacer(mouse, pacer) {
  var j = 0;
  var t_start = pacer[0][0],
      t_end = pacer[pacer.length - 1][0];
  var mouse_cut = mouse.filter(function (d) {
    return d[0] >= t_start && d[0] <= t_end;
  });
  mouse_cut.forEach(function (md) {
    while (j < pacer.length - 1 && pacer[j + 1][0] < md[0]) {
      j++;
    }var target = pacer[j][1];
    while (target - md[1] > Math.PI) {
      md[1] += 2 * Math.PI;
    }
  });
  return mouse_cut;
}

/// Will change the first and last element of the set to be at the passed times
/// using linear interpolation. Will throw away any data points that are before
/// and after end.
function alignStartAndEnd(set, start, end) {
  var cut_set = set.filter(function (d) {
    if (d[0] < start || d[0] > end) return false;
    return true;
  });
  var N = cut_set.length;
  if (cut_set[0][0] !== start) {
    cut_set[0][0] = start;
    cut_set[0][1] = interpolate(cut_set[0], cut_set[1], start);
  }
  if (cut_set[N - 1][0] !== end) {
    cut_set[N - 1][0] = end;
    cut_set[N - 1][1] = interpolate(cut_set[N - 2], cut_set[N - 1], end);
  }
  return cut_set;
}

function interpolate(p1, p2, t) {
  var slope = (p2[1] - p1[1]) / (p2[0] - p1[0]);
  return (t - p1[0]) * slope + p1[1];
}

function getTotalArea(set) {
  var area = 0;
  for (var i = 0; i < set.length - 1; i++) {
    area += getAreaInDelta(set[i], set[i + 1]);
  }
  return area;
}

function getAreaInDelta(p1, p2) {
  var dx = p2[0] - p1[0];
  var min_y = Math.min(p1[1], p2[1]),
      max_y = Math.max(p1[1], p2[1]);
  var rect_area = dx * min_y,
      trgl_area = 0.5 * dx * (max_y - min_y);
  return rect_area + trgl_area;
}

function displayValue(text, value) {
  var p = document.createElement('p');
  p.innerHTML = text + ': ' + value;
  document.body.appendChild(p);
}
'use strict';

// Data collected is in the form [performance time (ms), position on track (rad)]
var mouse_data = [],
    pacer_data = [];

var settings = { 'border-w': 1,
	'spoke': true,
	'pacer-r': 40,
	'rot-per-sec': 0.25 };

var track = void 0,
    pacer = void 0,
    spoke = void 0;
window.onload = function () {
	var radians = 0;
	track = initTrack(); // position and radius
	if (settings['spoke']) {
		spoke = createSpoke(track);
		setRotOfSpoke(spoke, radians);
	}
	pacer = createPacer(getPositionOnTrack(track, radians)); // DOM element
};

var collect = false;
var stop_animation = false;

document.addEventListener("mousemove", function (event) {
	moveHandler(event.pageX, event.pageY);
});

document.addEventListener("touchmove", function (event) {
	event.preventDefault();
	moveHandler(event.touches[0].pageX, event.touches[0].pageY);
});

function start() {
	setTimeout(function () {
		window.requestAnimationFrame(step);
	}, 1000);
	setTimeout(stop, 12000);
}

function moveHandler(pageX, pageY) {
	var radians = Math.atan2(pageY - track.center[1], pageX - track.center[0]);
	radians = (radians + 2 * Math.PI) % (2 * Math.PI); // converts from -π,π to 0,2π
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
	var t_start = mouse_data[0][0],
	    t_end = mouse_data[mouse_data.length - 1][0];
	pacer_data = alignStartAndEnd(pacer_data, t_start, t_end);

	plotSets({ type: 'pacer', data: pacer_data }, { type: 'mouse', data: mouse_data });

	var p_area = getTotalArea(pacer_data),
	    m_area = getTotalArea(mouse_data);
	displayValue('pacer area', p_area);
	displayValue('mouse area', m_area);
	displayValue('delta area', p_area - m_area);

	var avg_d_angle = (p_area - m_area) / (t_end - t_start);
	displayValue('avg. angle delta', avg_d_angle);
	displayValue('avg. lag in ms', (avg_d_angle / (settings['rot-per-sec'] * Math.PI * 2) * 1000).toFixed(1));
}

function setPosOfPacer(pacer, track, radians) {
	var pos = getPositionOnTrack(track, radians);
	pacer.style.left = px(pos[0]);
	pacer.style.top = px(pos[1]);
}

function setRotOfSpoke(spoke, radians) {
	spoke.style.transform = "rotate(" + radians + "rad)";
}

// Corrects for the pacer's origin being at the top-left corner of a square div.
function getPositionOnTrack(track, radians) {
	var pos = getRadialPos(track.center, track.radius, radians);
	return [pos[0] - settings['pacer-r'], pos[1] - settings['pacer-r']];
}

// The position returned will be midway through the track border.
function getRadialPos(center, radius, radians) {
	return [center[0] + (radius - settings['border-w'] / 2) * Math.cos(radians), center[1] + (radius - settings['border-w'] / 2) * Math.sin(radians)];
}

// The timestamp sent to the requestAnimationFrame callback is the perfomance
// time on the page. Subtract the timestamp sent to the first call to "step"
// so the pacer does not jump when the animation starts.
var start_t = void 0,
    theta = void 0;
// Function to pass as the callback to window.requestAnimationFrame.
function step(timestamp) {
	if (stop_animation) return;
	var seconds_elapsed = timestamp / 1000;
	if (!start_t) start_t = seconds_elapsed;
	theta = 2 * Math.PI * settings['rot-per-sec'] * (seconds_elapsed - start_t);
	// Do not collect data from the first corner-turn of the pacer. This is so
	// the user has time to react to the motion and start following.
	if (theta > Math.PI / 2) collect = true;
	if (collect) pacer_data.push([timestamp, theta]);

	setPosOfPacer(pacer, track, theta);
	if (settings['spoke']) setRotOfSpoke(spoke, theta);

	window.requestAnimationFrame(step);
}

function removeTrackAndPacer() {
	var container = document.getElementById('container');
	container.parentElement.removeChild(container);
	var pacer = document.getElementById('pacer');
	pacer.parentElement.removeChild(pacer);
	if (settings['spoke']) {
		var _spoke = document.getElementById('spoke');
		_spoke.parentElement.removeChild(_spoke);
	}
}

function coordinateDemo() {
	createPacer(getPositionOnTrack(track, 0));
	createPacer(getPositionOnTrack(track, Math.PI / 2));
	createPacer(getPositionOnTrack(track, Math.PI));
	createPacer(getPositionOnTrack(track, 3 * Math.PI / 2));
}

// There must be a div with the "track" id on the page, and that div should
// have the correct width and position set. Returns the radius and absolute
// position of the track's center. The radius includes the width of the border.
function initTrack() {
	var track_div = document.getElementById('track');
	var track_dims = track_div.getBoundingClientRect();
	// The width of the track is a percentage of the page width. The height in the
	// track_dims object will not accurately represent the height of the track.
	track_div.style.height = px(track_dims.width);
	track_div.style['border-width'] = px(settings['border-w']);
	// The width of the track includes the width of the border.
	var radius = track_dims.width / 2,
	    center = [track_dims.left + radius, track_dims.top + radius];
	return { radius: radius, center: center };
}

// Pacers are appended to the body of the document and positioned absolutely.
function createPacer(pos) {
	var pacer = document.createElement('div');
	pacer.id = 'pacer';
	pacer.className = 'pacer';
	pacer.style.width = px(2 * settings['pacer-r']);
	pacer.style.height = px(2 * settings['pacer-r']);
	pacer.style.left = px(pos[0]);
	pacer.style.top = px(pos[1]);
	document.body.appendChild(pacer);
	return pacer;
}

function createSpoke(track, radians) {
	var spoke = document.createElement('div');
	spoke.id = 'spoke';
	spoke.style.width = px(track.radius);
	spoke.style.left = px(track.center[0]);
	spoke.style.top = px(track.center[1]);
	// So the div will rotate around the center position.
	["transform-origin", "-webkit-transform-origin", "-moz-transform-origin", "-ms-transform-origin"].forEach(function (transform) {
		spoke.style[transform] = "0 0";
	});
	document.body.appendChild(spoke);
	return spoke;
}

function px(str) {
	return str + 'px';
}
"use strict";

// REQUIRES D3

// Draws all passed data sets onto one graph.
function plotSets() {
    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.linear().range([0, width]);

    var y = d3.scale.linear().range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left");

    var svg = d3.select("body").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
        data[_key] = arguments[_key];
    }

    var data_sets = data.reduce(function (a, b) {
        return a.concat(b.data);
    }, []);
    setDomain(x, 0, data_sets);
    setDomain(y, 1, data_sets);

    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("class", "label").attr("x", width).attr("y", -6).style("text-anchor", "end").text("performance time (ms)");

    svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("radians");

    data.forEach(function (set) {
        plotSet(svg, x, y, color, set.type, set.data);
    });

    var legend = svg.selectAll(".legend").data(color.domain()).enter().append("g").attr("class", "legend").attr("transform", function (d, i) {
        return "translate(0," + i * 20 + ")";
    });

    legend.append("rect").attr("x", width - 18).attr("width", 18).attr("height", 18).style("fill", color);

    legend.append("text").attr("x", width - 24).attr("y", 9).attr("dy", ".35em").style("text-anchor", "end").text(function (d) {
        return d;
    });
}

// Finds the extents of all the data from the sets, using the values in the
// "idx" position of each array in the data set. Sets that extent as the domain
// of the graph axis.
function setDomain(axis, idx, sets) {
    var values = sets.reduce(function (a, b) {
        return a.concat([b[idx]]);
    }, []);
    axis.domain(d3.extent(values, function (d) {
        return d;
    })).nice();
}

function plotSet(svg, x, y, color, type, data) {
    svg.selectAll(".dot." + type).data(data).enter().append("circle").attr("class", "dot").attr("r", 2).attr("cx", function (d) {
        return x(d[0]);
    }).attr("cy", function (d) {
        return y(d[1]);
    }).style("fill", function (d) {
        return color(type);
    });
}
