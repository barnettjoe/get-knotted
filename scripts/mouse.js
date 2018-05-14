"use strict";

var Mouse = (function() {
  function relativeCoords(event) {
    var absX = event.clientX;
    var absY = event.clientY;
    var svgPosition = document.getElementById("surface").getBoundingClientRect();
    var leftOffset = svgPosition.left;
    var topOffset = svgPosition.top;
    return [absX - leftOffset, absY - topOffset]
  }

  var initialTopLeftX, finalTopLeftX, initialTopLeftY, finalTopLeftY;
  var initialBottomRightX, finalBottomRightX, initialBottomRightY, finalBottomRightY;

  function move(event) {
    var clickCoords = relativeCoords(event); // e.g. [50, 50]
    // get coords of topleft corner of box
    [Mouse.finalTopLeftX, Mouse.finalTopLeftY] = clickCoords.map(x => roundDown(x)); // e.g. [40, 40]
    [Mouse.finalBottomRightX, Mouse.finalBottomRightY] = clickCoords.map(x => roundUp(x)); // e.g. [40, 40]
    Mouse.afterMove();
  }

  function roundUp(num) {
    return Math.ceil(num / config.GRAPH_SPACING) * config.GRAPH_SPACING + config.GRAPH_LINE_WIDTH / 2;
  }

  function roundDown(num) {
    return Math.floor(num / config.GRAPH_SPACING) * config.GRAPH_SPACING + config.GRAPH_LINE_WIDTH / 2;
  }

  function x() {
    return Math.min(Mouse.initialTopLeftX, Mouse.finalTopLeftX);
  }

  function y() {
    return Math.min(Mouse.initialTopLeftY, Mouse.finalTopLeftY);
  }

  function width() {
    return Math.max(Mouse.initialBottomRightX, Mouse.finalBottomRightX) - Math.min(Mouse.initialTopLeftX, Mouse.finalTopLeftX);
  }
  
  function height() {
    return Math.max(Mouse.initialBottomRightY, Mouse.finalBottomRightY) - Math.min(Mouse.initialTopLeftY, Mouse.finalTopLeftY);
  }

  function down(event) {
    // record startBox
      // get coords 
    var clickCoords = relativeCoords(event); // e.g. [50, 50]
    // get coords of topleft corner of box
    [Mouse.initialTopLeftX, Mouse.initialTopLeftY] = clickCoords.map(x => roundDown(x)); // e.g. [40, 40]
    [Mouse.initialBottomRightX, Mouse.initialBottomRightY] = clickCoords.map(x => roundUp(x)); // e.g. [40, 40]

    // add listener for mouse movement
    document.getElementById("surface").addEventListener("mousemove", move);
    // remove any existing grid and make new one
    Mouse.afterDown();
   }

  function up(event) {
    document.getElementById("surface").removeEventListener("mousemove", move);
  }

  return {
    initialTopLeftX: initialTopLeftX,
    initialTopLeftY: initialTopLeftY,
    down: down, 
    up: up,
    x: x,
    y: y,
    width: width,
    height: height
  };
})();