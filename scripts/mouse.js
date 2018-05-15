"use strict";

var Mouse = (function() {

  // for getting coords relative to graph area, from absolute coords (i.e. relative to whole window)
  function relativeCoords(event) {
    var absX = event.clientX;
    var absY = event.clientY;
    var svgPosition = document.getElementById("surface").getBoundingClientRect();
    var leftOffset = svgPosition.left;
    var topOffset = svgPosition.top;
    return [absX - leftOffset, absY - topOffset]
  }
 
  // for executing code on condition that mouse is positioned within graphArea
  function doIfInGraph(box, fn) {
    var inGraph = (box[0] >= 0 && box[0] < config.graphCols && box[1] >= 0 && box[1] < config.graphRows);
    if (inGraph) {
      fn();
    }
  }

  // for getting [row, col] coords from pixel coords
  function rowAndCol(event) {
    return relativeCoords(event).map(num => Math.floor((num - 0.5 * graph.maxStrokeWidth()) / config.squareHeight));
  }

  return {
    rowAndCol: rowAndCol,
    doIfInGraph: doIfInGraph,
  };
})();