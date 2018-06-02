"use strict";

// TODO
// use lines for lines and curves for curves --- then can tiller hanson only when necessary
// 

function Knot(drawing) {
	var bezierPoints = [[], [], [], []];
	var targetNode;
	var startNode;
	var currentLine;
	var roundabout;
	var nextLine;
	var lastTraversedNode;
	var direction;
	var group = drawing.surface.g();
	
	this.drawing = drawing;

	this.remove = function() {
		group.remove();
	}

	this.bezString = function(p0, p1, p2, p3) {
	  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
	};

	function logCrossing(direction) {
		if (direction === "R") {
			currentLine.crossingPoint.crossedRight = true;
		} else {
			currentLine.crossingPoint.crossedLeft = true;
		}
	}

	function compareByAngle(lineA, lineB) {
	  if (lineA.angleOutFrom(targetNode) < lineB.angleOutFrom(targetNode)) {
		return -1;
	  } else {
		return 1;
	  }
	}

	function getNextLine(direction) {
		roundabout = drawing.frame.linesOutFrom(targetNode);
		var orderedLinesOut = roundabout.slice().sort(compareByAngle);
		var inIndex;
		if (direction === "R") { // wall is on left...
			// pad out list with first element to allow going all way thru to start again
			orderedLinesOut.push(orderedLinesOut[0]);
			// get index of currentline in orderedLinesOut
			inIndex = orderedLinesOut.indexOf(currentLine);

			// next line is first one where angle is > currentLine
			return orderedLinesOut[inIndex + 1];
		} else {
			//orderedLinesOut.unshift(orderedLinesOut[orderedLinesOut.length - 1]);
			// get index of currentline in orderedLinesOut
			inIndex = orderedLinesOut.indexOf(currentLine);
			// next line is first one where angle is > currentLine
			return orderedLinesOut[inIndex - 1] || orderedLinesOut[orderedLinesOut.length - 1];
		}
	}

	function addCPcrosses() {
		for (var line of drawing.frame.lines) {
			var length = config.knot.strokeWidth;
			var crossCenter = line.crossingPoint.coords;
			var startPoint = [crossCenter[0] - length / 2, crossCenter[1]];
			var endPoint = [startPoint[0] + length, startPoint[1]]
			var cross1angle = 180 * (line.angle({reverse: false}) + Math.PI / 4) / Math.PI;
			var cross2angle = 180 * (line.angle({reverse: false}) - Math.PI / 4) / Math.PI;

			var cross1 = drawing.surface.line(...startPoint, ...endPoint).attr({
				stroke: "black",
				strokeWidth: 1
			});

			var cross2 = drawing.surface.line(...startPoint, ...endPoint).attr({
				stroke: "black",
				strokeWidth: 1
			});

			cross1.transform(`r${cross1angle}, ${crossCenter[0]}, ${crossCenter[1]}`);
			cross2.transform(`r${cross2angle}, ${crossCenter[0]}, ${crossCenter[1]}`);
			group.add(cross1);
			group.add(cross2);
		}
	}

	function addMaskCPcrosses() {
		for (var line of drawing.frame.lines) {
			var length = config.mask.strokeWidth - 0.5; // 0.5 adjustment to avoid tiny visible white bump 
			var crossCenter = line.crossingPoint.coords;
			var startPoint = [crossCenter[0] - length / 2, crossCenter[1]];
			var endPoint = [startPoint[0] + length, startPoint[1]]
			var cross1angle = 180 * (line.angle({reverse: false}) + Math.PI / 4) / Math.PI;
			var cross2angle = 180 * (line.angle({reverse: false}) - Math.PI / 4) / Math.PI;

			var cross1 = drawing.surface.line(...startPoint, ...endPoint).attr({
				stroke: "white",
				strokeWidth: 1
			});

			var cross2 = drawing.surface.line(...startPoint, ...endPoint).attr({
				stroke: "white",
				strokeWidth: 1
			});

			cross1.transform(`r${cross1angle}, ${crossCenter[0]}, ${crossCenter[1]}`);
			cross2.transform(`r${cross2angle}, ${crossCenter[0]}, ${crossCenter[1]}`);
			group.add(cross1);
			group.add(cross2);
		}
	}


	function uncrossed(line) {
		return !line.crossingPoint.fullyCrossed();
	}

	// each strand is one "piece of string" of the knot
	var strands = [];

	var underToOvers = [];
	var overToUnders = [];



	while (drawing.frame.lines.some(uncrossed)) {
		// on each iteration of this loop we determine the crossingpoints through which a single strand will pass
		var strand = [];

		// select first line - any line where CP is uncrossed in either R or L direction
		for (var line of drawing.frame.lines) {
			if (uncrossed(line)) {
				currentLine = line;
				break;
			}
		}
		// choose direction
		direction = line.crossingPoint.uncrossedDirection();
		// could start going in either direction, but just go towards endNode of line
		var targetNode = currentLine.endNode; 


		// add first point
		strand.push(currentLine.crossingPoint.coords);
		logCrossing(direction);

		// in the below while loop we add all the crossingpoints through which our strand passes
		while (true) {
			// move onto next line 			
			currentLine = getNextLine(direction);
			
			var oppositeDirection = (direction === "R" ? "L" : "R");
			strand.push(currentLine.crossingPoint.coords);
			logCrossing(oppositeDirection);		

			// 
			//var paths = (direction === "L" ? underToOvers : overToUnders);
			//paths.push(this.bezString(...bezierPoints));

			// set new targetNode
			if (currentLine.startNode.sameNode(targetNode)) {
				targetNode = currentLine.endNode;
			} else {
				targetNode = currentLine.startNode;
			}
			if (getNextLine(oppositeDirection).crossingPoint.crossed(direction)) {
				break;
			}
			direction = oppositeDirection;
		}
		strands.push(strand);
	}

	for (var strand of strands) {
		var contour = new Contour(strand);
		for (var pathString of contour.paths) {
			var bez = drawing.surface.path(pathString);
			group.add(bez);
			bez.attr({
				stroke: "pink",
				strokeWidth: 5,
				fill: "none"
			});
		}
	};

	function clipToFirstHalf(element) {
		element.attr({
			strokeDasharray:[(element.getTotalLength() / 2 + config.overlap), element.getTotalLength() / 2  - config.overlap],
		});
	}

	function clipToSecondHalf(element) {
	element.attr({
		strokeDasharray:[(element.getTotalLength() / 2 + config.overlap), element.getTotalLength() / 2  - config.overlap],
		strokeDashoffset: element.getTotalLength() / 2 + config.overlap,
	});
	}

	function drawUnders() {
		for (var pathStr of underToOvers) {
			var section = drawing.surface.path(pathStr);
			section.attr(config.knot);
			clipToFirstHalf(section);
			group.add(section);
		}

		for (var pathStr of overToUnders) {
			var section = drawing.surface.path(pathStr);
			section.attr(config.knot);	
			clipToSecondHalf(section);
			group.add(section);
		}	
	}

	function drawMasks() {
		for (var pathStr of overToUnders) {
			var mask = drawing.surface.path(pathStr);
			mask.attr(config.mask);	
			mask.attr({
				//strokeDasharray:[(mask.getTotalLength() / 2 + config.overlap), mask.getTotalLength() / 2  - config.overlap],
				strokeDasharray: [config.knot.strokeWidth, 1000]
			});
			group.add(mask);
		}

		for (var pathStr of underToOvers) {
			var mask = drawing.surface.path(pathStr);
			mask.attr(config.mask);	
			mask.attr({
				strokeDasharray: [config.knot.strokeWidth, 1000],
				//strokeDasharray: [config.knot.strokeWidth, 1000],
				strokeDashoffset: (config.knot.strokeWidth - mask.getTotalLength())
			});
			group.add(mask);
		}
	}

	function drawOvers() {
		for (var pathStr of overToUnders) {
			var section = drawing.surface.path(pathStr);
			section.attr(config.knot);	
			clipToFirstHalf(section);
			group.add(section);
		}

		for (var pathStr of underToOvers) {
			var section = drawing.surface.path(pathStr);
			section.attr(config.knot);	
			clipToSecondHalf(section);
			group.add(section);
		}
	}

	drawUnders();
	drawMasks();
	addMaskCPcrosses();
	drawOvers();
	addCPcrosses();
	drawing.frame.remove();
	drawing.frame.draw();
	drawing.stopDrawingFrame();
}

function Contour(points) {
	var arr = [4, 1];
	for (var i = 3; i < points.length; i++) {
		arr.push(0);
	}
	arr.push(1);
	arr = arr.concat(arr);
	var matrix = [];
	for (var i = 0; i < points.length; i++) {
		var row = arr.slice(points.length - i, 2 * points.length - i);
		matrix.push(row);
	}

	var xVector = points.map(coord => 6 * coord[0]);
	var yVector = points.map(coord => 6 * coord[1]);

	var scaffoldOrdinates = numeric.solve(matrix, yVector);
	var scaffoldAbscissae = numeric.solve(matrix, xVector);

	function b(n, i) {
		var arr = (i === 0 ? scaffoldAbscissae : scaffoldOrdinates);
		return ((2 * arr[n] + (arr[n + 1] || arr[0])) / 3);
	}

	function bx(n) {
		return b(n, 0);
	}

	function by(n) {
		return b(n, 1);
	}

	function c(n, i) {
		var arr = (i === 0 ? scaffoldAbscissae : scaffoldOrdinates);
		return ((arr[n] + 2 * (arr[n + 1] || arr[0])) / 3);
	}

	function cx(n) {
		return c(n, 0);
	}

	function cy(n) {
		return c(n, 1);
	}

	function bezPolygon(n) {
		var nextN = (points[n + 1] ? n + 1 : 0)
		return [[points[n][0], points[n][1]], [bx(n), by(n)], [cx(n), cy(n)], [points[nextN][0], points[nextN][1]]]
	}

	function bezString(p0, p1, p2, p3) {
		return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
	}

	var polygons = [];

	for (var i = 0; i < points.length; i++) {
		polygons.push(bezPolygon(i));
	}

	this.paths = polygons.map(function(polygon) {
			return bezString(...polygon);
		});  
}