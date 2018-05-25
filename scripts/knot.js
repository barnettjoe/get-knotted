"use strict";

// TODO -- fix over under pattern for multiple strands

function Knot(frame, drawing) {
	var bezierPoints = [[], [], [], []];
	var targetNode;
	var startNode;
	var currentLine;
	var roundabout;
	var nextLine;
	var lastTraversedNode;
	var direction;

	function setBezierStartPoints(direction) {
		var backwards = targetNode[0] !== currentLine.endNode[0] || targetNode[1] !== currentLine.endNode[1];
		bezierPoints[0] = Mouse.pixelCoords(currentLine.crossingPoint.boxCoords);
		bezierPoints[1] = currentLine.crossingPoint.controlPoint(direction, backwards);
	    
		if (direction === "R") {
			currentLine.crossingPoint.crossedOverOut = true;
		} else {
			currentLine.crossingPoint.crossedUnderOut = true;
		}

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
		
		if (direction === "L") {
			nextLine.crossingPoint.crossedOverIn = true;
		} else {
			nextLine.crossingPoint.crossedUnderIn = true;
		}

		//drawing.surface.circle(...bezierPoints[3], 5).attr({stroke: "red", fill: "red"});
	    //drawing.surface.circle(...bezierPoints[2], 5).attr({stroke: "red", fill: "red"});
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
		}
	}

	function addMaskCPcrosses(line) {
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
		}
	}


	function uncrossed(line) {
		return !line.crossingPoint.fullyCrossed();
	}

	var underToOvers = [];
	var overToUnders = [];

	while (frame.lines.some(uncrossed)) {
		// select first line - any line where CP is uncrossed in either R or L direction
		var currentLine;
		for (var line of frame.lines) {
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
			roundabout = frame.linesOutFrom(targetNode);
			setBezierStartPoints(direction);
			setBezierEndPoints(direction);
			if (direction === "L") {
				underToOvers.push(`M${bezierPoints[0][0]} ${bezierPoints[0][1]} C ${bezierPoints[1][0]} ${bezierPoints[1][1]}, ${bezierPoints[2][0]} ${bezierPoints[2][1]}, ${bezierPoints[3][0]}, ${bezierPoints[3][1]}`);
			} else {
				overToUnders.push(`M${bezierPoints[0][0]} ${bezierPoints[0][1]} C ${bezierPoints[1][0]} ${bezierPoints[1][1]}, ${bezierPoints[2][0]} ${bezierPoints[2][1]}, ${bezierPoints[3][0]}, ${bezierPoints[3][1]}`);
			}
			currentLine = nextLine;
			lastTraversedNode = targetNode;
			// set new targetNode
			if (currentLine.startNode[0] === lastTraversedNode[0] && currentLine.startNode[1] === lastTraversedNode[1]) {
				targetNode = currentLine.endNode;
			} else {
				targetNode = currentLine.startNode;
			}
			if (currentLine.crossingPoint.crossed(direction === "R" ? "L" : "R")) {
				break;
			}

		}
	}


	function drawUnders() {
		for (var pathStr of underToOvers) {
			var section = drawing.surface.path(pathStr);
			section.attr(config.knot);	
			section.attr({
				strokeDasharray:[(section.getTotalLength() / 2 + config.overlap), section.getTotalLength() / 2  - config.overlap],
			});

			var mask = drawing.surface.path(pathStr);
			mask.attr(config.mask)
			mask.attr({
				strokeDasharray: [config.knot.strokeWidth / 2 + config.gap, mask.getTotalLength()],
			});		
		}

		for (var pathStr of overToUnders) {
			var section = drawing.surface.path(pathStr);
			section.attr(config.knot);	
			section.attr({
				strokeDasharray:[(section.getTotalLength() / 2 + config.overlap), section.getTotalLength() / 2  - config.overlap],
				strokeDashoffset: section.getTotalLength() / 2 + config.overlap,
			});


			var mask = drawing.surface.path(pathStr);
			mask.attr(config.mask)
			mask.attr({	
				strokeDasharray:[config.knot.strokeWidth / 2 + config.gap, mask.getTotalLength() - (config.knot.strokeWidth / 2 + config.gap)],
				strokeDashoffset: config.knot.strokeWidth / 2 + config.gap,
			});	
			
		}	
	}


	function drawFirstHalfOverToUnders() {

	}

	drawUnders();

	// now draw all overs

	// first half of oversToUnders paths is "over"
	for (var pathStr of overToUnders) {
		var section = drawing.surface.path(pathStr);
		section.attr(config.knot);	
		section.attr({
			//strokeDasharray: section.getTotalLength() / 2,
		    //strokeDasharray: [section.getTotalLength() / 2 - config.overlap, section.getTotalLength()],
   			strokeDasharray:[(section.getTotalLength() / 2 + config.overlap), section.getTotalLength() / 2  - config.overlap],
		});
	}



	for (var pathStr of underToOvers) {

		

		addMaskCPcrosses();
	}

	for (var pathStr of overToUnders) {

		var section = drawing.surface.path(pathStr);
		section.attr(config.knot);	
		section.attr({
			//strokeDasharray: section.getTotalLength() / 2,
		    //strokeDasharray: [section.getTotalLength() / 2 - config.overlap, section.getTotalLength()],
   			strokeDasharray:[(section.getTotalLength() / 2 + config.overlap), section.getTotalLength() / 2  - config.overlap],
		});
		
	}


	for (var pathStr of underToOvers) {

		var section = drawing.surface.path(pathStr);
		section.attr(config.knot);	
		section.attr({
			//strokeDasharray: section.getTotalLength() / 2,
			//strokeDashoffset: section.getTotalLength() / 2
			strokeDasharray:[(section.getTotalLength() / 2 + config.overlap), section.getTotalLength() / 2  - config.overlap],
   			strokeDashoffset: section.getTotalLength() / 2 + config.overlap,
		});
	}

	addCPcrosses();	


}