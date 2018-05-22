'use strict';

function Frame(initialBox, finalBox, drawing) {
    var nodes = [];
    var leftmost   = Math.min(initialBox[0], finalBox[0]);
    var topmost    = Math.min(initialBox[1], finalBox[1]);
    var rightmost  = Math.max(initialBox[0], finalBox[0]);
    var bottommost = Math.max(initialBox[1], finalBox[1]);

    Grid.call(this, {
        drawing: drawing,
        startCol: leftmost,
        startRow: topmost,
        cols: rightmost - leftmost + 1,
        rows: bottommost - topmost + 1,
        style: config.frame
    });

    this.showCrossingPoints = function() {
        for(var line of this.lines) {
         line.drawCrossingPoints();
        };
    };

    this.showNodes = function() {
        for(var n of nodes) {
            drawing.surface.circle(...Mouse.pixelCoords(n), config.nodeStyle.radius).attr(config.nodeStyle);
        };
    };

    this.setNodes = function() {
        for (var x = leftmost; x <= rightmost + 1; x++) {
            for (var y = topmost; y <= bottommost + 1; y++) {
                nodes.push([x, y]);
            }
        }
    };

    this.setNodes();
}

Frame.prototype = Grid.prototype;
