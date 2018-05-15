"use strict";

function userDefineGrid() {
  var grid, finalBox, initialBox;
  var graphArea = document.getElementById("surface");
  
  function moveListener(event) {
    finalBox = Mouse.rowAndCol(event);
    
    // doIfInGraph wrapper here prevents drawing of grids beyond boundaries of the graph
    Mouse.doIfInGraph(finalBox, function() {
      grid && grid.remove();
      createGrid();
    });   
  }

  function createGrid() {
    var leftmost   = Math.min(initialBox[0], finalBox[0]);
    var topmost    = Math.min(initialBox[1], finalBox[1]);
    var rightmost  = Math.max(initialBox[0], finalBox[0]);
    var bottommost = Math.max(initialBox[1], finalBox[1]);
    grid = new Graph(leftmost, topmost, rightmost - leftmost + 1, bottommost - topmost + 1, config.grid);
  }

  function create1x1() {
    grid = new Graph(...initialBox, 1, 1, config.grid);
  }

  // listen for mousedown
  graphArea.addEventListener("mousedown", function() {
    // record position of mousedown
    initialBox = Mouse.rowAndCol(event); 
    // if click was within the graph area...
    Mouse.doIfInGraph(initialBox, function() {
      // remove grid if one already exists
      grid && grid.remove();
      // create 1x1 grid
      create1x1();
      // and add a listener for mouse movement
      graphArea.addEventListener("mousemove", moveListener);
    });   
  });  
  
  // listener for mouseup is attached to the whole document (not just the graphArea)
  // - this prevents the "sticky mouse" bug 
  document.addEventListener("mouseup", function() {
    graphArea.removeEventListener("mousemove", moveListener);
  });
}

