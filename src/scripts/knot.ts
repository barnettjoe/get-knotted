import { collectionIntersect, mutate, flatten } from "./knot-utils";
import { pointPreceding, compactRepresentation } from "./strand";
import PointedReturn from "./pointed-return";
import { makeContour } from "./contour";
import addDrawingInfoToCrossingPoints from "./offset-sketch";
import {
  ContourWithOffsetInfo,
  Frame,
  Knot,
  PolyLines,
  CollectionIntersectionResult,
  PolyLine,
  FrameWithOffsetInfo,
  CrossingPointWithOffsetInfo,
} from "./types";
import Drawing from "./drawing";

function assertNotNullable<T>(val: T): asserts val is NonNullable<T> {
  if (val === null || val === undefined)
    throw new Error("unexpected nullable value");
}

export default function computeKnot(frame: Frame, drawing: Drawing): Knot {
  const { strands } = drawing;
  assertNotNullable(strands);
  const compactStrands = strands.map((strand) => compactRepresentation(strand));
  // TODO - for now we still have to pass the strands in in the original (i.e. non-compact) format...
  const contours = compactStrands.map(([strandTopology, strandPoints], idx) =>
    makeContour(strandTopology, strandPoints, strands[idx])
  );
  const polylines = new Set<PolyLine>();
  contours.forEach((contour) => {
    addDrawingInfoToCrossingPoints(contour, polylines, drawing);
  });
  const contoursWithOffsetInfo = contours as ContourWithOffsetInfo[];
  const frameWithOffsetInfo = frame as FrameWithOffsetInfo;
  if (drawing.options.offsetContour) {
    trimUnders(frameWithOffsetInfo);
  }
  return {
    frame: frameWithOffsetInfo,
    contours: contoursWithOffsetInfo,
    polylines,
  };
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

export function knotPolylines(knot: Knot, drawing: Drawing) {
  // TODO - from its name it feels like knotPolylines should be a pure function,
  // but here we're doing some trimming - feels like this should be done in makeKnot instead
  if (drawing.options.offsetContour) {
    trimPointedReturns(knot.contours);
  }
  const result = [] as PolyLines;
  knot.polylines.forEach((polyline) => {
    result.push(polylinePoints(polyline));
  });
  return result;
}

function polylinePoints(outline: PolyLine) {
  return outline.reduce(flatten, []);
}
