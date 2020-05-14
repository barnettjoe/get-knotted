import { collectionIntersect, format, mutate, reducer } from "./knot-utils.js";
import surface from "./main";
import { uncrossed } from "./line";
import { drawLine, drawNode, removeElement } from "./drawing";
import { Strand, pointFollowing, pointPreceding } from "./strand.js";
import PointedReturn from "./pointed-return.js";
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
  // TODO - move this elsewhere...
  const knot = {
    frame,
    elements: [],
    contours,
    overUnders: makeOverUnders(contours),
  };
  draw(knot);
  return knot;
}

// TODO - removals should happen elsewhere
export function remove(knot) {
  if (knot.elements) {
    knot.elements.forEach((element: KnotElement) => element.remove());
  }
  frameElementsForRemoval(knot.frame).forEach(removeElement);
  // TODO - EWW
  knot.frame.lines = [];
}

export function merge(
  knot: Knot,
  otherKnot: Knot,
  lineStart: INode,
  lineEnd: INode
) {
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
  // TODO - was init call here - is it necessary?
  // TODO - move this draw call...
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
function draw(knot) {
  // TODO - better to have this.strands always defined, so won't
  // need this check -- it could just sometimes be an empty array
  if (!knot.contours) return;
  knot.contours.forEach((strand) => {
    strand.forEach((strandElement, i) => {
      const offsets = knot.overUnders.get(strandElement.point);
      // now draw everything except PRs
      if (!(strandElement.pr || pointFollowing(i, strand).pr)) {
        drawOffsets(knot, strandElement, offsets);
      } else if (strandElement.pr) {
        // here we draw the PRs
        const pr = new PointedReturn({
          pr: strandElement,
          elements: knot.elements,
          middleOutbound: pointPreceding(i, strand).outboundBezier,
          middleInbound: strandElement.outboundBezier,
        });
        pr.draw(offsets);
      }
    });
  });
  frameElementsForRemoval(knot.frame).forEach(removeElement);
  knot.frame.lines = lines(knot.frame.nodes, knot.frame.adjacencyList);
  knot.frame.crossingPoints = knot.frame.lines.map(
    (line) => line.crossingPoint
  );

  knot.frame.lines.forEach(drawLine);
  knot.frame.nodes.forEach(drawNode);
}
function drawOffsets(knot, strandElement: StrandElement, offsets) {
  if (strandElement.direction === "R") {
    drawPolyline(knot, offsets.overOutLeft);
    drawPolyline(knot, offsets.overOutRight);
  } else {
    drawPolyline(knot, offsets.underOutLeft);
    drawPolyline(knot, offsets.underOutRight);
  }
}
function drawPolyline(knot, outline: PolyLine) {
  const points = outline.reduce(reducer, []);
  const snp = surface.polyline(points);
  // TODO - better to have this.strands always defined, so won't
  // need this check -- it could just sometimes be an empty array
  knot.elements && knot.elements.push(snp);
  format(snp);
}
