"use strict";

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
			currentLine.crossingPoint.crossedRight =  true;
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
		var inIndex = orderedLinesOut.indexOf(currentLine);

		if (direction === "R") { // wall is on left...
			// pad out list with first element to allow going all way thru to start again
			return orderedLinesOut[inIndex - 1] || orderedLinesOut[orderedLinesOut.length - 1];
		} else {
			orderedLinesOut.push(orderedLinesOut[0]);
			return orderedLinesOut[inIndex + 1];
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

	function rotateAboutOrigin(point, angle) {
		var x = point[0];
		var y = point[1];
		var newX = x * Math.cos(angle) - y * Math.sin(angle);
		var newY = y * Math.cos(angle) + x * Math.sin(angle);
		return [newX, newY];
	}

	function rotate(point, center, angle) {
		// first shift to origin
		var shiftedPoint = [point[0] - center[0], point[1] - center[1]];
		var rotated = rotateAboutOrigin(shiftedPoint, angle);
		return [rotated[0] + center[0], rotated[1] + center[1]];
	}

	function alignBez(p0, p1, p2, p3) {
		// translate to get p0 on x axis
		var translated = [p0, p1, p2, p3].map(coords => [coords[0], coords[1] + -p0[1]]);
		// now rotate so p3 is also on x axis
		var deltaX = translated[0][0];
		var angle = -Math.atan(translated[3][1] / (translated[3][0] - deltaX));
		return translated.map(coord => rotate(coord, translated[0], angle)); 
	}

	function goingBackwards() {
		return currentLine.startNode.sameNode(targetNode);
	}

	function traverseNextBackwards() {
		return getNextLine(direction).endNode.sameNode(targetNode);
	}

	function currentBearing() {
		return currentLine.angleOutCP({direction: direction, reverse: goingBackwards()});
	}

	function nextBearing() {
		return getNextLine(direction).angleOutCP({direction: oppositeDirection(), reverse: traverseNextBackwards()});
	}

	function pointedReturn() {
		return Math.abs(currentBearing() - nextBearing()) > 1.6;
	}

	function oppositeDirection() {
		return (direction === "R" ? "L" : "R");
	} 

	// each strand is one "piece of string" of the knot
	var strands = [];
	var underToOvers = [];
	var overToUnders = [];


	while (drawing.frame.lines.some(uncrossed)) {
		// on each iteration of this loop we determine the crossingpoints through which a single strand will pass
		var strand = {
			lines: [],
			pointedReturns: []
		};		

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
		strand.lines.push({
			line: currentLine,
			bearing: currentBearing()
		});
		drawing.surface.circle(...currentLine.crossingPoint.coords, 5);
		logCrossing(direction);


		// in the below while loop we add all the crossingpoints through which our strand passes
		while (true) {
			// move onto next line 			
			if (pointedReturn()) {
				strand.pointedReturns.push({
					startIdx: strand.lines.length - 1,
					endIdx: strand.lines.length,
					startReverse: goingBackwards(),
					endReverse: traverseNextBackwards(),
					startDirection: direction,
					endDirection: (direction === "R" ? "L" : "R")
				});
			}
					
			currentLine = getNextLine(direction);
			//drawing.surface.circle(...currentLine.crossingPoint.coords, 5);
			


			direction = oppositeDirection();

			strand.lines.push({
				line: currentLine,
				bearing: currentBearing()
			});

			direction = oppositeDirection();


			logCrossing(oppositeDirection());		

			// set new targetNode
			if (goingBackwards()) {
				targetNode = currentLine.endNode;
			} else {
				targetNode = currentLine.startNode;
			}
			if (getNextLine(oppositeDirection()).crossingPoint.crossed(direction)) {
				break;
			}

			// record end bearing
			//strand.endBearing = currentBearing();

			direction = oppositeDirection();
		}
		direction = oppositeDirection();
		//debugger;
					if (pointedReturn()) {
				strand.pointedReturns.push({
					startIdx: strand.lines.length - 1,
					endIdx: 0,
					startReverse: goingBackwards(),
					endReverse: traverseNextBackwards(),
					startDirection: direction,
					endDirection: (direction === "R" ? "L" : "R")
				});
			}
		strands.push(strand);
	}


	// DOING THE ACTUAL DRAWING
	var strokeWidth = 20;
	var strokeThickness = 4;

	for (var strand of strands) {
		// first draw all the sections between the pointed returns...
		for (var i = 0; i < strand.pointedReturns.length; i++) {
			var pointedReturn = strand.pointedReturns[i];
			// the number of points in first section
			var sectionLength;
			var section;
			var previousPR;
			if (i === 0) {
				previousPR = strand.pointedReturns[strand.pointedReturns.length - 1];
			} else {
				previousPR = strand.pointedReturns[i - 1];
			}
			sectionLength = pointedReturn.startIdx - previousPR.endIdx + 1;
			section = strand.lines.slice(previousPR.endIdx, previousPR.endIdx + sectionLength);
			var startAngle = section[0].bearing;
			var endAngle = section[section.length - 1].bearing;
			debugger;
			var startGradient = Math.tan(startAngle);
			var endGradient = Math.tan(endAngle);
			// get length of last curve segment before PR
			var firstPoint = section[0].line.crossingPoint.coords;
			var secondPoint = section[1].line.crossingPoint.coords;
			var a = ((firstPoint[0] - secondPoint[0])**2 + (firstPoint[1] - secondPoint[1])**2)**0.5;
			var dxStart = (a**2 / (startGradient**2 + 1))**0.5;
			var dyStart =  startGradient * dxStart;
			// now do same for end of PR
			// for now...just use the same a value
			var dxEnd = (a**2 / (endGradient**2 + 1))**0.5;
			var dyEnd =  endGradient * dxEnd;
			debugger;
			var contour = new Contour(section.map(position => position.line.crossingPoint.coords), dxStart, dyStart, dxEnd, dyEnd);
			drawOutline(contour);
		}
		debugger;

	}

	/*
	for (var strand of strands) {
		var contour = new Contour(strand.lines);
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
	*/

	debugger;
		// pointed return business
		


//var s = Snap("#svg");
//var points = [[500, 200], [300, 400], [500, 600], [700, 400]];
//var strokeWidth = 40;
//var strokeThickness = 20;

function rotateAboutOrigin(point, angle) {
  var x = point[0];
  var y = point[1];
  var newX = x * Math.cos(angle) - y * Math.sin(angle);
  var newY = y * Math.cos(angle) + x * Math.sin(angle);
  return [newX, newY];
}
function rotate(point, center, angle) {
  // first shift to origin
  var shiftedPoint = [point[0] - center[0], point[1] - center[1]];
  var rotated = rotateAboutOrigin(shiftedPoint, angle);
  return [rotated[0] + center[0], rotated[1] + center[1]];
}
function bezString(p0, p1, p2, p3) {
  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
}
function Contour(points, startGradX, startGradY, endGradX, endGradY) { 
  var matrix = [];
  var unknowns = 2 * (points.length - 1);
  for (var i =  1; i < points.length - 1; i++) {
    var row = [];
    for (var count = 0; count < (2 * i - 1); count++) {
      row.push(0);
    }
        
    row = row.concat([1, 1]);
    while (row.length < unknowns) {
      row.push(0);
    }
    matrix.push(row);
  }
  
  for (var i =  0; i < points.length - 2; i++) {
    var row  = [];
    for (var count = 0; count < i * 2; count++) {
      row.push(0);
    }
    row = row.concat([1, -2, 2, -1]);    
    while (row.length < unknowns) {
      row.push(0);
    }
    matrix.push(row);
  }
  
  var row = [];
  row.push(3);
  while (row.length < unknowns) {
    row.push(0);
  }
  matrix.push(row);
  
  var row = [];
  row.push(-3);
  while (row.length < unknowns) {
    row.unshift(0);
  }
  matrix.push(row);
  
  var inputXs = [];
  var inputYs = [];
  
  for (var i = 1; i < points.length - 1; i++) {
    inputXs.push(2 * points[i][0]);
    inputYs.push(2 * points[i][1]);
  }
 
  for (var i = 1; i < points.length - 1; i++) {
    inputXs.push(0);
    inputYs.push(0);
  }
  inputXs.push(startGradX + 3 * points[0][0]);
  inputYs.push(startGradY + 3 * points[0][1]);
  inputXs.push(endGradX - 3 * points[points.length - 1][0]);
  inputYs.push(endGradY - 3 * points[points.length - 1][1]);
  
  var controlPointsX = numeric.solve(matrix, inputXs);
  var controlPointsY = numeric.solve(matrix, inputYs);

  this.bezArray = [];
  
  for (var i = 0; i < points.length - 1; i++) {
    var p0 = points[i];
    var p1 = [controlPointsX.shift(), controlPointsY.shift()];
    var p2 = [controlPointsX.shift(), controlPointsY.shift()];
    var p3 = points[i + 1];
    this.bezArray.push(new Bezier(p0.concat(p1.concat(p2.concat(p3)))));
  }
}
function arcCircle(apex, contourPoint, contourGradient) {
  var x1 = apex[0];
  var x0 = contourPoint[0];
  var y1 = apex[1];
  var y0 = contourPoint[1];
  var h = (x1**2 - x0**2 + y1**2 - y0**2 - 2 * (y1 - y0) * y0 - (2/contourGradient) * x0 * (y1 - y0)) / (2 *((x1 - x0) - (1/contourGradient) * (y1 - y0)));
  var k = (-1/contourGradient) * h + y0 + (1/contourGradient) * x0;
  return {
    center: [h, k],
    radius: ((x0 - h)**2 + (y0 - k)**2)**0.5
  };
}
function draw(outline) {
   for (var curve of outline) {
    var cntrls = curve.points.map(point => [point.x, point.y]);
    format(drawing.surface.path(bezString(...cntrls)));
  }
}
function drawOutline(contour) {
  for (var i = 0; i < contour.bezArray.length; i++) {
    draw(contour.bezArray[i].offset(strokeWidth/2));
    draw(contour.bezArray[i].offset(-strokeWidth/2));
  }
}
function hide(path) {
  return path.attr({
    fill: "none",
    stroke: "none"
  })
}
function startGradX(strand, pointedReturn) {
	var previousIdx;
	if (pointedReturn.startIdx === 0) {
		previousIdx = strand.lines.length - 1;
	} else {
		previousIdx = pointedReturn.startIdx - 1;
	}
	return (strand.lines[pointedReturn.startIdx][0] - strand.lines[previousIdx][0]);
}
function startGradY(strand, pointedReturn) {
	var previousIdx;
	if (pointedReturn.startIdx === 0) {
		previousIdx = strand.lines.length - 1;
	} else {
		previousIdx = pointedReturn.startIdx - 1;
	}
	return (strand.lines[pointedReturn.startIdx][1] - strand.lines[previousIdx][1]);
}
function endGradX(strand, pointedReturn) {
	var nextIdx;
	if (pointedReturn.endIdx === strand.lines.length - 1) {
		nextIdx = 0;
	} else {
		nextIdx = pointedReturn.endIdx + 1;
	}
	return (strand.lines[nextIdx][0] - strand.lines[pointedReturn.endIdx][0]);
}
function endGradY(strand, pointedReturn) {
	var nextIdx;
	if (pointedReturn.endIdx === strand.lines.length - 1) {
		nextIdx = 0;
	} else {
		nextIdx = pointedReturn.endIdx + 1;
	}
	return (strand.lines[nextIdx][1] - strand.lines[pointedReturn.endIdx][1]);
}
function format(path) {
  return path.attr({
    fill: "none",
    stroke: "black",
    strokeWidth: strokeThickness,
   });
}
function getApexCoords(points) {
  var startToEnd = [points[points.length - 1][0] - points[0][0], points[points.length - 1][1] - points[0][1]];
  var normal = [startToEnd[1], -startToEnd[0]];
  return [points[0][0] + startToEnd[0]/2 + normal[0], points[0][1] + startToEnd[1]/2 + normal[1]];
}
function adjustPoint(point, normal, direction) {
  var adjust = [normal.x, normal.y].map(d => d * strokeWidth/2);
  return point.map(function(x, i) {
    if (direction === "outer") {
      return x + adjust[i];
    } else if (direction === "inner") {
      return x - adjust[i];
    }
  });
}
function startPoint(points, contour, direction) {
  var normal  = contour.bezArray[0].normal(0);
  return adjustPoint(points[0], normal, direction);
}
function endPoint(points, contour, direction) {
  var normal  = contour.bezArray[contour.bezArray.length - 1].normal(1);
  return adjustPoint(points[points.length - 1], normal, direction);
}
function arcString(start, end, circle, adjustment) {
  var radius;
  if (adjustment === "inner") {
    radius = circle.radius - strokeWidth/2;
  } else if (adjustment === "outer") {
    radius = circle.radius + strokeWidth/2;
  }
  return {
    moveTo: `M${start[0]} ${start[1]} `,
    radii: `A ${radius} ${radius} `,
    flags: "0 0 0 ",
    finish: `${end[0]} ${end[1]}` 
  };
}
function arc(start, end, circle, adjustment) {
  var strParts = arcString(start, end, circle, adjustment);
  return s.path(strParts.moveTo + strParts.radii + strParts.flags + strParts.finish);
}
function intersection(path1, path2) {
  var interObj = Snap.path.intersection(path1, path2)[0];
  return [interObj.x, interObj.y];
}
function concatenate(arcString1, arcString2) {
  return (arcString1.moveTo + arcString1.radii + arcString1.flags + arcString1.finish + arcString2.radii + arcString2.flags + arcString2.finish);
}

//var contour = new Contour(points, startGradX(points), startGradY(points), endGradX(points), endGradY(points));
//drawOutline(contour);
//drawPointedReturn();

function drawPointedReturn() {
  var apexCoords = getApexCoords(points);
  var firstArcCircle = arcCircle(apexCoords, points[0], (startGradY(points) / startGradX(points)));
  var secondArcCircle = arcCircle(apexCoords, points[points.length - 1], (endGradY(points) / endGradX(points)));

  var startOuter = startPoint(points, contour, "outer"); 
  var startInner = startPoint(points, contour, "inner"); 
  var endOuter = endPoint(points, contour, "outer"); 
  var endInner = endPoint(points, contour, "inner"); 

  var extendedApexInner = rotate(startInner, firstArcCircle.center, Math.PI / 2);
  var extendedApexOuter = rotate(startOuter, firstArcCircle.center, Math.PI / 2);
  var extendedApexReverseInner = rotate(endInner, secondArcCircle.center, -Math.PI / 2);
  var extendedApexReverseOuter = rotate(endOuter, secondArcCircle.center, -Math.PI / 2);

  var firstInner = hide(arc(extendedApexInner, startInner, firstArcCircle, "inner"));
  var firstOuter = hide(arc(extendedApexOuter, startOuter, firstArcCircle, "outer"));
  var lastInner = hide(arc(endInner, extendedApexReverseInner, secondArcCircle, "inner"));
  var lastOuter = hide(arc(endOuter, extendedApexReverseOuter, secondArcCircle, "outer"));

  var innerApex = intersection(firstInner, lastInner);
  var outerApex = intersection(firstOuter, lastOuter);

  var innerFirstHalf = arcString(endInner, innerApex, secondArcCircle, "inner");
  var innerSecondHalf = arcString(innerApex, startInner, firstArcCircle, "inner"); 

  var outerFirstHalf = arcString(endOuter, outerApex, secondArcCircle, "outer");
  var outerSecondHalf = arcString(outerApex, startOuter, firstArcCircle, "outer"); 

  format(s.path(concatenate(innerFirstHalf, innerSecondHalf)));
  format(s.path(concatenate(outerFirstHalf, outerSecondHalf)));
}

















		// end pointed return business


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