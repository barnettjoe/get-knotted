"use strict";

function Graph(drawing) {
	var options = {
        drawing: drawing,
        startCol:  0,
        startRow: 0,
        cols: config.graphCols,
        rows: config.graphRows,
        style: config.graphLine
    };

	Grid.call(this, options);
}

Graph.prototype = Grid.prototype;
