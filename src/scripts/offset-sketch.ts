import config from "./config";
import { pointFollowing } from "./strand";
import { Contour, PolyLine, Point } from "./types";
import { Bezier } from "bezier-js";
import { normal, lineVector, addVectors, scaleVector } from "./general-utils";

const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;

export default function addOffsetInfoToCrossingPoints(
  contour: Contour,
  polylines: Set<PolyLine>
) {
  function polyLineOffset(bezier: Bezier, offset: number): PolyLine {
    const points = bezier.getLUT(config.resolution) as Point[];
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
        lineVector(
          [sectionStart.x, sectionStart.y],
          [sectionEnd.x, sectionEnd.y]
        )
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
  contour.forEach((strandElement, index) => {
    const nextStrandElement = pointFollowing(index, contour);

    const leftOutboundOffset = polyLineOffset(
      strandElement.outboundBezier,
      -offset
    );
    const rightOutboundOffset = polyLineOffset(
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
  });
}
