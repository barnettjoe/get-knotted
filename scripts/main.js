"use strict";

// IIFE to avoid globals
(function() {
    var drawing = new Drawing();

    drawing.surface = Snap("#surface");
    drawing.graph = new Graph(drawing, 0, 0, config.graphCols, config.graphRows, config.graphLine);

    // let user draw a grid 
    drawing.addUserFrame(); 
})();

