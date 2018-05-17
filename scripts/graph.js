'use strict';

function Graph(drawing) {
	Grid.call(this, {
        drawing: drawing,
        startCol: 0,
        startRow: 0,
        cols: config.graphCols,
        rows: config.graphRows,
        style: config.graphLine
    });
}

Graph.prototype = Grid.prototype;
