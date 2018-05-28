'use strict';

// IIFE to avoid globals
(function() {
	var drawing = new Drawing();
	drawing.surface = Snap('#surface');
	
	function squareGrid() {
		// draw graph
		drawing.graph = new Graph(drawing);

		// let user draw a frame
		drawing.addUserFrame();
	}

	function freeform() {
		if (drawing.graph) drawing.graph.remove();

		//if (drawing.frame) drawing.frame.remove();
	/*
		document.getElementById("surface").addEventListener("click", function(event) {
			var node = drawing.surface.circle(...Mouse.relativeCoords(event), 10).attr(config.nodeStyle);
			var makePink = function() { node.attr({
				fill: "pink",
				stroke: "black"
			}) };
			var undoPink = function() { node.attr(config.nodeStyle) };
			node.hover(makePink, undoPink)

			node.drag();
			node.addEventListener("click", function(clickEvent) {
				document.getElementById("surface").addEventListener("move", function(moveEvent) {
					var line = drawing.surface.line(...Mouse.relativeCoords(clickEvent), ...Mouse.relativeCoords(moveEvent));
					line.attr({stroke: "black", strokeWidth: 10});
				});
			});
		});
		*/
	}

	// set up button to show nodes
	document.getElementById("nodes-button").addEventListener("click", function() {
	    // if user has drawn a frame, then show nodes
		if (drawing.frame) drawing.frame.showNodes();
	});

	// set up button to draw knot
	document.getElementById("knot-button").addEventListener("click", function() {
	    // if user has drawn a frame, then show nodes
		if (drawing.frame) drawing.drawKnot();
	});

	function setFrameType() {
		var frameType = document.querySelector('[name=frame-type]:checked').value;
		if (frameType === "square") {
			squareGrid();
		} else if (frameType === "freeform") {
			freeform();
		}
	}


	setFrameType();
	// add radio listener
	document.getElementById('frame-type').addEventListener("click", setFrameType)

})();

