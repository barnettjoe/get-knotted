import Bezier from "./bezier/bezier";
import { reducer, collectionIntersect, mutate } from "./knot-utils";
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

  fixOffsets(offsets) {
    this.fixInnerOffsets(offsets);
    this.fixOuterOffsets(offsets);
  }
  clipOutboundPath(intersection, polyline) {
    const points = polyline.slice(0, intersection.idxA + 1);
    points.push(intersection.intersection);
    mutate(polyline, points);
  }
  clipInboundPath(intersection, polyline) {
    const points = polyline.slice(intersection.idxB + 1);
    points.unshift(intersection.intersection);
    mutate(polyline, points);
  }
  fixInnerOffsets(offsets: OverUnderPoint) {
    const direction = this.pr.pr;
    // get intersection of inner outbound with inner inbound
    if (direction === "L") {
      this.innerOutboundPolyline = offsets.underInLeft || offsets.overInLeft;
    } else {
      this.innerOutboundPolyline = offsets.underInRight || offsets.overInRight;
    }

    if (direction === "L") {
      this.innerInboundPolyline = offsets.underOutLeft || offsets.overOutLeft;
    } else {
      this.innerInboundPolyline = offsets.underOutRight || offsets.overOutRight;
    }

    const intersection = collectionIntersect(
      this.innerOutboundPolyline,
      this.innerInboundPolyline
    );
    // split at intersection point
    // concatenate part of outbound inner from before intersection,
    // with the part of inbound inner from after the intersection...
    this.clipOutboundPath(intersection, this.innerOutboundPolyline);
    this.clipInboundPath(intersection, this.innerInboundPolyline);
  }
  fixOuterOffsets(offsets: OverUnderPoint) {
    const direction = this.pr.pr;

    if (direction === "L") {
      this.outerOutboundPolyline = offsets.underInRight || offsets.overInRight;
    } else {
      this.outerOutboundPolyline = offsets.underInLeft || offsets.overInLeft;
    }

    if (direction === "L") {
      this.outerInboundPolyline = offsets.underOutRight || offsets.overOutRight;
    } else {
      this.outerInboundPolyline = offsets.underOutLeft || offsets.overOutLeft;
    }

    const innerTip = this.innerInboundPolyline[0];
    const midTip = this.options.middleInbound.points[0];
    const outerTip = {
      x: 2 * midTip.x - innerTip.x,
      y: 2 * midTip.y - innerTip.y,
    };

    mutate(
      this.outerOutboundPolyline,
      this.outerOutboundPolyline.concat([outerTip])
    );
    mutate(
      this.outerInboundPolyline,
      [outerTip].concat(this.outerInboundPolyline)
    );
  }
}
