import config from "./config.js";
import { polyline } from "./knot-utils.js";
import { pointFollowing } from "./strand.js";

const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
/**
 * TODO - currently, this mutates the crosspoints that
 * were created along with the original frame, to add
 * the offset beziers attached to each one.
 * It would be cleaner if, instead, it just returned a Map,
 * where the keys are those crossing points objects (unmutated),
 * and the values are objects containing the new informatiom
 * on offset beziers.
 */
export default function offsetSketch(result, contour) {
  function polyLineOffset(bezier, offset) {
    const reduced = bezier.reduce();
    const polyBezier = reduced.map((segment) => segment.scale(offset));
    const result = polyline(polyBezier);
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
