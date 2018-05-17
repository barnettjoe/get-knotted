'use strict';

function Grid(options) {
	this.lines = [];
	this.options = options;
	this.createVerticalLines(options);
	this.createHorizontalLines(options);
}

Grid.prototype = {
	constructor: Object,

	// remove frame (by removing all of its lines)
	remove: function() {
		for (var line of this.lines) {
			line.remove();
		}
	},

	// necessary to ensure that frame and graph are properly...
	// aligned even when either one has greater strokeWidth
	shiftFactor: function(options) {
		if (options.style.strokeWidth === this.maxStrokeWidth()) {
			return 0;
		} else {
			return 0.5 * (this.maxStrokeWidth() - this.minStrokeWidth());
		}
	},

	maxStrokeWidth: function() {
		return Math.max(config.graphLine.strokeWidth, config.frame.strokeWidth);
	},

	minStrokeWidth: function() {
		return Math.min(config.graphLine.strokeWidth, config.frame.strokeWidth);
	},

	// create line svg and add to lines array
	// arr contents : [startX, startY, endX, endY]
	drawLine: function(options, ...arr) {
		this.lines.push(options.drawing.surface.line(...arr).attr(options.style));
	},

	// draw all horizonal lines
	createHorizontalLines: function(options) {
		var startX = options.startCol * config.squareHeight;
		startX += this.shiftFactor(options);
		var endX = startX + options.cols * config.squareHeight;
		endX += options.style.strokeWidth;

		for (var i = options.startRow; i <= options.startRow + options.rows; i++) {
			var startY = i * config.squareHeight + this.maxStrokeWidth() / 2;
			this.drawLine(options, startX, startY, endX, startY);
		}
	},

	// draw all vertical lines
	createVerticalLines: function(options) {
		var startY = options.startRow * config.squareHeight;
		startY += this.shiftFactor(options);
		var endY = startY + options.rows * config.squareHeight;
		endY += options.style.strokeWidth;

		for (var i = options.startCol; i <= options.startCol + options.cols; i++) {
			var startX = i * config.squareHeight + this.maxStrokeWidth() / 2;

			this.drawLine(options, startX, startY, startX, endY);
		}
	}
};
