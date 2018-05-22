'use strict';

function Frame(initialBox, finalBox, drawing) {
    var nodes = [];
    this.adjacencyList = [];
    this.lines = [];
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

    this.setLines = function() {
      for(var i = 0; i < nodes.length; i++) {
        this.adjacencyList.push([]);
        // push indices of adjacent nodes to this new subarray
        for(var j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            var xDiff = Math.abs(node[0] - nodes[i][0]);
            var yDiff = Math.abs(node[1] - nodes[i][1]);
            var diffs = [xDiff, yDiff];
            if (diffs.includes(1) && diffs.includes(0)) {
              this.adjacencyList[this.adjacencyList.length - 1].push(j);
            };
        };
      };  
    };

    this.drawLines = function() {
        for (var i = 0; i < nodes.length; i++) {
            for (var j of this.adjacencyList[i]) {
                if (nodes[i] < nodes[j]) { // avoid drawing each line twice
                    this.lines.push(new Line(...nodes[i], ...nodes[j], config.frame, drawing));
                };
            };
        };
    };

    this.setLines();
    this.drawLines();
}

Frame.prototype = Grid.prototype;
