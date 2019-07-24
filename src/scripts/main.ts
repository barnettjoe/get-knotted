import drawing from './drawing';
import Snap from 'snapsvg';
import { relativeCoords } from './mouse.js';
import Graph from './graph';
import { INode } from './types';
export default Snap('#surface');

const noOp = () => {};

function drawSquareGrid() {
  drawing.graph = new Graph();
}

function makeDraggable(node: INode) {
  node.snapObject.drag(makeDragHandler(node), noOp, redrawKnot);
}
function makeAllNodesDraggable() {
  drawing.frame.nodes.forEach((node) => {
    makeDraggable(node);
  });
}
function makeDragHandler(node: INode) {
  return (e)=> {
    // change node position
    [node.x, node.y] = relativeCoords(e);
    // re-draw whole frame
    drawing.frame.remove();
    drawing.frame.draw();
    // but now we have new snap objs without listeners attached
    // so add listeners again
    makeAllNodesDraggable();
    // uncomment the line below to make freeform 10x as fun
    redrawKnot();
  };
}
function redrawKnot() {
  drawing.knot.remove();
  drawing.drawKnot();
  makeAllNodesDraggable();
}
function startFreeformMode() {
  if (drawing.graph) drawing.graph.remove();
  makeAllNodesDraggable();
}
function setFrameType() {
  const frameType = 'square'; //document.querySelector('[name=frame-type]:checked').value;
  switch (frameType) {
    case 'square':
      drawing.knot && drawing.knot.remove();
      drawing.frame && drawing.frame.remove();
      drawSquareGrid();
      drawing.frame && drawing.frame.draw();
      drawing.knot && drawing.drawKnot();
      break;
      // TODO - ignoring "Type '"freeform"' is not comparable to type '"square"'" error here
      // this happens because we're hardcoding the frameType value above
      // so typescript knows it's never actually going to be anything but 'square'.
      // When we get around to using the other frameType options again, we'll be able to remove
      // this ts-ignore.
      // @ts-ignore
    case 'freeform':
      startFreeformMode();
      break;
  }
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
  setFrameType();
}, false);
