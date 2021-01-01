import makeKnot, {
  merge as mergeKnots,
  addLineBetween,
  remove as removeKnot,
  drawAndReturnPolylines as drawKnot,
} from "./knot";
import {
  fromExtrema,
  lines,
  findProximalNode,
  lineExistsBetween,
  overlapsExistingNode,
  elementsForRemoval,
} from "./frame";
import Node from "./node";
import {
  rowAndCol,
  doIfInGraph,
  relativeCoords,
  closestGraphCoords,
  pixelCoords,
} from "./mouse.js";
import { identicalObjects } from "./general-utils";
import config from "./config";
import model from "./model";
import * as webgl from "./webgl/draw-webgl";

import {
  Coords,
  Drawing,
  INode,
  GridSystem,
  isOnscreenWebglContext,
} from "./types";

// for keeping track of where we started a drag on the grid
let dragStart: [number, number];
let dragEnd: [number, number];

let webglContext: CanvasRenderingContext;

// for keeping track of the line currently being drawn (in 'add-line' mode)
const userLine: { element: Snap.Element | null; startNode: INode | null } = {
  element: null,
  startNode: null,
};

let dirty = true;

export function drawLine(line) {
  // TODO - EWW
  // line.snapObj = Snap("#surface")
  //   .line(line.startX, line.startY, line.endX, line.endY)
  //   .attr(line.style);
  // webgl.addLine(line);
}

export function drawNode(node) {
  // TODO - EWW
  // node.snapObj = Snap("#surface")
  //   .circle(node.x, node.y, config.nodeStyle.radius)
  //   .attr(config.nodeStyle);
  webgl.addCircle(node.x, node.y, config.nodeStyle.radius);
}

export function drawPolyline(polyline) {
  // const snp = Snap("#surface").polyline(polyline);
  // snp.attr({
  //   stroke: "black",
  //   strokeWidth: config.knot.borderWidth,
  //   fill: "none",
  // });
  webgl.addPolyline(polyline);
  // return snp;
}

export function removeElement(element) {
  if (!element) return;
  // nasty hack
  if (element.remove) {
    element.remove();
  } else if (element.snapObj) {
    element.snapObj.remove();
  }
}

function drawLoop() {
  const currentKnot = model.currentKnot;
  const currentFrame = model.frame;
  if (dirty) {
    if (currentFrame) {
      model.frame.lines.forEach(drawLine);
      model.frame.nodes.forEach(drawNode);
    }
    if (currentKnot) {
      drawKnot(currentKnot);
    }
    webgl.draw();
    dirty = false;
  }
  requestAnimationFrame(drawLoop);
}

const drawing: Drawing = {
  knots: [],
  mode: "add-grid",
  mouseIsDown: false,
  setupWebglContext() {
    const webglCanvas = document.getElementById("webgl-surface");
    if (!(webglCanvas instanceof HTMLCanvasElement)) {
      throw new Error("no canvas for webgl");
    }
    const webglContext = webglCanvas.getContext("webgl2");
    if (isOnscreenWebglContext(webglContext)) {
      webgl.start(webglContext);
    } else {
      throw new Error("failed to get webgl context");
    }
  },
  handleMouseDown(this: Drawing, e: MouseEvent) {
    this.mouseIsDown = true;
    switch (this.mode) {
      case "add-grid":
        this.startDrawingGrid(e);
        break;
      case "add-line":
        // TODO - should be able to remove type assertion after converting mouse.js
        // into typescript
        this.startDrawingLine(relativeCoords(e) as Coords);
        break;
      case "add-node":
        this.placeNode(e);
        break;
    }
  },
  handleMouseUp(this: Drawing, e: MouseEvent) {
    if (e.target instanceof Element && e.target.tagName !== "BUTTON") {
      this.mouseIsDown = false;
      switch (this.mode) {
        case "add-grid":
          model.frame && this.createKnot();
          break;
        case "add-line":
          this.finishDrawingLine(e);
          break;
      }
    }
  },
  handleMouseMove(this: Drawing, e: MouseEvent) {
    model.mouseTracker = relativeCoords(e);
    dirty = true;
    if (this.mouseIsDown) {
      switch (this.mode) {
        case "add-grid":
          this.dragFrame(e);
          break;
        case "add-line":
          if (userLine.startNode) {
            // TODO - should be able to remove type assertion after converting mouse.js
            // into typescript
            this.drawUserLine(userLine.startNode, relativeCoords(e) as Coords);
          }
          break;
      }
    }
  },
  addMouseListeners() {
    const wrapper = document.getElementById("webgl-wrapper");
    if (wrapper) {
      wrapper.addEventListener(
        "mousedown",
        this.handleMouseDown.bind(this),
        false
      );
      wrapper.addEventListener(
        "mousemove",
        this.handleMouseMove.bind(this),
        false
      );
    } else {
      // TODO - throw error
    }
    window.addEventListener("mouseup", this.handleMouseUp.bind(this), false);
  },
  startDrawLoop() {
    requestAnimationFrame(drawLoop);
  },
  createKnot() {
    const knot = makeKnot(model.frame);
    model.currentKnot = knot;
    this.knots.push(knot);
    dirty = true;
  },
  addNode(coords) {
    const frame = this.singleNodeFrame(coords);
    frame.lines = lines(frame.nodes, frame.adjacencyList);
    frame.crossingPoints = frame.lines.map((line) => line.crossingPoint);
    frame.lines.forEach(drawLine);
    const newKnot = makeKnot(frame);
    drawKnot(newKnot);
    this.knots.push(newKnot);
  },
  singleNodeFrame(coords) {
    const nodes = [
      new Node({
        x: coords[0],
        y: coords[1],
        gridSystem: GridSystem.square,
      }),
    ];
    return { nodes, adjacencyList: [[]] };
  },
  placeNode(e) {
    const coords = closestGraphCoords(e);
    const pxCoords = pixelCoords(coords);
    if (!this.isNodeOverlapping(pxCoords)) {
      // TODO - should be able to remove type assertion after converting mouse.js
      // into typescript
      this.addNode(coords as Coords);
    }
  },
  isNodeOverlapping(coords) {
    return this.knots.some((knot) => {
      return overlapsExistingNode(...coords, knot.frame.nodes);
    });
  },
  updateFrame() {
    model.frame = fromExtrema(dragStart, dragEnd);
    dirty = true;
  },
  startDrawingGrid(e) {
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    dragStart = rowAndCol(e) as Coords;
    dragEnd = dragStart;
    doIfInGraph(dragStart, this.updateFrame.bind(this));
  },
  dragFrame(e: MouseEvent) {
    const previousBox = dragEnd;
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    dragEnd = rowAndCol(e) as Coords;
    if (!identicalObjects(previousBox, dragEnd)) {
      doIfInGraph(
        dragEnd,
        (() => {
          let currentFrame = model.frame;
          if (currentFrame) {
            elementsForRemoval(currentFrame).forEach(removeElement);
            currentFrame.lines = [];
          }
          currentFrame = fromExtrema(dragStart, dragEnd);
          model.frame = currentFrame;
          currentFrame.lines.forEach(drawLine);
          currentFrame.nodes.forEach(drawNode);
        }).bind(this)
      );
    }
  },
  drawUserLine(lineStart, toCoords) {
    userLine.element && userLine.element.remove();
    userLine.startNode = lineStart;
    // userLine.element = Snap("#surface").line(
    //   lineStart.x,
    //   lineStart.y,
    //   ...toCoords
    // );
    userLine.element.attr(config.frame);
  },
  removeUserLine() {
    userLine.element && userLine.element.remove();
    userLine.element = null;
    userLine.startNode = null;
  },
  newLineIsValid(lineStart, lineEnd) {
    const currentFrame = model.frame;
    return (
      lineEnd &&
      lineEnd !== lineStart &&
      !lineExistsBetween(lineStart, lineEnd, currentFrame.lines)
    );
  },
  finishDrawingLine(e) {
    const lineStart = userLine.startNode;
    this.removeUserLine();
    const coords = relativeCoords(e);
    // TODO - should be able to remove type assertion after converting mouse.js
    // into typescript
    const lineEnd = this.nodeAt(coords as Coords);
    if (lineStart && lineEnd && this.newLineIsValid(lineStart, lineEnd)) {
      this.makeNewLine(lineStart, lineEnd);
    }
  },
  makeNewLine(lineStart, lineEnd) {
    const currentKnot = model.currentKnot;
    currentKnot && removeKnot(currentKnot);
    const knotA = this.findKnotWith(lineStart);
    const knotB = this.findKnotWith(lineEnd);
    if (knotA && knotB && knotA !== knotB) {
      this.mergeKnots(knotA, knotB, lineStart, lineEnd);
    } else {
      addLineBetween(currentKnot, lineStart, lineEnd);
    }
  },
  mergeKnots(knotA, knotB, startNode, endNode) {
    // need to merge two frames...
    this.remove(knotA);
    this.remove(knotB);
    const knot = mergeKnots(knotA, knotB, startNode, endNode);
    model.currentKnot = knot;
    model.frame = knot.frame;
    this.knots.push(knot);
  },
  remove(knot) {
    removeKnot(model.currentKnot);
    this.knots.splice(this.knots.indexOf(knot), 1);
  },
  nodeAt(coords: Coords) {
    let result;
    this.knots.some((knot) => {
      result = findProximalNode(coords, knot.frame.nodes);
      if (result) {
        return true;
      }
      return false;
    });
    return result || null;
  },
  findKnotWith(node) {
    return (
      this.knots.find((knot) => {
        return knot.frame.nodes.includes(node);
      }) || null
    );
  },
  startDrawingLine(coords) {
    const lineStart = this.nodeAt(coords);
    if (lineStart) {
      const foundKnot = this.findKnotWith(lineStart);
      if (foundKnot) {
        model.currentKnot = foundKnot;
        model.frame = foundKnot.frame;
        this.drawUserLine(lineStart, coords);
      }
    }
  },
};

export default drawing;
