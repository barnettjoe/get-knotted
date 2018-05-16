"use strict";

function Frame(initialBox, finalBox, drawing) {
    var leftmost   = Math.min(initialBox[0], finalBox[0]);
    var topmost    = Math.min(initialBox[1], finalBox[1]);
    var rightmost  = Math.max(initialBox[0], finalBox[0]);
    var bottommost = Math.max(initialBox[1], finalBox[1]);   

  	Grid.call(this, {
        drawing: drawing,
        startCol:  leftmost,
        startRow: topmost,
        cols: rightmost - leftmost + 1,
        rows: bottommost - topmost + 1,
        style: config.frame
    });
}

Frame.prototype = Grid.prototype;