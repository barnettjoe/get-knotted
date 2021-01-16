import Bezier from "./bezier/bezier";
import { collectionIntersect, mutate } from "./knot-utils";
import {
  CrossingPoint,
  PointedReturnPoint,
  Direction,
  OffsetInfo,
  PolyLine,
  PointedReturnPointWithOffsetInfo,
} from "./types";

interface PointedReturnOptions {
  direction: Direction;
  middleInbound: Bezier;
  middleOutbound: Bezier;
  point: PointedReturnPointWithOffsetInfo;
}
export default class PointedReturn {
  options: PointedReturnOptions;
  direction: Direction;
  private innerInboundPolyline: PolyLine;
  private innerOutboundPolyline: PolyLine;
  private outerInboundPolyline: PolyLine;
  private outerOutboundPolyline: PolyLine;
  constructor(options: PointedReturnOptions) {
    this.options = options;
    this.direction = options.direction;
    const {
      innerInboundPolyline,
      innerOutboundPolyline,
      outerInboundPolyline,
      outerOutboundPolyline,
    } = this.organizeOffsets(options.point);
    this.innerInboundPolyline = innerInboundPolyline;
    this.innerOutboundPolyline = innerOutboundPolyline;
    this.outerInboundPolyline = outerInboundPolyline;
    this.outerOutboundPolyline = outerOutboundPolyline;
    this.fixOffsets(options.point);
  }
  organizeOffsets(offsets: PointedReturnPointWithOffsetInfo) {
    let innerInboundPolyline;
    let innerOutboundPolyline;
    let outerInboundPolyline;
    let outerOutboundPolyline;
    if (this.direction === "L") {
      innerOutboundPolyline = offsets.underInLeft || offsets.overInLeft;
    } else {
      innerOutboundPolyline = offsets.underInRight || offsets.overInRight;
    }

    if (this.direction === "L") {
      innerInboundPolyline = offsets.underOutLeft || offsets.overOutLeft;
    } else {
      innerInboundPolyline = offsets.underOutRight || offsets.overOutRight;
    }

    if (this.direction === "L") {
      outerOutboundPolyline = offsets.underInRight || offsets.overInRight;
    } else {
      outerOutboundPolyline = offsets.underInLeft || offsets.overInLeft;
    }

    if (this.direction === "L") {
      outerInboundPolyline = offsets.underOutRight || offsets.overOutRight;
    } else {
      outerInboundPolyline = offsets.underOutLeft || offsets.overOutLeft;
    }

    return {
      innerInboundPolyline,
      innerOutboundPolyline,
      outerInboundPolyline,
      outerOutboundPolyline,
    };
  }
  fixOffsets(offsets: PointedReturnPointWithOffsetInfo) {
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
  fixInnerOffsets(offsets: OffsetInfo) {
    // get intersection of inner outbound with inner inbound

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
  fixOuterOffsets(offsets: OffsetInfo) {
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
