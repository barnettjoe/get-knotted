import { collectionIntersect, mutate, reducer } from "./knot-utils";
import { uncrossed } from "./line";
import { Strand, pointFollowing, pointPreceding } from "./strand";
import PointedReturn from "./pointed-return";
import Contour from "./contour";
import offsetSketch from "./offset-sketch";
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
  const overUnders = makeOverUnders(contours, frame);
  if (overUnders === null) {
    throw new Error("failed to create overUnders");
  }
  return {
    frame,
    contours,
    overUnders,
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

function makeOverUnders(
  strands: ContourType[],
  frame: Frame
): OverUnders | null {
  if (!strands) return null;
  const crossingPointOffsets = strands.reduce(offsetSketch, new Map());
  const crossingPoints = frame.lines.map((line) => line.crossingPoint);
  crossingPoints.forEach((crossingPoint) => {
    const sketchPoint = crossingPointOffsets.get(crossingPoint);
    trimUnder(sketchPoint, "R", "out");
    trimUnder(sketchPoint, "R", "in");
    trimUnder(sketchPoint, "L", "out");
    trimUnder(sketchPoint, "L", "in");
  });
  return crossingPointOffsets;
}

export function knotPolylines(knot: Knot): PolyLines | null {
  if (!knot.contours) return null;
  knot.frame.lines = lines(knot.frame.nodes, knot.frame.adjacencyList);
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
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          morePolylines.push(...pr.offsets(offsets));
        }
      }
      return [...result, ...morePolylines];
    },
    [] as PolyLines
  );
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
