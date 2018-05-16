"use strict";

function Drawing() {
    var initialBox, finalBox;
    var graphArea = document.getElementById("surface");
    var drawing = this;

    var drawBox = function() {
        // remove any extant frames
        drawing.frame && drawing.frame.remove(); 
        // make 1x1 frame
        drawing.frame = new Frame(initialBox, finalBox, drawing);
        // add the listener for mouse movement
        graphArea.addEventListener("mousemove", moveListener);
    };
   
    // define listener for mousedown
    var downListener = function() {
        // record position of mousedown
        initialBox = finalBox = Mouse.rowAndCol(event, this.graph); 
        // if the box containing the click was within the graph area, then draw a box
        Mouse.doIfInGraph(initialBox, drawBox);   
    };  

    // define listener for mouse movement
    var moveListener = function() {
        finalBox = Mouse.rowAndCol(event, drawing.graph);
        // doIfInGraph wrapper here prevents drawing of frames beyond boundaries of the graph
        Mouse.doIfInGraph(finalBox, function() {
            drawing.frame && drawing.frame.remove(); 
            drawing.frame = new Frame(initialBox, finalBox, drawing);
        });   
    };

    // define listener for mouseup
    var upListener = function() {
        graphArea.removeEventListener("mousemove", moveListener);
    };
    
    this.addUserFrame = function() {
        // listen for mousedown
        graphArea.addEventListener("mousedown", downListener)
        // listener for mouseup is attached to the whole document (not just the graphArea)
        // - this prevents the "sticky mouse" bug
        document.addEventListener("mouseup", upListener);
    };
}