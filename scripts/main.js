"use strict";

// IIFE to avoid globals
(function() {
    function Drawing() {
        this.graphArea = document.getElementById("surface");
        this.addUserFrame = function() {
            this.frame = new Frame(this);
        }
    }

    var drawing = new Drawing();

    drawing.surface = Snap("#surface");
    
    drawing.graph = new Graph({
        drawing: drawing,
        startCol:  0,
        startRow: 0,
        cols: config.graphCols,
        rows: config.graphRows,
        style: config.graphLine
    });

    // let user draw a grid 
    drawing.addUserFrame(); 
})();

