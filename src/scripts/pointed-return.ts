import Bezier from "./bezier/bezier";
import { reducer, collectionIntersect } from "./knot-utils";
import { StrandElement, OverUnderPoint } from "./types";

interface PointedReturnOptions {
  pr: StrandElement;
  middleInbound: Bezier;
  middleOutbound: Bezier;
}
export default class PointedReturn {
  options: PointedReturnOptions;
  pr: StrandElement;
  constructor(options: PointedReturnOptions) {
    this.options = options;
    this.pr = options.pr;
  }

  offsets(offsets) {
    return [this.innerOffsets(offsets), this.outerOffsets(offsets)];
  }
  clippedOutboundPath(intersection, polyline) {
    const points = polyline.slice(0, intersection.idxA + 1);
    points.push(intersection.intersection);
    return points;
  }
  clippedInboundPath(intersection, polyline) {
    const points = polyline.slice(intersection.idxB + 1);
    points.unshift(intersection.intersection);
    return points;
  }
  innerOffsets(offsets: OverUnderPoint) {
    const direction = this.pr.pr;
    // get intersection of inner outbound with inner inbound
    let innerOutboundPolyline;
    if (direction === "L") {
      innerOutboundPolyline = offsets.underInLeft || offsets.overInLeft;
    } else {
      innerOutboundPolyline = offsets.underInRight || offsets.overInRight;
    }

    let innerInboundPolyline;
    if (direction === "L") {
      innerInboundPolyline = offsets.underOutLeft || offsets.overOutLeft;
    } else {
      innerInboundPolyline = offsets.underOutRight || offsets.overOutRight;
    }

    const intersection = collectionIntersect(
      innerOutboundPolyline,
      innerInboundPolyline
    );
    // split at intersection point
    // concatenate part of outbound inner from before intersection,
    // with the part of inbound inner from after the intersection...
    this.outClipped = this.clippedOutboundPath(
      intersection,
      innerOutboundPolyline
    );
    this.inClipped = this.clippedInboundPath(
      intersection,
      innerInboundPolyline
    );
    return this.outClipped.concat(this.inClipped).reduce(reducer, []);
  }
  outerOffsets(offsets: OverUnderPoint) {
    const direction = this.pr.pr;

    let outerOutboundPolyline;
    if (direction === "L") {
      outerOutboundPolyline = offsets.underInRight || offsets.overInRight;
    } else {
      outerOutboundPolyline = offsets.underInLeft || offsets.overInLeft;
    }

    let outerInboundPolyline;
    if (direction === "L") {
      outerInboundPolyline = offsets.underOutRight || offsets.overOutRight;
    } else {
      outerInboundPolyline = offsets.underOutLeft || offsets.overOutLeft;
    }

    const innerTip = this.inClipped[0];
    const midTip = this.options.middleInbound.points[0];
    const outerTip = {
      x: 2 * midTip.x - innerTip.x,
      y: 2 * midTip.y - innerTip.y,
    };

    const points = outerOutboundPolyline.concat(
      [outerTip].concat(outerInboundPolyline)
    );
    return points.reduce(reducer, []);
  }
}
