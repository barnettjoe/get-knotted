import { collectionIntersect, mutate, reducer } from "./knot-utils";
import { uncrossed } from "./line";
import { Strand, pointFollowing, pointPreceding } from "./strand";
import PointedReturn from "./pointed-return";
import Contour from "./contour";
import offsetSketch from "./offset-sketch";
import {
  Frame,
  INode,
  Knot,
  OverUnderPoint,
  PolyLine,
  CollectionIntersect,
  StrandElement,
  OverUnders,
} from "./types";
import { lines, markAsAdjacent, merge as mergeFrame } from "./frame";

export default function makeKnot(frame: Frame): Knot {
  const contours = makeStrands(frame).map(Contour);
  return {
    frame,
    contours,
    overUnders: makeOverUnders(contours),
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

function makeOverUnders(strands): OverUnders {
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

export function knotPolylines(knot) {
  if (!knot.contours) return;
  knot.frame.lines = lines(knot.frame.nodes, knot.frame.adjacencyList);
  return knot.contours.reduce(function(result, strand) {
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
        const prPolylines = pr.draw(offsets);
        morePolylines.push(...prPolylines);
        // // here we draw the PRs
      }
    }
    return [...result, ...morePolylines];
  }, []);
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
