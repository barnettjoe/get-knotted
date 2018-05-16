"use strict";

function Drawing() {
    this.graphArea = document.getElementById("surface");
    this.addUserFrame = function() {
        this.frame = new Frame(this);
    }
}

// IIFE to avoid globals
(function() {
    var drawing = new Drawing();

    drawing.surface = Snap("#surface");
    
    drawing.graph = new Graph(drawing);

    // let user draw a grid 
    drawing.addUserFrame(); 
})();

