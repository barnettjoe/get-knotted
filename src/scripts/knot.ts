import { collectionIntersect, mutate, reducer } from "./knot-utils";
import { uncrossed } from "./line";
import { Strand, pointFollowing, pointPreceding } from "./strand";
import PointedReturn from "./pointed-return";
import Contour from "./contour";
import addOffsetInfoToCrossingPoints from "./offset-sketch";
import {
  Contour as ContourType,
  Frame,
  INode,
  IStrand,
  Knot,
  OverUnderPoint,
  PolyLine,
  PolyLines,
  CollectionIntersect,
  StrandElement,
  OverUnders,
} from "./types";
import { lines, markAsAdjacent, merge as mergeFrame } from "./frame";

export default function makeKnot(frame: Frame): Knot {
  const contours = makeStrands(frame).map(Contour);
  const polylines = new Set();
  contours.forEach((contour) => {
    addOffsetInfoToCrossingPoints(contour, polylines);
  });
  trimUnders(frame);
  return {
    frame,
    contours,
    polylines,
  };
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
  const mergedKnot = makeKnot(mergedFrame);
  knotPolylines(mergedKnot);
  return mergedKnot;
}

function makeStrands(frame: Frame): IStrand[] {
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
  Object.assign(knot, makeKnot(frame));
  // knot.contours = makeStrands(frame).map(Contour);
  // TODO - was init call here - is it necessary?
  // TODO - move this draw call...
  // should return a new knot based on that frame...
  // this new know should be what's drawn...
  knotPolylines(knot);
}
function getUnder(
  point: OverUnderPoint,
  direction: "L" | "R",
  bound: "in" | "out"
) {
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
function trimUnder(
  point: OverUnderPoint,
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

function trimUnders(frame: Frame): void {
  const crossingPoints = frame.lines.map((line) => line.crossingPoint);
  crossingPoints.forEach((crossingPoint) => {
    trimUnder(crossingPoint, "R", "out");
    trimUnder(crossingPoint, "R", "in");
    trimUnder(crossingPoint, "L", "out");
    trimUnder(crossingPoint, "L", "in");
  });
}

export function knotPolylines(knot: Knot): PolyLines | null {
  knot.contours.forEach((strand) => {
    for (let i = 0; i < strand.length; i++) {
      const strandElement = strand[i];
      if (strandElement.pr) {
        const pr = new PointedReturn({
          pr: strandElement,
          middleOutbound: pointPreceding(i, strand).outboundBezier,
          middleInbound: strandElement.outboundBezier,
        });
        pr.fixOffsets(strandElement.point);
      }
    }
  });
  const result = [];
  knot.polylines.forEach((polyline) => {
    result.push(polylinePoints(polyline));
  });
  return result;
}

function polylinePoints(outline) {
  return outline.reduce(reducer, []);
}
function offsetPolyLines(strandElement: StrandElement) {
  const {
    overOutLeft,
    overOutRight,
    underOutLeft,
    underOutRight,
  } = strandElement.point;
  return (strandElement.direction === "R"
    ? [overOutLeft, overOutRight]
    : [underOutLeft, underOutRight]
  ).map(polylinePoints);
}
