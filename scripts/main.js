'use strict';

// IIFE to avoid globals
(function() {
	var drawing = new Drawing();

    drawing.surface = Snap('#surface');

	// draw graph
    drawing.graph = new Graph(drawing);

    // let user draw a frame
    drawing.addUserFrame();

	// set up button to show crossing points
	document.getElementById("crossing-points-button").addEventListener("click", function() {
	    // if user has drawn a frame, then show crossing points
		if (drawing.frame) drawing.frame.showCrossingPoints();
	});

	// set up button to show nodes
	document.getElementById("nodes-button").addEventListener("click", function() {
	    // if user has drawn a frame, then show nodes
		if (drawing.frame) drawing.frame.showNodes();
	});
	
})();

