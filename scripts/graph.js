"use strict";

function Graph(startCol, startRow, cols, rows, style) {
	this.lines = [];

	this.remove = function() { // broken? 
		for (var line of this.lines) {
			line.remove();
		}
	};

	this.drawLine = function(startX, startY, endX, endY) {
		this.lines.push(surface.line(startX, startY, endX, endY).attr(style));
	};

	this.createHorizontalLines = function() {
		var startX = startCol * config.squareHeight;
		var endX = startX + cols * config.squareHeight + style.strokeWidth;
		for (var i = startRow; i <= startRow + rows; i++) {
			var startY = i * config.squareHeight + style.strokeWidth / 2;
			this.drawLine(startX, startY, endX, startY); 
		}
	};

	this.createVerticalLines = function() {
		var startY = startRow * config.squareHeight;
		var endY = startY + rows * config.squareHeight + style.strokeWidth;
		for (var i = startCol; i <= startCol + cols; i++) {
			var startX = i * config.squareHeight + style.strokeWidth / 2;
			this.drawLine(startX, startY, startX, endY); 
		}
	};

	this.createHorizontalLines();
	this.createVerticalLines();
}