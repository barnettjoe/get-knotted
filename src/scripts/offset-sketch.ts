import config from "./config.js";
import { polyline } from "./knot-utils.js";
import { pointFollowing } from "./strand.js";

export default class OffsetSketch {
  constructor(contour) {
    contour.forEach((point, index) => {
      const next = pointFollowing(index, contour);
      const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
      const leftOutboundOffset = this.polyLineOffset(
        point.outboundBezier,
        -offset
      );
      const rightOutboundOffset = this.polyLineOffset(
        point.outboundBezier,
        offset
      );
      if (point.direction === "R" || point.pr === "L") {
        point.point.overOutLeft = leftOutboundOffset;
        point.point.overOutRight = rightOutboundOffset;
        next.point.underInLeft = leftOutboundOffset;
        next.point.underInRight = rightOutboundOffset;
      } else {
        point.point.underOutLeft = leftOutboundOffset;
        point.point.underOutRight = rightOutboundOffset;
        next.point.overInLeft = leftOutboundOffset;
        next.point.overInRight = rightOutboundOffset;
      }
      this.result = contour;
    });
  }
  polyLineOffset(bezier, offset) {
    const reduced = bezier.reduce();
    const polyBezier = reduced.map((segment) => segment.scale(offset));
    const result = polyline(polyBezier);
    return result;
  }
  assignOffsets() {}
}
