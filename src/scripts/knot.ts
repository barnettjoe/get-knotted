import { collectionIntersect, mutate, flatten } from "./knot-utils";
import { uncrossed } from "./line";
import { Strand as makeStrand, pointPreceding } from "./strand";
import PointedReturn from "./pointed-return";
import makeContour from "./contour";
import addOffsetInfoToCrossingPoints from "./offset-sketch";
import {
  ContourWithOffsetInfo,
  Frame,
  FrameNode,
  Strand,
  Knot,
  PolyLines,
  CollectionIntersectionResult,
  PolyLine,
  FrameWithOffsetInfo,
  CrossingPointWithOffsetInfo,
} from "./types";
import { lines, markAsAdjacent, merge as mergeFrame } from "./frame";

export default function makeKnot(frame: Frame): Knot {
  const strands = makeStrands(frame);
  const contours = strands.map(makeContour);
  const polylines = new Set<PolyLine>();
  contours.forEach((contour) => {
    addOffsetInfoToCrossingPoints(contour, polylines);
  });
  const contoursWithOffsetInfo = contours as ContourWithOffsetInfo[];
  const frameWithOffsetInfo = frame as FrameWithOffsetInfo;
  trimUnders(frameWithOffsetInfo);
  return {
    frame: frameWithOffsetInfo,
    contours: contoursWithOffsetInfo,
    polylines,
  };
}

export function merge(
  knot: Knot,
  otherKnot: Knot,
  lineStart: FrameNode,
  lineEnd: FrameNode
): Knot {
  const mergedFrame = mergeFrame(knot.frame, otherKnot.frame);
  mergedFrame.adjacencyList = markAsAdjacent(
    lineStart,
    lineEnd,
    mergedFrame.nodes,
    mergedFrame.adjacencyList
  );
  mergedFrame.lines = lines(mergedFrame.nodes, mergedFrame.adjacencyList);
  return makeKnot(mergedFrame);
}

function makeStrands(frame: Frame): Strand[] {
  const strands = [];
  while (frame.lines.some(uncrossed)) {
    strands.push(makeStrand(frame));
  }
  return strands;
}

export function addLineBetween(
  knot: Knot,
  nodeA: FrameNode,
  nodeB: FrameNode
): void {
  const { frame } = knot;
  frame.adjacencyList = markAsAdjacent(
    nodeA,
    nodeB,
    frame.nodes,
    frame.adjacencyList
  );
  frame.lines = lines(frame.nodes, frame.adjacencyList);
  Object.assign(knot, makeKnot(frame));
}
function getUnder(
  point: CrossingPointWithOffsetInfo,
  direction: "L" | "R",
  bound: "in" | "out"
): PolyLine {
  if (bound === "out") {
    return direction === "R" ? point.underOutRight : point.underOutLeft;
  }
  return direction === "R" ? point.underInRight : point.underInLeft;
}
function trim(
  under: PolyLine,
  intersect: CollectionIntersectionResult,
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
function trimUnder(
  point: CrossingPointWithOffsetInfo,
  direction: "L" | "R",
  bound: "in" | "out"
) {
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

function trimUnders(frame: FrameWithOffsetInfo): void {
  const crossingPoints = frame.lines.map((line) => line.crossingPoint);
  crossingPoints.forEach((crossingPoint) => {
    trimUnder(crossingPoint, "R", "out");
    trimUnder(crossingPoint, "R", "in");
    trimUnder(crossingPoint, "L", "out");
    trimUnder(crossingPoint, "L", "in");
  });
}

function trimPointedReturns(contours: ContourWithOffsetInfo[]) {
  contours.forEach((contour) => {
    contour.forEach((contourElement, contourElementIdx) => {
      if (contourElement.pr) {
        // in creating the pointed return, we trim the offsets on the underlying points...
        new PointedReturn({
          direction: contourElement.pr,
          middleOutbound: pointPreceding(contourElementIdx, contour)
            .outboundBezier,
          middleInbound: contourElement.outboundBezier,
          point: contourElement.point,
        });
      }
    });
  });
}

export function knotPolylines(knot: Knot): PolyLines | null {
  // TODO - from its name it feels like knotPolylines should be a pure function,
  // but here we're doing some trimming - feels like this should be done in makeKnot instead
  trimPointedReturns(knot.contours);
  const result = [] as PolyLines;
  knot.polylines.forEach((polyline) => {
    result.push(polylinePoints(polyline));
  });
  return result;
}

function polylinePoints(outline: PolyLine) {
  return outline.reduce(flatten, []);
}
