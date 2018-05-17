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
			line.snapObj.remove();
		}
	},

	// create line svg and add to lines array
	// arr contents : [startX, startY, endX, endY]
	drawLine: function(options, ...arr) {
		this.lines.push(options.drawing.surface.line(...arr).attr(options.style));
	},

	// draw all horizontal lines
	createHorizontalLines: function(options) {
		for (var i = options.startRow; i <= options.startRow + options.rows; i++) {
			this.lines.push(new Line(options.startCol, i, options.startCol + options.cols, i, options.style, options.drawing));
		}
	},

	// draw all vertical lines
	createVerticalLines: function(options) {
		for (var i = options.startCol; i <= options.startCol + options.cols; i++) {
			this.lines.push(new Line(i, options.startRow, i, options.startRow + options.rows, options.style, options.drawing));
		}
	}
};