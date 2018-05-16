"use strict";

function Drawing() {
    var initialBox, finalBox, moveListener;
    this.graphArea = document.getElementById("surface");
    var drawing = this;
    function drawBox() {
        drawing.frame && drawing.frame.remove(); 

        drawing.frame = new Frame("1x1", initialBox, finalBox, drawing);
        // and add a listener for mouse movement

        moveListener = function() {
            finalBox = Mouse.rowAndCol(event, drawing.graph);
            // doIfInGraph wrapper here prevents drawing of frames beyond boundaries of the graph
            Mouse.doIfInGraph(finalBox, function() {
                drawing.frame && drawing.frame.remove(); 
                drawing.frame = new Frame("not1x1", initialBox, finalBox, drawing);
            });   
        };

        drawing.graphArea.addEventListener("mousemove", moveListener);
    }

    this.addUserFrame = function() {


        // listen for mousedown
        drawing.graphArea.addEventListener("mousedown", function() {
            // record position of mousedown
            initialBox = finalBox = Mouse.rowAndCol(event, this.graph); 
            // if click was within the graph area...
            Mouse.doIfInGraph(initialBox, drawBox.bind(this));   
        });  

        // listener for mouseup is attached to the whole document (not just the graphArea)
        // - this prevents the "sticky mouse" bug
        document.addEventListener("mouseup", function() {
            drawing.graphArea.removeEventListener("mousemove", moveListener);
        });
    };
}

// IIFE to avoid globals
(function() {
    var drawing = new Drawing();

    drawing.surface = Snap("#surface");
    
    drawing.graph = new Graph(drawing);

    // let user draw a grid 
    drawing.addUserFrame(); 
})();

