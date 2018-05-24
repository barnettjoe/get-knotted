'use strict';

function Line(startCol, startRow, endCol, endRow, style, drawing) {
	this.crossingPoint = new CrossingPoint(startCol, startRow, endCol, endRow, this)
	if (startCol === endCol) { // i.e. if line is vertical
		this.startX = this.endX = startCol * config.squareHeight + config.maxStrokeWidth() / 2;
		this.startY = startRow * config.squareHeight;
		this.startY += config.shiftFactor(style);
		this.endY = this.startY + (endRow - startRow) * config.squareHeight;
		this.endY += style.strokeWidth;
	} else { // if line is horizontal 
		this.startY = this.endY = startRow * config.squareHeight + config.maxStrokeWidth() / 2;
		this.startX = startCol * config.squareHeight;
		this.startX += config.shiftFactor(style);
		this.endX = this.startX + (endCol - startCol) * config.squareHeight;
		this.endX += style.strokeWidth;
	}

	this.snapObj = drawing.surface.line(this.startX, this.startY, this.endX, this.endY).attr(style);

	this.startNode = [startCol, startRow];
	this.endNode = [endCol, endRow];

	this.vector = function() {
		return [this.endX - this.startX, this.endY - this.startY];
	};

	this.angle = function(options) {
		var deltaX = (this.vector()[0]);
		var deltaY = (this.vector()[1]);
		var result = Math.atan2(deltaX, deltaY); // return value is in radians
		if (options.reverse) result += Math.PI;
		return result;
	};

	this.angleOutFrom = function(nodeBoxCoords) {
		if (this.startNode[0] === nodeBoxCoords[0] && this.startNode[1] === nodeBoxCoords[1]) {
			return this.angle({reverse: false});
		} else {
			return this.angle({reverse: true});
		}
	};
	
}

function CrossingPoint(startCol, startRow, endCol, endRow, line) {
	// use proper getters / setters...
	this.crossedUnderOut = false;
	this.crossedOverOut = false;
	this.crossedOverIn = false;
	this.crossedUnderIn  = false;

	this.crossed = function(direction) {
		if (direction === "L") {
			return this.crossedUnderIn && this.crossedUnderOut;
		} else {
			return this.crossedOverIn && this.crossedOverOut;
		}
	};

	this.fullyCrossed = function() {
		return this.crossed("R") && this.crossed("L");
	};



	this.boxCoords = [(startCol + endCol) / 2, (startRow + endRow) / 2];
	this.coords = Mouse.pixelCoords(this.boxCoords);

	this.rotate = function(cx, cy, x, y, angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
		var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
		return [nx, ny];
	};

	this.controlPoint = function(direction, backwards) {
		var vector = backwards ? line.vector().map(i => -i) : line.vector();
		var vectorLength = vector.map(i => i**2).reduce((j, m) => j + m)**0.5;
		var normVect = vector.map(i => i / vectorLength);
		var xStep = normVect[0] * config.bezierDistance;
		var yStep = normVect[1] * config.bezierDistance;
		var initialPosition = [this.coords[0] + xStep, this.coords[1] + yStep];		
		if (direction === "L") {
			return this.rotate(...this.coords, ...initialPosition, Math.PI / 4);
		} else {
			return this.rotate(...this.coords, ...initialPosition, -Math.PI / 4);
		}	
	};
}