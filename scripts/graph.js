"use strict";

function GraphLine(x, y, direction, length) {
	// GraphLine is basically just a wrapper around the snapObject property
	this.snapObject = surface.path(`M${x} ${y}${direction} ${length}`);
	this.snapObject.attr(config.graphLine);
}

var Graph = (function() {
	var graphLines = {horizontal: [], vertical: []};

	function createHorizontalLines() {
		var	limit = "offsetHeight";
		var length = wrapper()["offsetWidth"];
		for (var i = config.graphLine.strokeWidth / 2; i < wrapper()[limit]; i += config.graph_spacing) {
			var line = new GraphLine(0, i, "H", length); 
			graphLines.horizontal.push(line);
		}
	}

	function createVerticalLines() {
		var	limit = "offsetWidth";
		var length = wrapper()["offsetHeight"];
		for (var i = config.graphLine.strokeWidth / 2; i < wrapper()[limit]; i += config.graph_spacing) {
			var line = new GraphLine(i, 0, "V", length); 
			graphLines.vertical.push(line);
		}
	}

	function wrapper() {
		return document.getElementById('wrapper');
	}

	function drawGraph() {
		createHorizontalLines();
		createVerticalLines();
	}

	return {
		drawGraph: drawGraph,
		graphLines: graphLines	
	};
})();