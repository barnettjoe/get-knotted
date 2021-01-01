import config from "./config";
import { polyline } from "./knot-utils";
import { pointFollowing } from "./strand";

const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;

export default function offsetSketch(result, contour) {
  function polyLineOffset(bezier, offset) {
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
    if (strandElement.direction === "R" || strandElement.pr === "L") {
      result.set(strandElement.point, {
        ...(result.get(strandElement.point) || {}),
        overOutLeft: leftOutboundOffset,
        overOutRight: rightOutboundOffset,
      });
      result.set(nextStrandElement.point, {
        ...(result.get(nextStrandElement.point) || {}),
        underInLeft: leftOutboundOffset,
        underInRight: rightOutboundOffset,
      });
    } else {
      result.set(strandElement.point, {
        ...(result.get(strandElement.point) || {}),
        underOutLeft: leftOutboundOffset,
        underOutRight: rightOutboundOffset,
      });
      result.set(nextStrandElement.point, {
        ...(result.get(nextStrandElement.point) || {}),
        overInLeft: leftOutboundOffset,
        overInRight: rightOutboundOffset,
      });
    }
  });
  return result;
}
