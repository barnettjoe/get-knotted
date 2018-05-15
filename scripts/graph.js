"use strict";

function Graph(startCol, startRow, cols, rows, style) {
	this.lines = [];

	// remove frame (by removing all of its lines)
	this.remove = function() {
		for (var line of this.lines) {
			line.remove();
		}
	};

	// necessary to ensure proper alignment of frame and graph...
	// ...even when one has wider strokeWidth
	this.shiftFactor = function() {
		if (style.strokeWidth === this.maxStrokeWidth()) {
			return 0;
		} else {
			return 0.5 * (this.maxStrokeWidth() - this.minStrokeWidth());
		}
	}

	this.maxStrokeWidth = function() {
		return Math.max(config.graphLine.strokeWidth, config.frame.strokeWidth);
	}

	this.minStrokeWidth = function() {
		return Math.min(config.graphLine.strokeWidth, config.frame.strokeWidth);
	}

	// create line svg and add to lines array
	this.drawLine = function(...arr) { // arr contents : [startX, startY, endX, endY]
		this.lines.push(drawing.surface.line(...arr).attr(style));	
	};

	// draw all horizonal lines
	this.createHorizontalLines = function() {
		var startX = startCol * config.squareHeight + this.shiftFactor();
		var endX = startX + cols * config.squareHeight + style.strokeWidth;

		for (var i = startRow; i <= startRow + rows; i++) {
			var startY = i * config.squareHeight + this.maxStrokeWidth() / 2;
			this.drawLine(startX, startY, endX, startY); 			
		}
	};

	// draw all vertical lines
	this.createVerticalLines = function() {
		var startY = startRow * config.squareHeight + this.shiftFactor();
		var endY = startY + rows * config.squareHeight + style.strokeWidth;

		for (var i = startCol; i <= startCol + cols; i++) {
			var startX = i * config.squareHeight + this.maxStrokeWidth() / 2;

			this.drawLine(startX, startY, startX, endY); 
		}
	};

	this.createHorizontalLines();
	this.createVerticalLines();
}