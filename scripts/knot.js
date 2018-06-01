"use strict";

// TODO
// use lines for lines and cruves for curevs --- then can tiller hanson only when necessary
// 

var debuggingMode = false;
var debuggingPaths = [];

function Knot(drawing) {

	if (debuggingMode) {
		for (var path of debuggingPaths) {
			path.remove();
		}
	}
	
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

	function setBezierStartPoints(direction, bezDistance) {
		var backwards = !(targetNode.sameNode(currentLine.endNode));
		bezierPoints[0] = currentLine.crossingPoint.coords;
		bezierPoints[1] = currentLine.crossingPoint.controlPoint(direction, backwards, bezDistance);
	    
		if (direction === "R") {
			currentLine.crossingPoint.crossedOverOut = true;
		} else {
			currentLine.crossingPoint.crossedUnderOut = true;
		}
	}

	function compareByAngle(lineA, lineB) {
	  if (lineA.angleOutFrom(targetNode) < lineB.angleOutFrom(targetNode)) {
		return -1;
	  } else {
		return 1;
	  }
	}

	function setBezierEndPoints(direction, bezDistance) {
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
		bezierPoints[3] = nextLine.crossingPoint.coords;
        var backwards = targetNode.sameNode(nextLine.endNode);
        bezierPoints[2] = nextLine.crossingPoint.controlPoint(direction === "R" ? "L" : "R", !backwards, bezDistance);
		
		if (direction === "L") {
			nextLine.crossingPoint.crossedOverIn = true;
		} else {
			nextLine.crossingPoint.crossedUnderIn = true;
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

	var underToOvers = [];
	var overToUnders = [];

	while (drawing.frame.lines.some(uncrossed)) {
		// select first line - any line where CP is uncrossed in either R or L direction
		for (var line of drawing.frame.lines) {
			if (uncrossed(line)) {
				currentLine = line;
				break;
			}
		}
		// choose direction
		// if already crossed under, then choose R to do cross overlap
		// --> L here bc. switched in below while loop
		if (line.crossingPoint.crossed("L")) {
			direction = "L";
		// otherwise, it must not be crossed under yet, so choose L to do cross under
		// --> R here bc. switched in below while loop
		} else {
			direction = "R";
		}
		// could start going in either direction, but just go towards endNode of line
		var targetNode = currentLine.endNode; 
	

		while (true) {
			direction = (direction === "R" ? "L" : "R");
			roundabout = drawing.frame.linesOutFrom(targetNode);
			
			function intersections(path) {
				var startPoint = currentLine.crossingPoint.coords; 
				var endPoint = nextLine.crossingPoint.coords;
				var framePath = `M${startPoint[0]} ${startPoint[1]} L${targetNode.x} ${targetNode.y} L${endPoint[0]} ${endPoint[1]}`;
				var intersects = Snap.path.intersection(path, framePath);
				// remove any that are extremely close to start or end points
				return intersects.filter(function(intersect) {
					var xStart = Math.abs(intersect.x - startPoint[0]) < 0.1;
					var xEnd = Math.abs(intersect.x - endPoint[0]) < 0.1;
					var yStart = Math.abs(intersect.y - startPoint[1]) < 0.1;
					var yEnd = Math.abs(intersect.y - endPoint[1]) < 0.1;
					return !((xStart && yStart) || (xEnd && yEnd));
				});
			}

			var bezDistance = config.bezierDistance;
			// start smaller?? ...
			// but this currently leads to hanging / infinite loop somehow ??


			// start with small bezierDistance...
			// increase until does not intersect any lines of the frame...
			var path1;
			for (var i = 1; i < 50; i++) {
				setBezierStartPoints(direction, bezDistance);
				setBezierEndPoints(direction, bezDistance);
				path1 = this.bezString(...bezierPoints);
				if (intersections(path1).length === 0) {
					break;
				} else {
					bezDistance *= 1.1;
				}

			}

			if (debuggingMode) {
				debuggingPaths.push(drawing.surface.path(path1).attr({
					stroke: "pink",
					strokeWidth: 2,
					fill: "none"
				}));		
			} else {
				if (direction === "L") {
					underToOvers.push(this.bezString(...bezierPoints));
				} else {
					overToUnders.push(this.bezString(...bezierPoints));
				}	
			}

			currentLine = nextLine;
			lastTraversedNode = targetNode;
			// set new targetNode
			if (currentLine.startNode.sameNode(lastTraversedNode)) {
				targetNode = currentLine.endNode;
			} else {
				targetNode = currentLine.startNode;
			}
			if (currentLine.crossingPoint.crossed(direction === "R" ? "L" : "R")) {
				break;
			}

		}
		if (debuggingMode)break;
	}

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

	if (!debuggingMode) {
		drawUnders();
		drawMasks();
		addMaskCPcrosses();
		drawOvers();
		addCPcrosses();
	}

	drawing.frame.remove();
	drawing.frame.draw();
	drawing.stopDrawingFrame();
}