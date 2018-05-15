"use strict";

var Mouse = (function() {
  var finalBox, initialBox;

  function relativeCoords(event) {
    var absX = event.clientX;
    var absY = event.clientY;
    var svgPosition = document.getElementById("surface").getBoundingClientRect();
    var leftOffset = svgPosition.left;
    var topOffset = svgPosition.top;
    return [absX - leftOffset, absY - topOffset]
  }

  function move(event) {
    Mouse.finalBox = rowAndCol(event);
    if (withinGraph(Mouse.finalBox)) {
      Mouse.afterMove();
    }
  }
  
  // prevent grid from extending outside of graph
  function withinGraph(box) {
    return box[0] >= 0 && box[0] < config.graphRows && box[1] >= 0 && box[1] < config.graphCols;
  }

  function rowAndCol(event) {
    console.log(relativeCoords(event));
  // TODO --- make this use TRUE EDGES
    
   // get row / col coords from pixel coords
    return relativeCoords(event).map(num => Math.floor((num - config.offset() - 0.5 * config.grid.strokeWidth) / config.squareHeight));
  }

  function down(event) {
    Mouse.initialBox = rowAndCol(event); 
    // add listener for mouse movement
    if (withinGraph(Mouse.initialBox)) {
      document.getElementById("surface").addEventListener("mousemove", move);
      Mouse.afterDown();
    }
  }

  function up(event) {
    document.getElementById("surface").removeEventListener("mousemove", move);
  }

  return {
    finalBox: finalBox,
    initialBox: initialBox,
    down: down, 
    up: up,
  };
})();