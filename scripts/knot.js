"use strict";

function Knot(frame, drawing) {
	var bezierPoints = [[], [], [], []];
	var targetNode;
	var startNode;
	var currentLine;
	var roundabout;
	var nextLine;
	var lastTraversedNode;

	function setBezierStartPoints(direction) {
		var backwards = targetNode[0] !== currentLine.endNode[0] || targetNode[1] !== currentLine.endNode[1];
		bezierPoints[0] = Mouse.pixelCoords(currentLine.crossingPoint.boxCoords);
		bezierPoints[1] = currentLine.crossingPoint.controlPoint(direction, backwards, "start");
	    //drawing.surface.circle(...bezierPoints[0], 5).attr({stroke: "red", fill: "red"});
	    //drawing.surface.circle(...bezierPoints[1], 5).attr({stroke: "red", fill: "red"});

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
		bezierPoints[3] = Mouse.pixelCoords(nextLine.crossingPoint.boxCoords);
        var backwards = targetNode[0] === nextLine.endNode[0] && targetNode[1] === nextLine.endNode[1];
        bezierPoints[2] = nextLine.crossingPoint.controlPoint(direction === "R" ? "L" : "R", !backwards, "end");
		//drawing.surface.circle(...bezierPoints[3], 5).attr({stroke: "red", fill: "red"});
	    //drawing.surface.circle(...bezierPoints[2], 5).attr({stroke: "red", fill: "red"});
	}

	var initialDirection = "L";	
	var direction = initialDirection;
	// until all crossing points fully crossed...
	var firstLine = frame.lines[Math.floor(Math.random() * frame.lines.length)]; 
	currentLine = firstLine;
	// choose which node to go towards
	var firstTargetNode = currentLine.endNode; 
	targetNode = firstTargetNode;

	while (true) {
		direction = (direction === "R" ? "L" : "R");
		roundabout = frame.linesOutFrom(targetNode);
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
		if (currentLine === firstLine && targetNode[0] === firstTargetNode[0] && targetNode[1] === firstTargetNode[1] && direction === initialDirection) {
			break;
		}
	}
}