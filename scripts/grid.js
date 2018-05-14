"use strict";

function UserDefinedGrid() {
  var grid;
  
  function createGrid() {
    var leftmost = Math.min(Mouse.initialBox[0], Mouse.finalBox[0]);
    var topmost = Math.min(Mouse.initialBox[1], Mouse.finalBox[1]);
    var rightmost = Math.max(Mouse.initialBox[0], Mouse.finalBox[0]);
    var bottommost = Math.max(Mouse.initialBox[1], Mouse.finalBox[1]);
    grid = new Graph(leftmost, topmost, rightmost - leftmost + 1, bottommost - topmost + 1, config.grid);
  }

  function create1x1() {
    grid = new Graph(...Mouse.initialBox, 1, 1, config.grid);
  }

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
