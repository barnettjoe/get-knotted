"use strict";

var Grid = (function() {
  var grid;

  /* drawing rectangle */
  function createGrid() {
    var height = Mouse.height();
    var x = Mouse.x();
    var width = Mouse.width();
    var y = Mouse.y();
    grid = surface.rect(x, y, width, height);
    grid.attr(config.grid);
    
    drawCrossingPoints(x, y, width, height);

    return grid;
  }

  function drawCrossingPoints(x, y, width, height) {
    crossingPoint(100, 100)
  }

  function crossingPoint(x, y) {
    surface.circle(x, y, 5);
  }

  function create1x1() {
    grid = surface.rect(Mouse.initialTopLeftX, Mouse.initialTopLeftY, config.graph_spacing, config.graph_spacing);
    grid.attr(config.grid);
    return grid;
  }

  function userDrawGrid() {
    document.getElementById("surface").addEventListener("mousedown", Mouse.down);
    document.addEventListener("mouseup", Mouse.up);

    Mouse.afterDown = 
        function() {
          grid && grid.remove();
          create1x1();
        };

    Mouse.afterMove = 
        function() {
          grid && grid.remove();
          createGrid();
        }; 
  }

  return {
    userDrawGrid: userDrawGrid
  };
})();