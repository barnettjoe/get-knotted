"use strict";

function Drawing() {
    this.graphArea = document.getElementById("surface");
    this.addUserFrame = function() {
        this.frame = new Frame(this);
    }
}

function Frame(drawing) {
    var createGrid = function() {
        this.grid.remove();
        var leftmost   = Math.min(this.initialBox[0], this.finalBox[0]);
        var topmost    = Math.min(this.initialBox[1], this.finalBox[1]);
        var rightmost  = Math.max(this.initialBox[0], this.finalBox[0]);
        var bottommost = Math.max(this.initialBox[1], this.finalBox[1]);
        this.grid = new Graph(drawing, leftmost, topmost, rightmost - leftmost + 1, bottommost - topmost + 1, config.frame);
    }
    
    this.createGrid = createGrid.bind(this);

    var moveListener = function() {
        this.finalBox = Mouse.rowAndCol(event, drawing.graph);

        // doIfInGraph wrapper here prevents drawing of frames beyond boundaries of the graph
        Mouse.doIfInGraph(this.finalBox, this.createGrid);   
    }
    
    this.moveListener = moveListener.bind(this);

    var make1x1 = function() {
        this.grid && this.grid.remove();
        // create 1x1 frame
        this.grid = new Graph(drawing, ...this.initialBox, 1, 1, config.frame);
        // and add a listener for mouse movement
        drawing.graphArea.addEventListener("mousemove", this.moveListener);
    };

    // listen for mousedown

    var downListener = function() {
            // record position of mousedown
            this.initialBox = Mouse.rowAndCol(event, drawing.graph); 
            // if click was within the graph area...
            Mouse.doIfInGraph(this.initialBox, make1x1.bind(this));   
        };

    var upListener = function() {
        drawing.graphArea.removeEventListener("mousemove", this.moveListener);
    };

    drawing.graphArea.addEventListener("mousedown", downListener.bind(this));  
    // listener for mouseup is attached to the whole document (not just the graphArea)
    // - this prevents the "sticky mouse" bug 
    document.addEventListener("mouseup", upListener.bind(this));
}