var Grid = (function() {
	var GRID_SPACING = 40;
	var GRID_LINE_WIDTH = 1;

	function drawLine(svgElement, x, y, direction, length) {
		var p = svgElement.path(`M${x} ${y}${direction} ${length}`);
		p.attr({
			fill: "none",
			stroke: "lightgrey",
			strokeWidth: GRID_LINE_WIDTH
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
	  for (var i = GRID_LINE_WIDTH / 2; i < wrapper()[direction === "V" ? "offsetWidth" : "offsetHeight"]; i += GRID_SPACING) {
		arr.push(i);
	  }
	  return arr;
	}

	/* height and width of wrapper should both be multiple of GRID_SPACING */
	function resizeWrapper() {
	  var initialWidth = wrapper().offsetWidth;
	  var initialHeight = wrapper().offsetHeight;
	  var newWidth = Math.floor(initialWidth / GRID_SPACING) * GRID_SPACING;
	  var newHeight = Math.floor(initialHeight / GRID_SPACING) * GRID_SPACING;
	  document.getElementById("surface").style.width = `${newWidth + GRID_LINE_WIDTH}px`;
	  document.getElementById("surface").style.height = `${newHeight + GRID_LINE_WIDTH}px`;
	}

	function wrapper() {
	  return document.getElementById('wrapper');
	}

	function drawGrid(svgElement) {
	  resizeWrapper();
	  drawVerticalLines(svgElement);
	  drawHorizontalLines(svgElement);
	}

	return {
		GRID_SPACING: GRID_SPACING,
		GRID_LINE_WIDTH: GRID_LINE_WIDTH,
		drawGrid: drawGrid,	
	};
})();

export { Grid }
