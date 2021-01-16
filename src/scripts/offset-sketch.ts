import config from "./config";
import { polyline } from "./knot-utils";
import { pointFollowing } from "./strand";
import { Contour, XYPolyLine } from "./types";
import Bezier from "./bezier/bezier";

const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;

export default function addOffsetInfoToCrossingPoints(
  contour: Contour,
  polylines: Set<XYPolyLine>
) {
  function polyLineOffset(bezier: Bezier, offset: number): XYPolyLine {
    return polyline(bezier.reduce().map((segment) => segment.scale(offset)));
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
