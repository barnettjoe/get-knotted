'use strict';

function Line(startCol, startRow, endCol, endRow, style, drawing) {
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

	this.crossingPointBoxCoords = function() {
		return [(startCol + endCol) / 2, (startRow + endRow) / 2];
	};

	this.drawCrossingPoint = function() {
    	new CrossingPoint(this.crossingPointBoxCoords(), drawing);  
	};

	this.vector = function() {
		return [this.endX - this.startX, this.endY - this.startY];
	};

	this.angle = function() {
		var deltaX = (this.vector()[0]);
		var deltaY = (this.vector()[1]);
		return Math.atan2(deltaX, deltaY); // return value is in radians
	};
}


function CrossingPoint(center, drawing) {
    drawing.surface.circle(...Mouse.pixelCoords(center), 5);
}