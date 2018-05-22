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


    this.drawKnot = function() {
        var bezierPoints = [[], [], [], []];

        function setBezierStartPoints(line, direction) {
            var cpBoxCoords = line.crossingPointBoxCoords();
            bezierPoints[0] = Mouse.pixelCoords(cpBoxCoords);
            drawing.surface.circle(...bezierPoints[0], 5);
            var a = config.bezierDistance * Math.cos(Math.PI / 4);
            var b = config.bezierDistance * Math.sin(Math.PI / 4);
            var yStep = a * Math.cos(line.angle());
            var xStep = a * Math.sin(line.angle());
            if (direction === "R") {
                var orthogVector = [-line.vector()[1], line.vector()[0]];    
            } else if (direction === "L") {
                var orthogVector = [line.vector()[1], -line.vector()[0]];    
            }
             
            var orthogLength = orthogVector.map(i => i**2).reduce((j, m) => j + m)**0.5;
            var normalizedOrthog = orthogVector.map(i => i / orthogLength);
            var xStep2 = normalizedOrthog[0] * config.bezierDistance / 2**0.5;
            var yStep2 = normalizedOrthog[1] * config.bezierDistance / 2**0.5;
            var bezier1 = [bezierPoints[0][0] + xStep + xStep2, bezierPoints[0][1] + yStep + yStep2];
            drawing.surface.circle(...bezier1, 5);
        }


    // until all crossing points fully crossed...
        // get random line to start with
        var currentLine = this.lines[Math.floor(Math.random() * this.lines.length)];
        // choose which node to go towards
        var targetNode = currentLine.endNode;
        // choose right or left
        var direction = "R";
        if (direction === "R") { 	// if right
            // set bezier points - CP center and at 45 deg clockwise
            setBezierStartPoints(currentLine, "R");
            // traverse frame
                // look at angles of lines coming from target nodes
                // follow last
                // if it has CP 
                    //- set end bezier points (take "2nd exit")
                // else, traverse to next line

        } else if (direction === "L") {
            setBezierStartPoints(currentLine, "L");

        }


	// else if left

		// set bezier points - CP center and at 45 deg anticlockwise

		// traverse frame
			// look at angles of lines coming from target nodes
			// follow last
			// if it has CP 
				//- set end bezier points (take "2nd exit")
			// else, traverse to next line
//

    };


    this.setLines();
    this.drawLines();
}

Frame.prototype = Grid.prototype;