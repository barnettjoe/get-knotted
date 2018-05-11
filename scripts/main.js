var s = Snap("#surface");

var GRID_SPACING = 20;
var GRID_LINE_WIDTH = 1;

function drawLine(x, y, direction, length) {
 var p = s.path(`M${x} ${y}${direction} ${length}`).attr({
          fill: "none",
          stroke: "lightgrey",
          strokeWidth: GRID_LINE_WIDTH
      });
}

function drawVerticalLines() {
  for (var x of linePositions("V")) {
    drawLine(x, 0, "V", wrapper().offsetHeight)
  }
}

function drawHorizontalLines() {
  for (var y of linePositions("H")) {
    drawLine(0, y, "H", wrapper().offsetWidth)
  }
}

function linePositions(direction) {
  var arr = [];
  for (var i = GRID_SPACING; i < wrapper()[direction === "V" ? "offsetWidth" : "offsetHeight"]; i += GRID_SPACING) {
    arr.push(i);
  }
  return arr;
}

/* height and width of wrapper should both be multiple of GRID_SPACING */
function resizeWrapper() {
  var initialWidth = wrapper().offsetWidth;
  var initialHeight = wrapper().offsetHeight;
  var newWidth = Math.floor(initialWidth / GRID_SPACING) * GRID_SPACING;
  var newHeight = Math.floor(initialHeight / GRID_SPACING) * GRID_SPACING;
  document.getElementById("surface").style.width = `${newWidth}px`;
  document.getElementById("surface").style.height = `${newHeight}px`;
}

function wrapper() {
  return document.getElementById('wrapper');
}

function drawGrid() {
  resizeWrapper();
  drawVerticalLines();
  drawHorizontalLines();
}

drawGrid();
window.addEventListener('resize', drawGrid);