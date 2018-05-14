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
    Mouse.afterMove();
  }

  function rowAndCol(event) {
    var x, y;
    // get row / col coords from pixel coords 
    [x, y] = relativeCoords(event).map(num => Math.floor(num / config.squareHeight));
    // prevent grid from extending outside of graph
    return [Math.min(x, config.graphCols - 1), Math.min(y, config.graphRows - 1)];
  }

  function down(event) {
    Mouse.initialBox = rowAndCol(event); 
    // add listener for mouse movement
    document.getElementById("surface").addEventListener("mousemove", move);
    // remove any existing grid and make new one
    Mouse.afterDown();
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