"use strict";

function Knot(drawing) {
	var targetNode;
	var startNode;
	var currentLine;
	var roundabout;
	var nextLine;
	var lastTraversedNode;
	var direction;
	var group = drawing.surface.g();
	var strands = [];
	var targetNode;
	var strokeWidth = 0;
	var strokeThickness = 1;

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
		var angleDelta = Math.abs(currentBearing() - nextBearing());
		var smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
		return smallerAngle > 1.6;
	}

	function oppositeDirection() {
		return (direction === "R" ? "L" : "R");
	}

	function generateStrands() {
		function selectLine() {
			// select first line - any line where CP is uncrossed in either R or L direction
			for (var line of drawing.frame.lines) {
				if (uncrossed(line)) {
					currentLine = line;
					break;
				}
			}
		}
		function selectDirection() {
			// choose direction
			direction = currentLine.crossingPoint.uncrossedDirection();
			// could start going in either direction, but just go towards endNode of line
			targetNode = currentLine.endNode;
		}
		function addPoint() {
			strand.push({
				x: currentLine.crossingPoint.coords[0],
				y: currentLine.crossingPoint.coords[1],
				pr: false
			});
			if (pointedReturn()) {
				var prCoords = getApexCoords(currentLine.crossingPoint.coords, getNextLine(direction).crossingPoint.coords, direction);
				strand.push({
					x: prCoords[0],
					y: prCoords[1],
					pr: oppositeDirection()
				});
			}
			logCrossing(direction);
		}
		function checkForPointedReturn() {
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
		}
		function selectNextPoint() {
			currentLine = getNextLine(direction);
			direction = oppositeDirection();
		}
		function setNewTargetNode() {
			// set new targetNode
			if (goingBackwards()) {
				targetNode = currentLine.endNode;
			} else {
				targetNode = currentLine.startNode;
			}
		}
		function endOfStrand() {
			return getNextLine(direction).crossingPoint.crossed(oppositeDirection());
		}
		function addNextPoint() {
			selectNextPoint();
			addPoint();
		}
		while (drawing.frame.lines.some(uncrossed)) {
			// on each iteration of this loop we determine the crossingpoints through which a single strand will pass
			var strand = [];

			selectLine();
			selectDirection();
			addPoint();

			// in the below while loop we add all the crossingpoints through which our strand passes
			while (true) {
				//checkForPointedReturn();
				selectNextPoint();
				setNewTargetNode();
				addPoint();
				if (endOfStrand()) break;
			}

			//checkForPointedReturn();
			strands.push(strand);
		}
	}

	function drawPointedReturns(strand) {
		for (var i = 0; i < strand.pointedReturns.length; i++) {
			var pointedReturn = strand.pointedReturns[i];
			if (i === strand.pointedReturns.length - 1) {
				drawPointedReturn(pointedReturn, sections[i], sections[0]);
			} else {
				drawPointedReturn(pointedReturn, sections[i], sections[i + 1]);
			}
		}
	}
	function drawContour(section) {
		//debugger;
		var contour = new Contour(section.lines.map(position => position.line.crossingPoint.coords), 0, 0, section.startAngle - Math.PI/2, section.endAngle - Math.PI);
		drawHandRolledOutline(contour);
	}

	generateStrands();

	for (var strand of strands) {
		(new Contour(strand, drawing)).draw();
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
function bezString(p0, p1, p2, p3) {
  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
}

// linear interpolation in 1d
function lerp(ratio, start, end) {
  return ratio*start + (1-ratio)*end;
}

// linear interpolation in 2d
function lerp2d(ratio, start, end) {
  return {
  	x: lerp(ratio, start.x, end.x),
  	y: lerp(ratio, start.y, end.y)
  };
}

function coordObj(coordArr) {
	return {
		x: coordArr[0],
		y: coordArr[1]
	}
}

// get a point on a Bezier curve, no matter how
// high-order it is.
function getCurvePoint(t, points) {
  if (points.length === 1) return points[0];
  var newpoints = [];
  for(var i=0,j=1; j<points.length; i++,j++) {
    newpoints[i] = lerp2d(t, points[i], points[j]);
  }
  return getCurvePoint(t, newpoints);
}

function nthOrderBez(points) {
  var t = 0;
  var step = 0.001;
  var pathString = 'M'

  var firstPoint = getCurvePoint(0, points);

  pathString += `${firstPoint.x} ${firstPoint.y}`;

  for (t=step; t<=1; t+=step) {
    var cur = getCurvePoint(t, points);
    pathString += ` L${cur.x} ${cur.y}`;
  }

  format(drawing.surface.path(pathString));
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
function drawHandRolledOutline(contour) {
	for (var bez of contour.bezArray) {
		nthOrderBez(bez.map(point => coordObj(point)));
	}
}
function hide(path) {
  return path.attr({
    fill: "none",
    stroke: "none"
  })
}

function format(path) {
  return path.attr({
    fill: "none",
    stroke: "black",
    strokeWidth: strokeThickness,
   });
}
function getApexCoords(startPoint, endPoint, direction) {
	var startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
	var normal;
	if (direction === "R") {
		normal = [-startToEnd[1], startToEnd[0]];
	} else if (direction === "L") {
		normal = [startToEnd[1], -startToEnd[0]];
	}
	return [startPoint[0] + startToEnd[0]/2 + normal[0], startPoint[1] + startToEnd[1]/2 + normal[1]];
}
function adjustPoint(point, normal, direction) {
  var adjust = [normal[0], normal[1]].map(d => d * strokeWidth/2);
  return point.map(function(x, i) {
    if (direction === "outer") {
      return x + adjust[i];
    } else if (direction === "inner") {
      return x - adjust[i];
    }
  });
}

function endOutlinePoint(section, point, innerOrOuter, direction) {
	var perp;
	if (direction === "R") {
		perp = [-section.dyStart, section.dxStart];
	} else if (direction === "L") {
		perp = [section.dyStart, -section.dxStart];
	}
	var magnitude = (perp[0]**2 + perp[1]**2)**0.5
	var normalized = perp.map(x => x/magnitude);
	return adjustPoint(point, normalized, innerOrOuter);
}

function startOutlinePoint(section, point, innerOrOuter, direction) {
	var perp;
	if (direction === "R") {
		perp = [-section.dyEnd, section.dxEnd];
	} else if (direction === "L") {
		perp = [section.dyEnd, -section.dxEnd];
	}
	var magnitude = (perp[0]**2 + perp[1]**2)**0.5
	var normalized = perp.map(x => x/magnitude);
	return adjustPoint(point, normalized, innerOrOuter);
}

function arcString(start, end, circle, adjustment, direction) {
  var radius;
  if (adjustment === "inner") {
    radius = circle.radius - strokeWidth/2;
  } else if (adjustment === "outer") {
    radius = circle.radius + strokeWidth/2;
  }
  return {
    moveTo: `M${start[0]} ${start[1]} `,
    radii: `A ${radius} ${radius} `,
    flags: `0 0 ${direction === "R" ? 1 : 0} `,
    finish: `${end[0]} ${end[1]}`
  };
}
function arc(start, end, circle, adjustment, direction) {
  var strParts = arcString(start, end, circle, adjustment, direction);
  return drawing.surface.path(strParts.moveTo + strParts.radii + strParts.flags + strParts.finish);
}
function intersection(path1, path2) {
  var interObj = Snap.path.intersection(path1, path2)[0];
  return [interObj.x, interObj.y];
}
function concatenate(arcString1, arcString2) {
  return (arcString1.moveTo + arcString1.radii + arcString1.flags + arcString1.finish + arcString2.radii + arcString2.flags + arcString2.finish);
}

function drawPointedReturn(pointedReturn, firstSection, secondSection) {
	var startPoint = firstSection.lines[firstSection.lines.length - 1].line.crossingPoint.coords;
	var endPoint = secondSection.lines[0].line.crossingPoint.coords;
  	var apexCoords = getApexCoords(startPoint, endPoint, pointedReturn.startDirection);

	var firstArcCircle = arcCircle(apexCoords, startPoint, (firstSection.dyEnd / firstSection.dxEnd));
	var secondArcCircle = arcCircle(apexCoords, endPoint, (secondSection.dyStart/ secondSection.dxStart));


	var startOuter = startOutlinePoint(firstSection, startPoint, "outer", pointedReturn.startDirection);
	var startInner = startOutlinePoint(firstSection, startPoint, "inner", pointedReturn.startDirection);
	var endOuter = endOutlinePoint(secondSection, endPoint, "outer", pointedReturn.startDirection);
	var endInner = endOutlinePoint(secondSection, endPoint, "inner", pointedReturn.startDirection);

	var extendedApexInner;
	var extendedApexOuter;
	var extendedApexReverseInner;
	var extendedApexReverseOuter;
	var rotationAngle = Math.PI / 2;
	if (pointedReturn.startDirection === "R") rotationAngle *= -1;

	extendedApexInner = rotate(startInner, firstArcCircle.center, rotationAngle);
	extendedApexOuter = rotate(startOuter, firstArcCircle.center, rotationAngle);
	extendedApexReverseInner = rotate(endInner, secondArcCircle.center, -rotationAngle);
	extendedApexReverseOuter = rotate(endOuter, secondArcCircle.center, -rotationAngle);

	var firstInner = hide(arc(extendedApexInner, startInner, firstArcCircle, "inner", pointedReturn.startDirection));
	var firstOuter = hide(arc(extendedApexOuter, startOuter, firstArcCircle, "outer", pointedReturn.startDirection));
	var lastInner = hide(arc(endInner, extendedApexReverseInner, secondArcCircle, "inner", pointedReturn.startDirection));
	var lastOuter = hide(arc(endOuter, extendedApexReverseOuter, secondArcCircle, "outer", pointedReturn.startDirection));

	var innerApex = intersection(firstInner, lastInner);
	var outerApex = intersection(firstOuter, lastOuter);

	var innerFirstHalf = arcString(endInner, innerApex, secondArcCircle, "inner", pointedReturn.startDirection);
	var innerSecondHalf = arcString(innerApex, startInner, firstArcCircle, "inner", pointedReturn.startDirection);

	var outerFirstHalf = arcString(endOuter, outerApex, secondArcCircle, "outer", pointedReturn.startDirection);
	var outerSecondHalf = arcString(outerApex, startOuter, firstArcCircle, "outer", pointedReturn.startDirection);

	format(drawing.surface.path(concatenate(innerFirstHalf, innerSecondHalf)));
	format(drawing.surface.path(concatenate(outerFirstHalf, outerSecondHalf)));

}

	drawing.frame.remove();
	drawing.frame.draw();
	drawing.stopDrawingFrame();
}