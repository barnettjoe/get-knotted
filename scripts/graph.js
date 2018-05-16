"use strict";

function Graph(options) {
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
		if (options.style.strokeWidth === this.maxStrokeWidth()) {
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
		this.lines.push(options.drawing.surface.line(...arr).attr(options.style));	
	};

	// draw all horizonal lines
	this.createHorizontalLines = function() {
		var startX = options.startCol * config.squareHeight + this.shiftFactor();
		var endX = startX + options.cols * config.squareHeight + options.style.strokeWidth;

		for (var i = options.startRow; i <= options.startRow + options.rows; i++) {
			var startY = i * config.squareHeight + this.maxStrokeWidth() / 2;
			this.drawLine(startX, startY, endX, startY); 			
		}
	};

	// draw all vertical lines
	this.createVerticalLines = function() {
		var startY = options.startRow * config.squareHeight + this.shiftFactor();
		var endY = startY + options.rows * config.squareHeight + options.style.strokeWidth;

		for (var i = options.startCol; i <= options.startCol + options.cols; i++) {
			var startX = i * config.squareHeight + this.maxStrokeWidth() / 2;

			this.drawLine(startX, startY, startX, endY); 
		}
	};

	this.createHorizontalLines();
	this.createVerticalLines();
}