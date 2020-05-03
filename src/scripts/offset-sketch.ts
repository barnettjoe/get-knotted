import config from "./config.js";
import { polyline } from "./knot-utils.js";
import { pointFollowing } from "./strand.js";

/**
 * TODO - currently, this mutates the crosspoints that
 * were created along with the original frame, to add
 * the offset beziers attached to each one.
 * It would be cleaner if, instead, it just returned a Map,
 * where the keys are those crossing points objects (unmutated),
 * and the values are objects containing the new informatiom
 * on offset beziers.
 */
export default function offsetSketch(contour) {
  function polyLineOffset(bezier, offset) {
    const reduced = bezier.reduce();
    const polyBezier = reduced.map((segment) => segment.scale(offset));
    const result = polyline(polyBezier);
    return result;
  }
  contour.forEach((strandElement, index) => {
    const nextStrandElement = pointFollowing(index, contour);
    const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
    const leftOutboundOffset = polyLineOffset(
      strandElement.outboundBezier,
      -offset
    );
    const rightOutboundOffset = polyLineOffset(
      strandElement.outboundBezier,
      offset
    );
    if (strandElement.direction === "R" || strandElement.pr === "L") {
      strandElement.point.overOutLeft = leftOutboundOffset;
      strandElement.point.overOutRight = rightOutboundOffset;
      nextStrandElement.point.underInLeft = leftOutboundOffset;
      nextStrandElement.point.underInRight = rightOutboundOffset;
    } else {
      strandElement.point.underOutLeft = leftOutboundOffset;
      strandElement.point.underOutRight = rightOutboundOffset;
      nextStrandElement.point.overInLeft = leftOutboundOffset;
      nextStrandElement.point.overInRight = rightOutboundOffset;
    }
  });
  return { result: contour };
}
