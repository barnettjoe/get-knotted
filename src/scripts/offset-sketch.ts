import config from "./config";
import { pointFollowing } from "./strand";
import { Contour, ContourElement, PolyLine, Point } from "./types";
import { Bezier } from "bezier-js";
import { normal, lineVector, addVectors, scaleVector } from "./general-utils";
import { options } from "./options";

const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;

function polyline(bezier: Bezier) {
  return bezier.getLUT(config.resolution) as Point[];
}

function offsetPolyline(bezier: Bezier, offset: number): PolyLine {
  const points = polyline(bezier);
  const result = [];
  // TODO - this is a really dirty way of offsetting a polyline. it produces
  // a polyline with gaps in (that's fine - we can fill them in when we draw...)
  // It's not using bevels or mitres or anything fancy...the start point of each segment
  // is offset according to the normal of that segment. That just leaves the very last
  // point, which we also offset by the normal of the last section.
  // really, it makes a mess - should convert this to doing mitres or something properly
  for (let i = 0; i < points.length - 1; i++) {
    const sectionStart = points[i];
    const sectionEnd = points[i + 1];
    const norm = normal(
      lineVector([sectionStart.x, sectionStart.y], [sectionEnd.x, sectionEnd.y])
    );
    const newStart = addVectors(scaleVector(norm, offset), [
      sectionStart.x,
      sectionStart.y,
    ]);
    result.push({ x: newStart[0], y: newStart[1] });
    if (i === points.length - 2) {
      const newEnd = addVectors(scaleVector(norm, offset), [
        sectionEnd.x,
        sectionEnd.y,
      ]);
      result.push({ x: newEnd[0], y: newEnd[1] });
    }
  }
  return result;
}

function addOffsetDrawingInfo(
  contour: Contour,
  strandElement: ContourElement,
  strandIdx: number,
  polylines: Set<PolyLine>
) {
  const nextStrandElement = pointFollowing(strandIdx, contour);

  const leftOutboundOffset = offsetPolyline(
    strandElement.outboundBezier,
    -offset
  );
  const rightOutboundOffset = offsetPolyline(
    strandElement.outboundBezier,
    offset
  );
  polylines.add(leftOutboundOffset);
  polylines.add(rightOutboundOffset);
  if (strandElement.direction === "R" || strandElement.pr === "L") {
    Object.assign(strandElement.point, {
      overOutLeft: leftOutboundOffset,
      overOutRight: rightOutboundOffset,
    });
    Object.assign(nextStrandElement.point, {
      underInLeft: leftOutboundOffset,
      underInRight: rightOutboundOffset,
    });
  } else {
    Object.assign(strandElement.point, {
      underOutLeft: leftOutboundOffset,
      underOutRight: rightOutboundOffset,
    });
    Object.assign(nextStrandElement.point, {
      overInLeft: leftOutboundOffset,
      overInRight: rightOutboundOffset,
    });
  }
}

function addContourDrawingInfo(
  strandElement: ContourElement,
  polylines: Set<PolyLine>
) {
  polylines.add(polyline(strandElement.outboundBezier));
}

export default function addDrawingInfoToCrossingPoints(
  contour: Contour,
  polylines: Set<PolyLine>
): void {
  contour.forEach((strandElement, index) => {
    if (options.offsetContour) {
      addOffsetDrawingInfo(contour, strandElement, index, polylines);
    } else {
      addContourDrawingInfo(strandElement, polylines);
    }
  });
}
