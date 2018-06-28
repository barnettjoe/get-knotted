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

	this.pomaxPath = function(bez) {
		return bez.points.map(point => [point.x, point.y]);
	};

	this.splice = function(bezArray) {
		var that = this;
		var pathStrs = bezArray.map(function(bez) {
			return knotUtils.bezString(...that.pomaxPath(bez));
		});
		var path = pathStrs[0];
		for (var str of pathStrs.slice(1)) {
			path = path + str.split(/(?=\sC)/)[1];
		}
		return path;
	};

	this.format = function(snapObj) {
		snapObj.attr({
			stroke: "black",
			strokeWidth: config.knot.borderWidth,
			fill: "none"
		});
	};


	this.clippedOutboundPath = function(intersection, outline) {
		var bezes = outline.slice(0, intersection.idxA);
		bezes.push(outline[intersection.idxA].split(intersection.tA).left);
		return bezes;
	};

	this.clippedInboundPath = function(intersection, outline) {
		var bezes = [];
		bezes.push(outline[intersection.idxB].split(intersection.tB).right);
		bezes = bezes.concat(outline.slice(intersection.idxB + 1));
		return bezes;
	};

	this.drawPRinners = function(pr) {
		// get intersection of inner outbound with inner inbound
		var intersection = knotUtils.collectionIntersect(pr.innerOutbound, pr.innerInbound);
		// split at intersection point 
		// concatenate part of outbound inner from before intersection, 
		// with the part of inbound inner from after the intersection...
		var outClipped = this.clippedOutboundPath(intersection, pr.innerOutbound);
		var inClipped = this.clippedInboundPath(intersection, pr.innerInbound);
		var snp = drawing.surface.path(this.splice(outClipped.concat(inClipped)));
		group.add(snp);
		this.format(snp);
	};


	this.drawPRouters = function(pr, i) {
		debugger;
		// get initial outbound bezier
		var middleOutbound = strand[knotUtils.previousCyclicalIdx(strand, i)].bez;

		// get middle inbound bez 
		var middleInbound = pr.bez;

		// get collections for outers
		var d = (pr.pr === "L") ? (config.knot.strokeWidth + config.knot.borderWidth)/2 : -(config.knot.strokeWidth + config.knot.borderWidth)/2; 
		//var outerOutbound = middleOutbound.offset(d)
		//var outerInbound = middleInbound.offset(d);
		
		// get pathstrs for outers
		var outerOutboundPathStr = this.splice(pr.point.outerOutbound);
		var outerInboundPathStr = this.splice(pr.point.outerInbound);
		var tOutbound = 1;
		var tInbound = 0;
		var tStep = 0.02;
		var outboundExtensions = [middleOutbound.offset(1, d)];
		var inboundExtensions = [middleInbound.offset(0, d)];
		var kld = kldIntersections;
		var intersection = new kld.Intersection("No Intersection");
		// build up polylines until they intersect
		while (intersection.points.length === 0) {
			// prepare for extension
			tOutbound += tStep;
			tInbound -= tStep;
			outboundExtensions.push(middleOutbound.offset(tOutbound, d));				
			inboundExtensions.unshift(middleInbound.offset(tInbound, d));				
			var outboundPolyline = outboundExtensions.map(ext => new kld.Point2D(ext.x, ext.y));
			var inboundPolyline = inboundExtensions.map(ext => new kld.Point2D(ext.x, ext.y));
			// get intersection...
			for (var i = 0; i < outboundPolyline.length - 1; i++) {
				var a1 = outboundPolyline[i];
				var a2 = outboundPolyline[i + 1];
				for (var j = 0; j < inboundPolyline.length - 1; j++) {
					var b1 = inboundPolyline[j];
					var b2 = inboundPolyline[j + 1];
					intersection = kld.Intersection.intersectLineLine(a1, a2, b1, b2);
					if (intersection.points.length > 0) {			
						outboundExtensions = outboundExtensions.slice(0, i + 1)
						inboundExtensions = inboundExtensions.slice(j + 1);
						break;
					}
				}
			}
		}
		// append intersection point to outbound polyline
		outboundExtensions.push(intersection.points[0]);
		// concatenate inbound polyline 
		outboundExtensions = outboundExtensions.concat(inboundExtensions);
		var pathStr = outerOutboundPathStr;
		pathStr += outboundExtensions.map(point => ` L ${point.x} ${point.y}`).join("");
		pathStr += " " + outerInboundPathStr.split("M")[1];
		var snp = drawing.surface.path(pathStr);
		group.add(snp);
		this.format(snp);

	};




	this.drawOutline = function(outline) {
	   for (var curve of outline) {
		var cntrls = curve.points.map(point => [point.x, point.y]);
		var snp = drawing.surface.path(knotUtils.bezString(...cntrls));
		group.add(snp);
		this.format(snp);
	  }
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
				point: currentLine.crossingPoint,
				x: currentLine.crossingPoint.coords[0],
				y: currentLine.crossingPoint.coords[1],
				pr: false,
				direction: direction
			});
			if (pointedReturn()) {
				var startCoords = currentLine.crossingPoint.coords;
				var endCoords = getNextLine(direction).crossingPoint.coords;
				var prCoords = getApexCoords(startCoords, endCoords, direction);
				strand.push({
					point: {},
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

	var allMasks = [];

	for (var strand of strands) {
		var c = new Contour(strand, drawing, group); 
		c.draw();
	}
	

	// now do the clipping...

	for (var strand of strands) {
		for (var cpORpr of strand) {
			var point = cpORpr.point;
			if (!cpORpr.pr) {
				// now trim the unders
				if (!cpORpr.point.trimmed) {
					var overLeft = point.overInLeft.concat(point.overOutLeft);
					var overRight = point.overInRight.concat(point.overOutRight);
					var intersectLOut = knotUtils.collectionIntersect(point.underOutLeft, overLeft) || knotUtils.collectionIntersect(point.underOutLeft, overRight);
					var intersectROut = knotUtils.collectionIntersect(point.underOutRight, overLeft) || knotUtils.collectionIntersect(point.underOutRight, overRight);

					var intersectLIn = knotUtils.collectionIntersect(point.underInLeft, overLeft) || knotUtils.collectionIntersect(point.underInLeft, overRight);
					var intersectRIn = knotUtils.collectionIntersect(point.underInRight, overLeft) || knotUtils.collectionIntersect(point.underInRight, overRight);


					// mutate the obj held in underOutLeft

					var newUnderOutLeft = point.underOutLeft.slice(intersectLOut.idxA);

					while (point.underOutLeft.length > 0) {
						point.underOutLeft.pop();
					}

					for (var el of newUnderOutLeft) {
						point.underOutLeft.push(el);
					}

					point.underOutLeft[0] = point.underOutLeft[0].split(intersectLOut.tA).right

					// .... and for underOutRight


					var newUnderOutRight = point.underOutRight.slice(intersectROut.idxA);

					while (point.underOutRight.length > 0) {
						point.underOutRight.pop();
					}

					for (var el of newUnderOutRight) {
						point.underOutRight.push(el);
					}

					point.underOutRight[0] = point.underOutRight[0].split(intersectROut.tA).right

					// and for underInLeft

					var newUnderInLeft = point.underInLeft.slice(0, intersectLIn.idxA + 1);

					newUnderInLeft[newUnderInLeft.length - 1] = newUnderInLeft[newUnderInLeft.length - 1].split(intersectLIn.tA).left; 

					while (point.underInLeft.length > 0) {
						point.underInLeft.pop();
					}

					for (var el of newUnderInLeft) {
						point.underInLeft.push(el);
					}

					// and for underInRight

					var newUnderInRight = point.underInRight.slice(0, intersectRIn.idxA + 1);
					newUnderInRight[newUnderInRight.length - 1] = newUnderInRight[newUnderInRight.length - 1].split(intersectRIn.tA).left; 

					while (point.underInRight.length > 0) {
						point.underInRight.pop();
					}

					for (var el of newUnderInRight) {
						point.underInRight.push(el);
					}
				}
				
				cpORpr.point.trimmed = true;
			} else {
			
				//debugger;

				
			}
		}
	}

	for (var strand of strands) {
		for (var i = 0; i < strand.length; i++) {
			var cpORpr = strand[i];
			// now draw everything except PRs
			if (!(cpORpr.pr || strand[knotUtils.nextCyclicalIdx(strand, i)].pr)) {
				var point = cpORpr.point;
				if (cpORpr.direction === "R") {
					this.drawOutline(point.overOutLeft);
					this.drawOutline(point.overOutRight);			
				} else {
					this.drawOutline(point.underOutLeft);
					this.drawOutline(point.underOutRight);
				}
			} else if (cpORpr.pr) {
			// here we draw the PRs
				var pr = cpORpr.point;
				this.drawPRinners(pr);
				//debugger;
				this.drawPRouters(cpORpr, i);
			}		
		}
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
