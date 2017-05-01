// Takes the mouse data for which the angle value is within the range 0,2π
// and adds 2π to the value until it is within π of the closest corresponding
// pacer angle value. The purpose of this is to make the angle values of the
// mouse data ever-increasing like the pacer angle values.
function alignWithPacer(mouse, pacer) {
  var j = 0;
  let t_start = pacer[0][0]
    , t_end = pacer[pacer.length-1][0];
  var mouse_cut = mouse.filter(d => d[0] >= t_start && d[0] <= t_end);
  mouse_cut.forEach(md => {
    while (j < pacer.length-1 && pacer[j+1][0] < md[0]) j++;
    let target = pacer[j][1];
    while (target - md[1] > Math.PI) md[1] += 2*Math.PI;
  });
  return mouse_cut;
}

/// Will change the first and last element of the set to be at the passed times
/// using linear interpolation. Will throw away any data points that are before
/// and after end.
function alignStartAndEnd(set, start, end) {
  let cut_set = set.filter(d => {
    if (d[0] < start || d[0] > end) return false;
    return true;
  });
  let N = cut_set.length;
  if (cut_set[0][0] !== start) {
    cut_set[0][0] = start;
    cut_set[0][1] = interpolate(cut_set[0], cut_set[1], start);
  }
  if (cut_set[N-1][0] !== end) {
    cut_set[N-1][0] = end;
    cut_set[N-1][1] = interpolate(cut_set[N-2], cut_set[N-1], end);
  }
  return cut_set;
}

function interpolate(p1, p2, t) {
  var slope = (p2[1]-p1[1])/(p2[0]-p1[0]);
  return (t-p1[0])*slope+p1[1];
}

function getTotalArea(set) {
	var area = 0;
	for (var i=0; i<set.length-1; i++) {
		area += getAreaInDelta(set[i], set[i+1]);
	}
	return area;
}

function getAreaInDelta(p1, p2) {
	var dx = p2[0] - p1[0];
	var min_y = Math.min(p1[1], p2[1])
	  , max_y = Math.max(p1[1], p2[1]);
	var rect_area = dx * min_y
	  , trgl_area = 0.5 * dx * (max_y-min_y);
	return rect_area + trgl_area;
}

function displayValue(text, value) {
	var p = document.createElement('p');
	p.innerHTML = text + ': ' + value;
	document.body.appendChild(p);
}
