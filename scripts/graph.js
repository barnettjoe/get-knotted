"use strict";

function GraphLine(surface, x, y, direction, length) {
	this.surface = surface;
	this.x = x;
	this.y = y;
	this.direction = direction;
	this.length = length;
	this.draw = function() {
					// eventually, I should incorporate snapObject methods (from Snap svg library) into my own classes...
					this.snapObject = this.surface.path(`M${this.x} ${this.y}${this.direction} ${this.length}`);
					this.snapObject.attr({
						stroke: config.GRAPH_LINE_COLOR,
						strokeWidth: config.GRAPH_LINE_WIDTH
					});
				};
}

var Graph = (function() {
	var horizontalLines = [];
	var verticalLines = [];

	function createLines(surface, direction) {
		var arr;
		var startCoords;
		var directionLetter;
		var limit;
		var length;

		if (direction === "vertical") {
			arr = verticalLines;
			limit = "offsetWidth";
			length = wrapper()["offsetHeight"];
			directionLetter = "V";
		} else if (direction === "horizontal") {
			arr = horizontalLines;
			limit = "offsetHeight";
			length = wrapper()["offsetWidth"];
			directionLetter = "H";
		}

		for (var i = config.GRAPH_LINE_WIDTH / 2; i < wrapper()[limit]; i += config.GRAPH_SPACING) {
			startCoords = (direction === "vertical" ? [i, 0] : [0, i]); 
			var line = new GraphLine(surface, ...startCoords, directionLetter, length); 
			arr.push(line);
		}
	}

	function drawVerticalLines(surface) {
		createLines(surface, "vertical");

		for (var line of verticalLines) {
			line.draw(surface);
		}
	}

	function drawHorizontalLines(surface) {
		createLines(surface, "horizontal");

		for (var line of horizontalLines) {
			line.draw(surface);
		}
	}

	/* height and width of wrapper should both be multiple of config.GRAPH_SPACING */
	function resizeWrapper() {
		var initialWidth = wrapper().offsetWidth;
		var initialHeight = wrapper().offsetHeight;
		var newWidth = Math.floor(initialWidth / config.GRAPH_SPACING) * config.GRAPH_SPACING;
		var newHeight = Math.floor(initialHeight / config.GRAPH_SPACING) * config.GRAPH_SPACING;
		document.getElementById("surface").style.width = `${newWidth + config.GRAPH_LINE_WIDTH}px`;
		document.getElementById("surface").style.height = `${newHeight + config.GRAPH_LINE_WIDTH}px`;
	}

	function wrapper() {
		return document.getElementById('wrapper');
	}

	function drawGraph(surface) {
		resizeWrapper();
		drawVerticalLines(surface);
		drawHorizontalLines(surface);
	}

  	window.addEventListener('resize', function() { Graph.drawGraph(surface) } );

	return {
		drawGraph: drawGraph,	
	};
})();