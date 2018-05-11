var s = Snap("#surface");

var GRID_SPACING = 40;
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
  for (var i = GRID_LINE_WIDTH / 2; i < wrapper()[direction === "V" ? "offsetWidth" : "offsetHeight"]; i += GRID_SPACING) {
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
  document.getElementById("surface").style.width = `${newWidth + GRID_LINE_WIDTH}px`;
  document.getElementById("surface").style.height = `${newHeight + GRID_LINE_WIDTH}px`;
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


/* drawing rectangle */

var Mouse = {
  startCoords: [0, 0],
  currentCoords: [0, 0],

  eventCoords: function(event) {
    var absX = event.clientX;
    var absY = event.clientY;
    var svgPosition = document.getElementById("surface").getBoundingClientRect();
    var leftOffset = svgPosition.left;
    var topOffset = svgPosition.top;
    return [absX - leftOffset, absY - topOffset]
  },

  mousedown: function(event) {
    Mouse.startCoords = Mouse.eventCoords(event);
    document.getElementById("surface").addEventListener("mousemove", Mouse.move);
  },

  mouseup: function(mouseUp) {
    document.getElementById("surface").removeEventListener("mousemove", Mouse.move);
    console.log(`start coords: ${Mouse.startCoords}, end coords: ${Mouse.currentCoords}`)
  },

  move: function(event) {
    Mouse.currentCoords = Mouse.eventCoords(event);
  },

  closestGridPointCoord: function(x, y) {

  }
}

document.getElementById("surface").addEventListener("mouseup", Mouse.mouseup);
document.getElementById("surface").addEventListener("mousedown", Mouse.mousedown);


roundToPrecision: function(num, prec) {
  var rem = (num / prec);
  if (Math.round(rem) === Math.floor(rem)) {
    /* round down */
    return Math.floor(num / prec) * prec;
  } else {
    /* round up */
    return Math.ceil(num / prec) * prec;
  }
}