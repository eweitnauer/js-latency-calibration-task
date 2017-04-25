function plotSets(...data) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40}
    , width = 960 - margin.left - margin.right
    , height = 500 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data_sets = data.reduce(function(a, b) { return a.concat(b.data) }, []);
  // console.log('sets', data_sets);
  setDomain(x, 0, data_sets);
  setDomain(y, 1, data_sets);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("performance time (ms)");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("radians")

  console.log(data.length);
  data.forEach(function(set) {
    console.log(set.type);
    plotSet(svg, x, y, color, set.type, set.data);
  })

  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
}

function setDomain(axis, idx, sets) {
  var values = sets.reduce(function(a, b) { return a.concat([b[idx]]); }, []);
  // console.log('values', values);
  axis.domain(d3.extent(values, function(d) { return d })).nice();
}

function plotSet(svg, x, y, color, type, data) {
  svg.selectAll(".dot."+type)
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { /*if (isNaN(x(d[0]))) console.log(d[0]);*/ return x(d[0]); })
      .attr("cy", function(d) { /*if (isNaN(x(d[1]))) console.log(d[1]);*/ return y(d[1]); })
      .style("fill", function(d) { return color(type); });
}

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

function interpolate(p1, p2, t) {
  var slope = (p2[1]-p1[1])/(p2[0]-p1[0]);
  return (t-p1[0])*slope+p1[1];
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
