"use strict";

function Graph(startCol, startRow, cols, rows, style, needsShift) {
	this.lines = [];

	this.remove = function() {
		for (var line of this.lines) {
			line.remove();
		}
	};

	this.drawLine = function(...arr) { // arr contents : [startX, startY, endX, endY]
		// translate everything down and left slightly to keep it all on visible on the surface
		arr = this.translate(arr);
		// if drawing the graph, needs to be shifted further so that grid lines lie in the center of graph lines if they are narrower (and vice verse)
		if (needsShift) {	
			this.lines.push(surface.line(...arr.map(x => this.shift(x))).attr(style));	
		} else {
			this.lines.push(surface.line(...arr).attr(style));	
		}
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

	this.shift = function(x) {
		// adjust for possible width difference between grid lines and graph lines
    	return x + 0.5 * (config.grid.strokeWidth - config.graphLine.strokeWidth);
	}

	this.translate = function(arr) {
		return arr.map(x => (x + config.offset()));
	}

	this.createHorizontalLines();
	this.createVerticalLines();
}