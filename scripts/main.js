"use strict";

var surface = Snap("#surface");

// draw graph
new Graph(0, 0, config.graphCols, config.graphRows, config.graphLine, true);

// let user draw a grid 
new UserDefinedGrid();
