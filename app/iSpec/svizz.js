var isFirefox = (navigator.userAgent.indexOf('Firefox') !== -1);
var doNotify = true;

function hslToHex(h, s, l)
// cf. https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
{
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}


function plot_spectra( parent, spectra, width=900, height=400, add_range_selectors = false, plot_position=true )
// add a D3 line plot to the specified parent
// that displays the passed spectra.
{

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 20, left: 60},
      width = width - margin.left - margin.right,
      height = height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  clear_spectra(parent);
  if (Object.keys( query_result.wav ).length == 0)
  {
    return; // bail!
  }

  var svg = d3.select(parent)
    .append("svg")
      .attr("id", "svgplot")
      //.attr("preserveAspectRatio", "xMinYMin meet")
      //.attr("viewBox", "0 0 " + (width + margin.left) + " " + (height + margin.height) )
      //.classed("svg-content", true)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width )
      .attr("height", height )
      .attr("x", 0)
      .attr("y", 0);

    // Get default range from spectra object
    var ranges = spectra.ranges || { "VNIR" : [400.,1000.],
                                    "SWIR" : [1000.,3000.],
                                    "MWIR" : [3000., 5000.],
                                    "LWIR" : [5000., 13000.]}
    var range = spectra.default_range || "SWIR";
    var style = spectra.style || null;

    // loop (backwards) through minerals and add data to plot
    var xy_all = [] // store all xy for quickly calculating ranges
    for (var m = spectra.minerals.length-1; m >= 0; m-- )
    {
      // get mineral name
      let mineral = spectra.minerals[m];

      // get/calculate colour and other properties for mineral
      let mineral_colour = hslToHex( 20 + (m / spectra.minerals.length) * 340, 80, 80 );
      let alpha = 1.0;
      let lwidth = 1.5;
      if (spectra.colours) { mineral_colour = spectra.colours[m];  }
      if (spectra.alpha) { alpha = spectra.alpha[m]; }
      if (spectra.width) { lwidth = spectra.width[m]; }

      // should this spectra be filled?
      let fill = "none";
      if (style)
      {
          if (style[m] == "line" || style[m] == null || style[m] == "null" )
          {
              fill = "none"; // leave fill as none
          } else
          {
              fill = style[m]; // set fill colour

              //duplicate first and second spectra to create fill area
              if (spectra[mineral].length == 2)
              {
                  let wavR = spectra.wav[spectra[mineral][1].length].slice();
                  let refR = spectra[mineral][1].slice();
                  wavR.reverse();
                  refR.reverse();

                  spectra.wav[ spectra[mineral][0].length+wavR.length ]
                      = spectra.wav[ spectra[mineral][0].length ].concat( wavR );
                  spectra[mineral] = [ spectra[mineral][0].concat( refR ) ];

              } else
              {
                  console.log("Warning - spectra style set to fill but contains <2 spectra.");
              }
          }
      }

      // create group for this mineral
      var M = svg.append('g')
        .attr("clip-path", "url(#clip)") // apply clipping
        .attr("id", mineral)
        .attr("stroke", mineral_colour) // colour
        .attr("stroke-width", lwidth) // width
        .attr("fill-opacity", alpha )
        .attr("stroke-opacity", alpha );

      // add spectra lines for each mineral
      for (var s = 0; s < spectra[mineral].length; s++ ) 
      {
          // get individual spectra data
          var ydata = spectra[mineral][s];
          var xdata = spectra.wav[ydata.length];
          if (xdata.length != ydata.length) {  // break if length's don't match
            console.log("Warning: x- and y- don't match for ", mineral, s);
            continue; }

          // convert to D3 weird format
          var xy = [];
          for(var i = 0; i < xdata.length; i++ ) {
            if (!isNaN(ydata[i]) && !isNaN(xdata[i])) { // ignore nans
              xy.push({x: xdata[i], y: ydata[i]}); // store points in this line
              xy_all.push({x: xdata[i], y: ydata[i]}); // store all points for auto-scaling
            }
          }

          // Add the line
          M.append("path")
            .datum(xy)
            .attr("class", "line")  // add the class line to be able to modify all lines later on.
            .attr("fill", fill)
      }
    }

    // add vertical lines [ positions ]
    if (spectra.positions)
    {
      for (let p = 0; p < spectra.positions.length; p++)
      {
        // get position
        if (Array.isArray(spectra.positions[p]))
        {
            var w = spectra.positions[p][0];
            var delta = Math.abs( spectra.positions[p][1] );
        } else {
            var w = spectra.positions[p];
            var delta = null;
        }
        
        // calculate colour
        let c = 'black'; // default colour
        if (w < 0) { c = 'red'; }

        // add filled rectangle?
        if (delta) {
          var xy = [{x: Math.abs(w)-delta, y:-0.1}, {x: Math.abs(w)-delta, y:1.1},
                    {x: Math.abs(w)+delta, y:1.1}, {x: Math.abs(w)+delta, y:-0.1} ];
          svg.append("path")
             .datum(xy)
             .attr("class","line")
             .attr("fill",c)
             .attr("stroke",'none')
             .attr("fill-opacity",0.2);
        }

        // add central line
        var xy = [{x: Math.abs(w), y:-0.1},{x: Math.abs(w), y:1.1} ];
        svg.append("path")
           .datum(xy)
           .attr("class","line")
           .attr("fill","none")
           .attr("stroke",c)
           .attr("stroke-opacity",0.8)
           .attr("stroke-width",1.25);
      }

    }

    // add boxes lines [ spectral ranges ]
    if (spectra.ranges)
    {
      for (let p = 0; p < spectra.boxes.length; p++)
      {
        let c = 'black';
        if (spectra.positions[p][0] < 0) { c = 'red'; }
        let w0 = Math.abs( spectra.positions[p][0] );
        var xy = [{x: w, y:-0.1},{x: w, y:1.1} ];
        svg.append("path")
           .datum(xy)
           .attr("class","line")
           .attr("fill","none")
           .attr("stroke",c)
           .attr("stroke-opacity",0.8)
           .attr("stroke-width",1.25);
      }

    }

    // create the axes with default range
    var x = d3.scaleLinear()
      // .domain(d3.extent(xy, function(d) {return d.x;})) // calculate total range
      .domain(ranges[range]) // use specified range
      .range([ 0, width ]);
    xAxis = svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
      .domain(d3.extent(xy_all, function(d) {
          if (d.x > ranges[range][0] & d.x < ranges[range][1]){ // check range
            return d.y;}
          }).map(function(num,idx){ return num + 0.1 * idx - 0.05 }))
      .range([ height, 0 ]);
    yAxis = svg.append("g")
      .call(d3.axisLeft(y));

    // apply ranges to line
    rescale(svg, x, y);


    if (plot_position & !isFirefox )
    {
       // Create the text that travels along the curve of chart
       var focusText = svg
         .append('g')
         .append('text')
           .style("opacity", 0)
           .style('font-size', 14)
           .attr("alignment-baseline", "middle");

         // capture mouse events
        svg.on('mouseover', mouseover)
           .on('mousemove', mousemove)
           .on('mouseout', mouseout);

        // What happens when the mouse move -> show the annotations at the right positions.
        function mouseover() {
          focusText.style("opacity",0.5);
        }

        function mousemove() {
            // recover coordinate we need
            var xpos = d3.mouse(this)[0];
            var ypos =  d3.mouse(this)[1];
            focusText
              .html( (y.invert(ypos)*100).toFixed(0) + "% at " + x.invert(xpos).toFixed(0) + " nm" )
              .attr("x", 15)
              .attr("y", 15)
              .attr("text-anchor", "start");
          }
        function mouseout() {
            focusText.style("opacity", 0);
        }
    }

    // setup brushing
    var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart);               // Each time the brush selection changes, trigger the 'updateChart' function

    // Add the brushing
    if (isFirefox)
    {
        // brushing doesn't work on firefox... notify
        if (doNotify)
        {
          window.alert("Warning: Some iSpec functions (e.g. zooming) don't work on firefox. If you know why, please tell me!")
          doNotify = false;
        }
    } else
    {
      svg.append("g")
          .attr("class", "brush")
          .call(brush);
      var idleTimeout;
      function idled() { idleTimeout = null; } // A function that set idleTimeOut to null
    }

    function updateChart() { // calculate new boundaries based on brush
        extent = d3.event.selection; // get the selected boundaries?
        if(!extent){ // If no selection, back to initial coordinate.
          if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            //x.domain([4,8])
          } else { // Otherwise, update X axis domain
            x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
            y.domain(d3.extent(xy_all, function(d) { // calculate y range
              if (d.x >= x.invert(extent[0]) & d.x <= x.invert(extent[1]) ){ // check range
                return d.y;}
              }).map(function(num,idx){ return num + 0.2 * idx - 0.1 })) // add padding of 0.05 to top and bottom of range
              svg.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

        // Update axis and line position
        rescale(svg, x, y, 1000 );
    }

    // If user double click, reinitialize the chart
    function resetView()
    {
      // check new ranges
      if (add_range_selectors) {
          range = $("div.checks input[type=radio]:checked")[0].id; // get range
      }

      x.domain(ranges[range]) // reset x range
      y.domain(d3.extent(xy_all, function(d) { // reset y range
            if (d.x >= ranges[range][0] & d.x <= ranges[range][1]) { return d.y; } // check range
          }).map(function(num,idx){ return num + 0.2 * idx - 0.1 })) // add padding of 0.05 to top and bottom of range
      xAxis.transition().duration(1000).call(d3.axisBottom(x));
      rescale(svg, x, y, 1000 );
    }
    svg.on("dblclick", resetView);

    // add checkboxes for ranges
    if (add_range_selectors)
    {
        var checks = d3.select(parent).append("div").attr('class','checks');
        Object.keys(ranges).forEach(
            function( key, index ) {
                var chk = checks.append("span").append("input")
                    .attr("name","bands")
                    .attr("type","radio")
                    .attr("id",key);
                if (key == range) {chk.attr("checked",true)} // check default
                checks.append("span").html(function(d){ return key + '&nbsp &nbsp' } ); // add name text
            }  );
        checks.on("change", resetView );
    }
}

// update all positions based on passed svg object, and d3 axes.
function rescale(svg, x, y, t=1000)
{

  // todo - change transition here to work on x-axis for smoother sliding
  xAxis.transition().duration(1000).call(d3.axisBottom(x));
  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  d3.selectAll('.line')
  .transition()
  .duration(t)
  .attr("d", d3.line().x(function(d) { return x(d.x) })
                      .y(function(d) { return y(d.y) }) );
}

function clear_spectra(parent)
{
  d3.select(parent).select('#svgplot').remove();
  d3.select(parent).selectAll('.checks').remove();
}
