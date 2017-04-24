function getAreaInDelta(p1, p2) {
	var dx = p2[0] - p1[0];
	var min_y = Math.min(p1[1], p2[1])
	  , max_y = Math.max(p1[1], p2[1]);
	var rect_area = dx * min_y
	  , trgl_area = 0.5 * dx * (max_y-min_y);
	return rect_area + trgl_area;
}

function getAreaUnderLine(points) {
	var area = 0;
	for (var i=0; i<points.length-1; i++)
		area += getAreaInDelta(points[i], points[i+1]);
	return area;
}
