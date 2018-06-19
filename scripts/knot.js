'use strict';

function Knot(drawing) {
	var targetNode;
	var currentLine;
	var roundabout;
	var direction;
	var group = drawing.surface.g();
	var strands = [];

	this.drawing = drawing;

	this.remove = function() {
		group.remove();
	};

	function logCrossing(direction) {
		if (direction === 'R') {
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

		if (direction === 'R') {
			// pad out list with first element...
			// to allow going all way thru to start again
			var previousLine = orderedLinesOut[inIndex - 1]; 
			var lastLine = orderedLinesOut[orderedLinesOut.length - 1];
			return previousLine || lastLine;
		} else {
			orderedLinesOut.push(orderedLinesOut[0]);
			return orderedLinesOut[inIndex + 1];
		}
	}

	function uncrossed(line) {
		return !line.crossingPoint.fullyCrossed();
	}

	function goingBackwards() {
		return currentLine.startNode.sameNode(targetNode);
	}

	function traverseNextBackwards() {
		return getNextLine(direction).endNode.sameNode(targetNode);
	}

	function currentBearing() {
		return currentLine.angleOutCP({
			direction: direction,
			reverse: goingBackwards()
		});
	}

	function nextBearing() {
		return getNextLine(direction).angleOutCP({
			direction: oppositeDirection(),
			reverse: traverseNextBackwards()
		});
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
			// select first line - any line where CP is...
			// uncrossed in either R or L direction
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
			// could start going in either direction,
			// but just go towards endNode of line
			targetNode = currentLine.endNode;
		}
		function addPoint() {
			strand.push({
				x: currentLine.crossingPoint.coords[0],
				y: currentLine.crossingPoint.coords[1],
				pr: false
			});
			if (pointedReturn()) {
				var startCoords = currentLine.crossingPoint.coords;
				var endCoords = getNextLine(direction).crossingPoint.coords;
				var prCoords = getApexCoords(startCoords, endCoords, direction);
				strand.push({
					x: prCoords[0],
					y: prCoords[1],
					pr: oppositeDirection()
				});
			}
			logCrossing(direction);
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
		while (drawing.frame.lines.some(uncrossed)) {
			// on each iteration of this loop we determine...
			// the crossingpoints through which a single strand will pass
			var strand = [];

			selectLine();
			selectDirection();
			addPoint();

			// in the below while loop we add all the
			// crossingpoints through which our strand passes
			while (true) {
				selectNextPoint();
				setNewTargetNode();
				addPoint();
				if (endOfStrand()) break;
			}

			strands.push(strand);
		}
	}

	generateStrands();

	for (var strand of strands) {
		(new Contour(strand, drawing)).draw();
	}

	function getApexCoords(startPoint, endPoint, direction) {
		var startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
		var normal;
		if (direction === "R") {
			normal = [-startToEnd[1], startToEnd[0]];
		} else if (direction === "L") {
			normal = [startToEnd[1], -startToEnd[0]];
		}
		return [startPoint[0] + startToEnd[0]/2 + normal[0],
				startPoint[1] + startToEnd[1]/2 + normal[1]];
	}

	drawing.frame.remove();
	drawing.frame.draw();
	drawing.stopDrawingFrame();
}
