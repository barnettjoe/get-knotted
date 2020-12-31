import { collectionIntersect, format, mutate, reducer } from "./knot-utils.js";
import surface from "./main";
import { uncrossed } from "./line";
import { drawLine, drawNode, drawPolyline, removeElement } from "./drawing";
import { Strand, pointFollowing, pointPreceding } from "./strand.js";
import PointedReturn from "./pointed-return";
import Contour from "./contour";
import offsetSketch from "./offset-sketch";
import {
  KnotElement,
  INode,
  IStrand,
  IContour,
  IPoint,
  PolyLine,
  CollectionIntersect,
  StrandElement,
} from "./types";
import {
  lines,
  markAsAdjacent,
  merge as mergeFrame,
  elementsForRemoval as frameElementsForRemoval,
} from "./frame";

export default function makeKnot(frame) {
  const contours = makeStrands(frame).map(Contour);
  return {
    frame,
    elements: [],
    contours,
    overUnders: makeOverUnders(contours),
  };
}

// TODO - removals should happen elsewhere
export function remove(knot) {
  if (knot.elements) {
    knot.elements.forEach((element: KnotElement) => element.remove());
  }
  frameElementsForRemoval(knot.frame).forEach(removeElement);
  // TODO - EWW
  // knot.frame.lines = [];
}

export function merge(
  knot: Knot,
  otherKnot: Knot,
  lineStart: INode,
  lineEnd: INode
) {
  remove(knot);
  remove(otherKnot);
  const mergedFrame = mergeFrame(knot.frame, otherKnot.frame);
  mergedFrame.adjacencyList = markAsAdjacent(
    lineStart,
    lineEnd,
    mergedFrame.nodes,
    mergedFrame.adjacencyList
  );
  mergedFrame.lines = lines(mergedFrame.nodes, mergedFrame.adjacencyList);
  mergedFrame.crossingPoints = mergedFrame.lines.map(
    (line) => line.crossingPoint
  );
  // TODO EWW - drawing should happen elsewhere
  mergedFrame.lines.forEach(drawLine);
  mergedFrame.nodes.forEach(drawNode);
  const mergedKnot = makeKnot(mergedFrame);
  draw(mergedKnot);
  mergedKnot.elements = knot.elements.concat(otherKnot.elements);
  return mergedKnot;
}

function makeStrands(frame) {
  const strands = [];
  while (frame.lines.some(uncrossed)) {
    strands.push(Strand(frame));
  }
  return strands;
}

export function addLineBetween(knot: Knot, nodeA: INode, nodeB: INode) {
  const { frame } = knot;
  frame.adjacencyList = markAsAdjacent(
    nodeA,
    nodeB,
    frame.nodes,
    frame.adjacencyList
  );
  frame.lines = lines(frame.nodes, frame.adjacencyList);
  frame.crossingPoints = frame.lines.map((line) => line.crossingPoint);
  frame.lines.forEach(drawLine);
  remove(knot);
  Object.assign(knot, makeKnot(frame));
  // knot.contours = makeStrands(frame).map(Contour);
  // TODO - was init call here - is it necessary?
  // TODO - move this draw call...
  // should return a new knot based on that frame...
  // this new know should be what's drawn...
  draw(knot);
}
function getUnder(point: IPoint, direction: "L" | "R", bound: "in" | "out") {
  if (bound === "out") {
    return direction === "R" ? point.underOutRight : point.underOutLeft;
  }
  return direction === "R" ? point.underInRight : point.underInLeft;
}
function trim(
  under: PolyLine,
  intersect: CollectionIntersect,
  bound: "in" | "out"
) {
  if (bound === "out") {
    mutate(under, under.slice(intersect.idxA + 1));
    under.unshift(intersect.intersection);
  } else if (bound === "in") {
    mutate(under, under.slice(0, intersect.idxA + 1));
    under.push(intersect.intersection);
  }
}
function trimUnder(point: IPoint, direction: "L" | "R", bound: "in" | "out") {
  const overLeft = point.overInLeft.concat(point.overOutLeft);
  const overRight = point.overInRight.concat(point.overOutRight);
  const under = getUnder(point, direction, bound);
  const intersect =
    collectionIntersect(under, overLeft) ||
    collectionIntersect(under, overRight);
  if (intersect) {
    trim(under, intersect, bound);
  }
}
function makeOverUnders(strands) {
  if (!strands) return;
  const crossingPointOffsets = strands.reduce(offsetSketch, new Map());
  strands.forEach((strand, index) => {
    strand.forEach((strandElement, idx) => {
      const point = strandElement.point;
      const sketchPoint = crossingPointOffsets.get(point);
      if (!strandElement.pr) {
        if (!point.trimmed) {
          trimUnder(sketchPoint, "R", "out");
          trimUnder(sketchPoint, "R", "in");
          trimUnder(sketchPoint, "L", "out");
          trimUnder(sketchPoint, "L", "in");
        }
        point.trimmed = true;
      }
    });
  });
  return crossingPointOffsets;
}

function elementsForDrawing(knot) {
  return knot.contours.reduce(
    function(result, strand) {
      const morePolylines = [];
      for (let i = 0; i < strand.length; i++) {
        const strandElement = strand[i];
        const offsets = knot.overUnders.get(strandElement.point);
        // now draw everything except PRs
        if (!(strandElement.pr || pointFollowing(i, strand).pr)) {
          morePolylines.push(...offsetPolyLines(knot, strandElement, offsets));
        } else if (strandElement.pr) {
          const pr = new PointedReturn({
            pr: strandElement,
            elements: knot.elements,
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          pr.draw(offsets);
          // // here we draw the PRs
        }
      }
      return {
        ...result,
        polylines: [...result.polylines, ...morePolylines],
      };
    },
    { polylines: [] }
  );
}

export function draw(knot) {
  if (!knot.contours) return;
  frameElementsForRemoval(knot.frame).forEach(removeElement);
  knot.frame.lines = lines(knot.frame.nodes, knot.frame.adjacencyList);
  knot.frame.crossingPoints = knot.frame.lines.map(
    (line) => line.crossingPoint
  );
  const { polylines } = elementsForDrawing(knot);
  polylines.forEach((polyline) => {
    const snp = drawPolyline(polyline);
    knot.elements && knot.elements.push(snp);
  });
  knot.frame.lines.forEach(drawLine);
  knot.frame.nodes.forEach(drawNode);
}

function offsetPolyLines(knot, strandElement: StrandElement, offsets) {
  function polylinePoints(outline) {
    return outline.reduce(reducer, []);
  }
  const { overOutLeft, overOutRight, underOutLeft, underOutRight } = offsets;
  return (strandElement.direction === "R"
    ? [overOutLeft, overOutRight]
    : [underOutLeft, underOutRight]
  ).map(polylinePoints);
}
