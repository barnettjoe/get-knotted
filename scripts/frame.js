"use strict";

function Frame(type, initialBox, finalBox, drawing) {
    var options;

    if (type === "1x1") {
        options = {
            drawing: drawing,
            startCol: initialBox[0],
            startRow: initialBox[1],
            cols: 1,
            rows: 1,
            style: config.frame
        };
    } else {
        var leftmost   = Math.min(initialBox[0], finalBox[0]);
        var topmost    = Math.min(initialBox[1], finalBox[1]);
        var rightmost  = Math.max(initialBox[0], finalBox[0]);
        var bottommost = Math.max(initialBox[1], finalBox[1]);   
        options = {
            drawing: drawing,
            startCol:  leftmost,
            startRow: topmost,
            cols: rightmost - leftmost + 1,
            rows: bottommost - topmost + 1,
            style: config.frame
        };
    }
  	Grid.call(this, options);
}

Frame.prototype = Grid.prototype;