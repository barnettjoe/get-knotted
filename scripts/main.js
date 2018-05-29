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



		for (let node of drawing.frame.nodes) {
			node.HTMLobj.addEventListener("mousedown", function () {
				var moveListener = function () {
					[node.x, node.y] = Mouse.relativeCoords(event);
					drawing.frame.remove();
					//drawing.knot.remove();
					//drawing.knot.draw();
					drawing.frame.draw();
				};

				drawing.graphArea.addEventListener("mousemove", moveListener);
				drawing.graphArea.addEventListener("mouseup", function () {
					drawing.graphArea.removeEventListener("mousemove", moveListener)
				});
			})
		}
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

