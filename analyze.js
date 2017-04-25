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

function reduceSetWithinBounds(set, min_dependent, max_dependent) {
	return set.filter(function(pair) {
		return min_dependent < pair[1] && pair[1] < max_dependent;
	});
}

function displayValue(text, value) {
	var p = document.createElement('p');
	p.innerHTML = text + ': ' + value;
	document.body.appendChild(p);
}
