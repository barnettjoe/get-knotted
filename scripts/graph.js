var Graph = (function() {
	var GRAPH_SPACING = 40;
	var GRAPH_LINE_WIDTH = 1;

	function drawLine(svgElement, x, y, direction, length) {
		var p = svgElement.path(`M${x} ${y}${direction} ${length}`);
		p.attr({
			fill: "none",
			stroke: "#eaeaea",
			strokeWidth: GRAPH_LINE_WIDTH
		});
		
	}

	function drawVerticalLines(svgElement) {
	  for (var x of linePositions("V")) {
		drawLine(svgElement, x, 0, "V", wrapper().offsetHeight)
	  }
	}

	function drawHorizontalLines(svgElement) {
	  for (var y of linePositions("H")) {
		drawLine(svgElement, 0, y, "H", wrapper().offsetWidth)
	  }
	}

	function linePositions(direction) {
	  var arr = [];
	  for (var i = GRAPH_LINE_WIDTH / 2; i < wrapper()[direction === "V" ? "offsetWidth" : "offsetHeight"]; i += GRAPH_SPACING) {
		arr.push(i);
	  }
	  return arr;
	}

	/* height and width of wrapper should both be multiple of GRAPH_SPACING */
	function resizeWrapper() {
	  var initialWidth = wrapper().offsetWidth;
	  var initialHeight = wrapper().offsetHeight;
	  var newWidth = Math.floor(initialWidth / GRAPH_SPACING) * GRAPH_SPACING;
	  var newHeight = Math.floor(initialHeight / GRAPH_SPACING) * GRAPH_SPACING;
	  document.getElementById("surface").style.width = `${newWidth + GRAPH_LINE_WIDTH}px`;
	  document.getElementById("surface").style.height = `${newHeight + GRAPH_LINE_WIDTH}px`;
	  console.log("resizied!");
	}

	function wrapper() {
	  return document.getElementById('wrapper');
	}

	function drawGraph(svgElement) {
	  resizeWrapper();
	  drawVerticalLines(svgElement);
	  drawHorizontalLines(svgElement);
	}

  	window.addEventListener('resize', function() { Graph.drawGraph(surface) } );

	return {
		GRAPH_SPACING: GRAPH_SPACING,
		GRAPH_LINE_WIDTH: GRAPH_LINE_WIDTH,
		drawGraph: drawGraph,	
	};
})();