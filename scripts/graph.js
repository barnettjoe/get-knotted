'use strict';

function Graph(drawing) {
	var options = {
        drawing: drawing,
        startCol: 0,
        startRow: 0,
        cols: config.graphCols,
        rows: config.graphRows,
        style: config.graphLine
    };

	Grid.call(this, options);

	// draw all horizontal lines
	this.createHorizontalLines = function(options) {
		for (var i = options.startRow; i <= options.startRow + options.rows; i++) {
			this.lines.push(new Line(options.startCol, i, options.startCol + options.cols, i, options.style, options.drawing));
		}
	};

	// draw all vertical lines
	this.createVerticalLines = function(options) {
		for (var i = options.startCol; i <= options.startCol + options.cols; i++) {
			this.lines.push(new Line(i, options.startRow, i, options.startRow + options.rows, options.style, options.drawing));
		}
	};

	
    this.createVerticalLines(options);
	this.createHorizontalLines(options);

}

Graph.prototype = Grid.prototype;
