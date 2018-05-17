'use strict';

// IIFE to avoid globals
(function() {
	var drawing = new Drawing();

    drawing.surface = Snap('#surface');

    drawing.graph = new Graph(drawing);

    // let user draw a grid
    drawing.addUserFrame();
})();

