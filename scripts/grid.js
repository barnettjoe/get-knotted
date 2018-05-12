var Grid = (function() {
  var grid;

  /* drawing rectangle */
  function createGrid() {
    grid = surface.rect(Mouse.x(), Mouse.y(), Mouse.width(), Mouse.height());
    grid.attr({
      fill: "none",
      stroke: "blue",
      strokeWidth: Graph.GRAPH_LINE_WIDTH
    });
    console.log(Mouse.initialBottomRightY);
    return grid;
  }

  function create1x1() {
    grid = surface.rect(Mouse.initialTopLeftX, Mouse.initialTopLeftY, Graph.GRAPH_SPACING, Graph.GRAPH_SPACING);
    grid.attr({
      fill: "none",
      stroke: "blue",
      strokeWidth: Graph.GRAPH_LINE_WIDTH
    });
    return grid;
  }

  function userDrawGrid() {
    document.getElementById("surface").addEventListener("mousedown", Mouse.down);
    document.getElementById("surface").addEventListener("mouseup", Mouse.up);

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