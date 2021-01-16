import Bezier from "./bezier/bezier";
import { collectionIntersect, mutate } from "./knot-utils";
import {
  Direction,
  XYPolyLine,
  PointedReturnPointWithOffsetInfo,
  CollectionIntersectionResult,
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
  private innerInboundPolyline: XYPolyLine;
  private innerOutboundPolyline: XYPolyLine;
  private outerInboundPolyline: XYPolyLine;
  private outerOutboundPolyline: XYPolyLine;
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
    this.fixOffsets();
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
  fixOffsets() {
    this.fixInnerOffsets();
    this.fixOuterOffsets();
  }
  clipOutboundPath(
    intersection: CollectionIntersectionResult,
    polyline: XYPolyLine
  ): void {
    const points = polyline.slice(0, intersection.idxA + 1);
    points.push(intersection.intersection);
    mutate(polyline, points);
  }
  clipInboundPath(
    intersection: CollectionIntersectionResult,
    polyline: XYPolyLine
  ): void {
    const points = polyline.slice(intersection.idxB + 1);
    points.unshift(intersection.intersection);
    mutate(polyline, points);
  }
  fixInnerOffsets() {
    // get intersection of inner outbound with inner inbound

    const intersection = collectionIntersect(
      this.innerOutboundPolyline,
      this.innerInboundPolyline
    );
    if (!intersection) {
      throw new Error("no intersection found");
    }
    // split at intersection point
    // concatenate part of outbound inner from before intersection,
    // with the part of inbound inner from after the intersection...
    this.clipOutboundPath(intersection, this.innerOutboundPolyline);
    this.clipInboundPath(intersection, this.innerInboundPolyline);
  }
  fixOuterOffsets() {
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
