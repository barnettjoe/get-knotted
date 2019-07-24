import drawing from './drawing';
import Snap from 'snapsvg';
import Graph from './graph';
export default Snap('#surface');

function drawSquareGrid() {
  drawing.graph = new Graph();
}

function changeDrawingMode(newMode) {
  return () => drawing.mode = newMode;
}

document.addEventListener('DOMContentLoaded', () => {
  drawing.addMouseListeners();
  ['add-node', 'add-line', 'add-grid'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', changeDrawingMode(id), false);
    } else {
      // throw error
    }
  });
  drawSquareGrid();
}, false);
