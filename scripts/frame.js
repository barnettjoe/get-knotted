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

	this.attachedNodes = function(nodeBoxCoords) {
		var idx;
		for(var i = 0; i < nodes.length; i++) {
			if (nodes[i][0] === nodeBoxCoords[0] && nodes[i][1] === nodeBoxCoords[1]) {
				idx = i;
			}
		};
		return this.adjacencyList[idx].map(i => nodes[i]);
	};

	this.linesOutFrom = function(nodeBoxCoords) {
		function includeNode(line) {
			var startMatch = line.startNode[0] === nodeBoxCoords[0] && line.startNode[1] === nodeBoxCoords[1];
			var endMatch = line.endNode[0] === nodeBoxCoords[0] && line.endNode[1] === nodeBoxCoords[1];
			return startMatch || endMatch;
		}
		return this.lines.filter(includeNode);
	};

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
        var targetNode;
        var startNode;
        var currentLine;
        var roundabout;
		var a;
		var nextLine;
		var lastTraversedNode;

		function rotate(cx, cy, x, y, angle) {
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);
			var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
			var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
			return [nx, ny];
		}

        function setBezierStartPoints(direction) {
        	var lineAngle;
        	var vector;
            var cpBoxCoords = currentLine.crossingPointBoxCoords();
			var backwards = targetNode[0] !== currentLine.endNode[0] || targetNode[1] !== currentLine.endNode[1];
            bezierPoints[0] = Mouse.pixelCoords(cpBoxCoords);
            //drawing.surface.circle(...bezierPoints[0], 5);

			if (backwards) {
				lineAngle = currentLine.angle({reverse: true});
				vector = currentLine.vector().map(i => -i);
			} else {
				lineAngle = currentLine.angle({reverse: false});
				vector = currentLine.vector();
			}

            var vectorLength = vector.map(i => i**2).reduce((j, m) => j + m)**0.5;
			var normVect = vector.map(i => i / vectorLength);
	        var xStep = normVect[0] * config.bezierDistance;
            var yStep = normVect[1] * config.bezierDistance;
			var initialPosition = [bezierPoints[0][0] + xStep, bezierPoints[0][1] + yStep];

			if (direction === "L") {
				bezierPoints[1] = rotate(...bezierPoints[0], ...initialPosition, Math.PI / 4);
			} else {
				bezierPoints[1] = rotate(...bezierPoints[0], ...initialPosition, -Math.PI / 4);
			}

           // drawing.surface.circle(...bezierPoints[1], 5);
        }

		function compareByAngle(lineA, lineB) {
		  if (lineA.angleOutFrom(targetNode) < lineB.angleOutFrom(targetNode)) {
			return -1;
		  } else {
			return 1;
		  }
		}

		function setBezierEndPoints(direction) {
			var orderedLinesOut = roundabout.sort(compareByAngle);
			var inIndex;
			if (direction === "R") { // wall is on left...
				// pad out list with first element to allow going all way thru to start again
				orderedLinesOut.push(orderedLinesOut[0]);
				// get index of currentline in orderedLinesOut
				inIndex = orderedLinesOut.indexOf(currentLine);

				// next line is first one where angle is > currentLine
				nextLine = orderedLinesOut[inIndex + 1];
			} else {
				//orderedLinesOut.unshift(orderedLinesOut[orderedLinesOut.length - 1]);
				// get index of currentline in orderedLinesOut
				inIndex = orderedLinesOut.indexOf(currentLine);

				// next line is first one where angle is > currentLine
				nextLine = orderedLinesOut[inIndex - 1] || orderedLinesOut[orderedLinesOut.length - 1];
			}


			bezierPoints[3] = Mouse.pixelCoords(nextLine.crossingPointBoxCoords());
			//drawing.surface.circle(...bezierPoints[3], 5);

			var vector = nextLine.vector();

			// reverse if necessary
			if (targetNode[0] === nextLine.endNode[0] && targetNode[1] === nextLine.endNode[1]) {
				vector = vector.map(i => -i);
			}

			var vectorLength = vector.map(i => i**2).reduce((j, m) => j + m)**0.5;
			var normalized = vector.map(i => i / vectorLength);

			var initialPosition = [bezierPoints[3][0] - normalized[0] * config.bezierDistance, bezierPoints[3][1] - normalized[1] * config.bezierDistance];


			if (direction === "R") {
				bezierPoints[2] = rotate(...bezierPoints[3], ...initialPosition, Math.PI / 4);

			} else {
				bezierPoints[2] = rotate(...bezierPoints[3], ...initialPosition, -Math.PI / 4);
			}

			//drawing.surface.circle(...bezierPoints[2], 5);
		}

			
		var direction = "L";
		// until all crossing points fully crossed...
		
		currentLine = this.lines[Math.floor(Math.random() * this.lines.length)];
		// choose which node to go towards
		targetNode = currentLine.endNode; // BUG HERE?

		for (var i = 0; i < 10; i++) {
			direction = (direction === "R" ? "L" : "R");
			roundabout = this.linesOutFrom(targetNode);
			setBezierStartPoints(direction);
			setBezierEndPoints(direction);
			var section = drawing.surface.path(`M${bezierPoints[0][0]} ${bezierPoints[0][1]} C ${bezierPoints[1][0]} ${bezierPoints[1][1]}, ${bezierPoints[2][0]} ${bezierPoints[2][1]}, ${bezierPoints[3][0]}, ${bezierPoints[3][1]}`)
			section.attr(config.knot);	
			currentLine = nextLine;
			lastTraversedNode = targetNode;
			// set new targetNode
			if (currentLine.startNode[0] === lastTraversedNode[0] && currentLine.startNode[1] === lastTraversedNode[1]) {
				targetNode = currentLine.endNode;
			} else {
				targetNode = currentLine.startNode;
			}
		
		}

	}

	this.setLines();
	this.drawLines();
};

Frame.prototype = Grid.prototype;
