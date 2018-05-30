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
		
		function allNodesDraggable() {
			for (let node of drawing.frame.nodes) {
			  // add drag listener
			  node.snapObject.drag(onMove(node));
			}
		}

		if (drawing.graph) drawing.graph.remove();

		// this fn constructs listeners for nodes
		function onMove(node) {
			return function () {
				// change node position
				[node.x, node.y] = Mouse.relativeCoords(event);
				// re-draw whole frame
				drawing.frame.remove();
				drawing.frame.draw();
				// but now we have new snap objs...without listeners attached
				// so add listeners again
				allNodesDraggable();		
			};
		}
		allNodesDraggable();
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

