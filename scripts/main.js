import { Grid } from './grid.js'

var s = Snap("#surface");
var skel;

/* drawing rectangle */
function createSkeleton(height, width) {
  var height = Math.abs(Mouse.currentCoords[1] - Mouse.startCoords[1]);
  var width = Math.abs(Mouse.currentCoords[0] - Mouse.startCoords[0]);
  skel = s.rect(...Mouse.topLeftCoords(), width, height);
  skel.attr({
    fill: "none",
    stroke: "gray",
    strokeWidth: 3
  });
  return skel;
}

var Mouse = {
  startCoords: [0, 0],
  currentCoords: [0, 0],

  topLeftCoords: function() {
    return [Math.min(Mouse.startCoords[0], Mouse.currentCoords[0]), Math.min(Mouse.startCoords[1], Mouse.currentCoords[1])];
  },

  eventCoords: function(event) {
    var absX = event.clientX;
    var absY = event.clientY;
    var svgPosition = document.getElementById("surface").getBoundingClientRect();
    var leftOffset = svgPosition.left;
    var topOffset = svgPosition.top;
    return [absX - leftOffset, absY - topOffset]
  },

  mousedown: function(event) {
    Mouse.startCoords = Mouse.closestGridCoord(Mouse.eventCoords(event));
    document.getElementById("surface").addEventListener("mousemove", Mouse.move);
    Mouse.currentCoords = Mouse.startCoords.map(i => i + Grid.GRID_SPACING);
    skel && skel.remove();
    createSkeleton();
  },

  mouseup: function(mouseUp) {
    document.getElementById("surface").removeEventListener("mousemove", Mouse.move);
  },

  move: function(event) {
    Mouse.currentCoords = Mouse.closestGridCoord(Mouse.eventCoords(event));
    skel && skel.remove();
    createSkeleton();
  },

  closestGridCoord: function(coords) {
    return coords.map(coord => Mouse.roundToPrecision(coord, Grid.GRID_SPACING) + Grid.GRID_LINE_WIDTH / 2);
  },

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
}

Grid.drawGrid(s);
window.addEventListener('resize', function() { Grid.drawGrid(s) } );

document.getElementById("surface").addEventListener("mousedown", Mouse.mousedown);
document.getElementById("surface").addEventListener("mouseup", Mouse.mouseup);
