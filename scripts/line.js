'use strict';

function Line(options) {
	this.startNode = options.startNode;
	this.endNode = options.endNode;
	
	if (this.startNode && this.endNode) {
		this.startX = this.startNode.x;
		this.startY = this.startNode.y;
		this.endX = this.endNode.x;
		this.endY = this.endNode.y;
	} else {
		this.startX = options.startX;
		this.startY = options.startY;
		this.endX = options.endX;
		this.endY = options.endY;
	}

	this.crossingPoint = new CrossingPoint(this.startX, this.startY, this.endX, this.endY, this)

	this.snapObj = options.drawing.surface.line(this.startX, this.startY, this.endX, this.endY).attr(options.style);

	this.vector = function() {
		return [this.endX - this.startX, this.endY - this.startY];
	};

	this.angle = function(options) {
		var deltaX = (this.vector()[0]);
		var deltaY = (this.vector()[1]);
		var result = Math.atan2(deltaX, deltaY); // return value is in radians
		if (options.reverse) result += Math.PI;
		return (result >= 0 ? result : result + 2 * Math.PI); //Math.abs(result);
	};

	this.angleOutFrom = function(node) {
		if (this.startX === node.x && this.startY === node.y) {
			return this.angle({reverse: false});
		} else {
			return this.angle({reverse: true});
		}
	};
}

function CrossingPoint(startX, startY, endX, endY, line) {
	// use proper getters / setters...
	this.crossedLeft = false;
	this.crossedRight = false;

	this.crossed = function(direction) {
		if (direction === "L") {
			return this.crossedLeft;
		} else {
			return this.crossedRight;
		}
	};

	this.fullyCrossed = function() {
		return this.crossed("R") && this.crossed("L");
	};

	this.coords = [(startX + endX) / 2, (startY + endY) / 2];

	this.rotate = function(cx, cy, x, y, angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
		var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
		return [nx, ny];
	};

	this.uncrossedDirection = function() {
		if (this.fullyCrossed()) {
			return null;
		} else if (this.crossed("L")) {
			return "R";
		} else {
			return "L";
		}
	}

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