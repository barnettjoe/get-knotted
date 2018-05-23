'use strict';

function Drawing() {
    var initialBox;
    var finalBox;
    var graphArea = document.getElementById('surface');
    var drawing = this;
     
    this.drawKnot = function() {
        this.knot = new Knot(this.frame, this);
    }

    var drawBox = function() {
        // remove any extant frames
        if (drawing.frame) drawing.frame.remove();
        // make 1x1 frame
        drawing.frame = new Frame(initialBox, finalBox, drawing);
        // add the listener for mouse movement
        graphArea.addEventListener('mousemove', moveListener);
    };

    // define listener for mousedown
    var downListener = function() {
        // record position of mousedown
        initialBox = finalBox = Mouse.rowAndCol(event);
        // if the box containing the click was within the graph area...
        // ... then draw a box
        Mouse.doIfInGraph(initialBox, drawBox);
    };

    // define listener for mouse movement
    var moveListener = function() {
        finalBox = Mouse.rowAndCol(event);
        // doIfInGraph wrapper here prevents drawn frames from extending...
        // ... beyond the boundaries of the graph
        Mouse.doIfInGraph(finalBox, function() {
            if (drawing.frame) drawing.frame.remove();
            drawing.frame = new Frame(initialBox, finalBox, drawing);
        });
    };

    // define listener for mouseup
    var upListener = function() {
        graphArea.removeEventListener('mousemove', moveListener);
    };

    this.addUserFrame = function() {
        // listen for mousedown
        graphArea.addEventListener('mousedown', downListener);
        // listener for mouseup is attached to the whole document...
        // (not just the graphArea)
        // This prevents the "sticky mouse" bug.
        document.addEventListener('mouseup', upListener);
    };
}
