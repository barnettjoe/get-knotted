"use strict";

var surface = Snap("#surface");

// draw graph
var graph = new Graph(0, 0, config.graphCols, config.graphRows, config.graphLine);

// let user draw a grid 
userDefineGrid();
