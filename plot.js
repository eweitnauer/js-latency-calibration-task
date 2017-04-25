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

function interpolate(p1, p2) {
  var slope = (p2[1]-p1[1])/(p2[0]-p1[0]);
  return function(x) {
    return (x-p1[0])*slope+p1[1];
  }
}

// function scaleDataSets(mod, ...sets) {
//   var curr_x = Math.min(...(sets.map(function(set) { return set[0]; })));
//   var indeces = sets.map(function(set) { return 0; });
// }

// function scaleToSet(set1, set2, modulator) {
//   var j = 0;
//   var curr_diff = 0;
//   for (var i=0; i<set1.length; i++) {
//     if (j === 0 && set1[i][0] < set2[j][0]) {
//       set1[i] = false;
//       continue;
//     }
//     while (j < set2.length-1 && set1[i][0] < set2[j+1][0]) j++;
//     if (j > set2.length-2) {
//       set1[i] = false;
//       continue;
//     }
//     set1[i][1] += curr_diff;
//     var ceiling = interpolate(set2[j], set2[j+1])(set1[i][0]);
//     var diff = ceiling - set1[i][1];
//     console.log(diff);
//     if (diff < modulator) console.log('hi', i, set1[i][1], ceiling, diff, curr_diff);
//     while (diff > modulator) {
//       set1[i][1] += modulator;
//       curr_diff += modulator;
//       diff = ceiling - set1[i][1];
//       // if (Math.abs(diff) > modulator) console.log('hi', i, set1[i][1], ceiling, diff)
//     }
//   }
//   return set1.filter(function(p) { return p; });
// }
