"use strict";

// TODO
// use lines for lines and cruves for curevs --- then can tiller hanson only when necessary
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

	/// BOUNDING BOX LOGIC

	this.bezString = function(p0, p1, p2, p3) {
	  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
	};


	this.drawBox = function(a, b, c, d) {
		drawing.surface.line(...a, ...b).attr({stroke: "green", strokeWidth: 2});
		drawing.surface.line(...b, ...c).attr({stroke: "green", strokeWidth: 2});
		drawing.surface.line(...c, ...d).attr({stroke: "green", strokeWidth: 2});
		drawing.surface.line(...d, ...a).attr({stroke: "green", strokeWidth: 2});
	};

	this.tightBoundingBox = function(p0, p1, p2, p3) {
		var that = this;
		var angle;
		function alignBez(p0, p1, p2, p3) {
			 // translate to get p0 on x axis
			var translated = [p0, p1, p2, p3].map(coords => [coords[0], coords[1] + -p0[1]]);
			// now rotate so p3 is also on x axis
			var deltaX = translated[0][0];
			angle = -Math.atan(translated[3][1] / (translated[3][0] - deltaX)) || 0;
			return translated.map(coord => that.rotate(coord, translated[0], angle));
		}
		var alignedBoundingBox = this.boundingBox(...alignBez(p0, p1, p2, p3));
		var rotatedBoundingBox = alignedBoundingBox.map(point => this.rotate(point, [p0[0], 0], -angle));
		return rotatedBoundingBox.map(coord => [coord[0], coord[1] + p0[1]]);
	};


	this.boundingBox = function(p0, p1, p2, p3) {
		var extremeTs = [0, 1];
		extremeTs = extremeTs.concat(this.roots(p0, p1, p2, p3, "x"));
		extremeTs = extremeTs.concat(this.roots(p0, p1, p2, p3, "y"));
		var extremePoints = extremeTs.map(t => this.coords(p0, p1, p2, p3, t));
		function compareX(a, b) {
			if (a[0] < b[0]) {
				return -1;
			} else if (a[0] > b[0]) {
				return 1; 
			} else {
				return 0;
			}
		}

		function compareY(a, b) {
			if (a[1] < b[1]) {
		  		return -1;
			} else if (a[1] > b[1]) {
		 		 return 1; 
			} else {
		  		return 0;
			}
		}

		var sortedByX = extremePoints.sort(compareX); 
		var xMin = sortedByX[0][0];
		var xMax = sortedByX[sortedByX.length - 1][0];
		var sortedByY = extremePoints.sort(compareY);
		var yMin = sortedByY[0][1];
		var yMax = sortedByY[sortedByY.length - 1][1];

		var topLeft = [xMin, yMin];
		var topRight = [xMax, yMin];
		var bottomLeft = [xMin, yMax];
		var bottomRight = [xMax, yMax];
		return [topLeft, topRight, bottomRight, bottomLeft];
	};


	this.rotateAboutOrigin = function(point, angle) {
		var x = point[0];
		var y = point[1];
		var newX = x * Math.cos(angle) - y * Math.sin(angle);
		var newY = y * Math.cos(angle) + x * Math.sin(angle);
		return [newX, newY];
	};

	this.rotate = function(point, center, angle) {
		// first shift to origin
		var shiftedPoint = [point[0] - center[0], point[1] - center[1]];
		var rotated = this.rotateAboutOrigin(shiftedPoint, angle);
		return [rotated[0] + center[0], rotated[1] + center[1]];
	};

	this.roots = function(p0, p1, p2, p3, axis) {
		var results = [];
		var curve = new Bezier(...p0, ...p1, ...p2, ...p3);
		var extrema = curve.extrema();
		results = results.concat(extrema.x);
		results = results.concat(extrema.y);
		return [...new Set(results)]; 
	}; 

	this.coords = function(p0, p1, p2, p3, t) {
		var x = (1 - t)**3 * p0[0] + 3 * t * (1 - t)**2 * p1[0] + 3 * t**2 * (1 - t) * p2[0] + t**3 * p3[0];
		var y = (1 - t)**3 * p0[1] + 3 * t * (1 - t)**2 * p1[1] + 3 * t**2 * (1 - t) * p2[1] + t**3 * p3[1];
		return [x, y];
	};

	// END BOUNDING BOX LOGIC

	function setBezierStartPoints(direction) {
		var backwards = !(targetNode.sameNode(currentLine.endNode));
		bezierPoints[0] = currentLine.crossingPoint.coords;
		bezierPoints[1] = currentLine.crossingPoint.controlPoint(direction, backwards);
	    
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
		bezierPoints[3] = nextLine.crossingPoint.coords;
        var backwards = targetNode.sameNode(nextLine.endNode);
        bezierPoints[2] = nextLine.crossingPoint.controlPoint(direction === "R" ? "L" : "R", !backwards);
		
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
			
			// if straight line, just use a line.
			// else, start with small bezierDistance...
			// increase until does not intersect any lines of the frame...

			setBezierStartPoints(direction);
			setBezierEndPoints(direction);
			
			//-----------------------
			// DISPLAY BOUNDING BOX
			//------------------------


			this.drawBox(...this.tightBoundingBox(...bezierPoints));


			if (direction === "L") {
				underToOvers.push(`M${bezierPoints[0][0]} ${bezierPoints[0][1]} C ${bezierPoints[1][0]} ${bezierPoints[1][1]}, ${bezierPoints[2][0]} ${bezierPoints[2][1]}, ${bezierPoints[3][0]}, ${bezierPoints[3][1]}`);
			} else {
				overToUnders.push(`M${bezierPoints[0][0]} ${bezierPoints[0][1]} C ${bezierPoints[1][0]} ${bezierPoints[1][1]}, ${bezierPoints[2][0]} ${bezierPoints[2][1]}, ${bezierPoints[3][0]}, ${bezierPoints[3][1]}`);
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

	drawUnders();
	drawMasks();
	addMaskCPcrosses();
	drawOvers();
	addCPcrosses();
	drawing.frame.remove();
	drawing.frame.draw();
	drawing.stopDrawingFrame();
}