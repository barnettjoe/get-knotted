import config from './config.js';
import { polyline, removeStubs } from './knot-utils.js';
import { pointFollowing } from './strand.js';
import { paint } from './debug-tools.js';

export default function OffsetSketch(contour) {
  this.contour = contour;
  this.assignOffsets();
}

OffsetSketch.prototype = {
  constructor: OffsetSketch,
  polyLineOffset(bezier, offset) {
    const polyBezier = this.safeOffset(bezier, offset);
    const result = polyline(polyBezier);
    return result;
  },
  safeOffset(bezier, offset) {
    if (bezier.points[0].x === 386 & bezier.points[0].y === 386) {
      debugger;
    }
    const simpleNonStubs = removeStubs(bezier.reduce());
    return simpleNonStubs.reduce((acc, nonStub) => {
      return acc.concat(this.safeScale(nonStub, offset));
    }, []);
  },
  safeScale(bez, offset) {
    try {
      return [bez.scale(offset)];
    }
    catch(error) {
      // need to reduce again...
      console.log(error.message);
      const offsetBezCollections = bez.reduce().map(bez => {
        return this.safeOffset(bez, offset);
      });

      const oneBigOffsetBezCollection = offsetBezCollections.reduce(function (acc, offsetCollection) {
        return acc.concat(offsetCollection);
      });

      return oneBigOffsetBezCollection;
    }
  },
  createOffsets(point) {
    const offset = (config.knot.strokeWidth + config.knot.borderWidth) / 2;
    point.leftOutboundOffset = this.polyLineOffset(point.outboundBezier, -offset);
    if (point.leftOutboundOffset[0].x === 384.804907793169 && point.leftOutboundOffset[0].y === 365.66098760072407) {
      paint(point.outboundBezier, 'blue');
      paint(point.leftOutboundOffset, 'green');
      debugger;
    }

    point.rightOutboundOffset = this.polyLineOffset(point.outboundBezier, offset);
  },
  labelOffsets(point, next) {
    if (point.direction === 'R' || point.pr === 'L') {
      point.point.overOutLeft = point.leftOutboundOffset;
      point.point.overOutRight = point.rightOutboundOffset;
      next.point.underInLeft = point.leftOutboundOffset;
      next.point.underInRight = point.rightOutboundOffset;
    } else {
      point.point.underOutLeft = point.leftOutboundOffset;
      point.point.underOutRight = point.rightOutboundOffset;
      next.point.overInLeft = point.leftOutboundOffset;
      next.point.overInRight = point.rightOutboundOffset;
    }
  },
  assignOffsets() {
    this.contour.forEach((point, index) => {
      const next = pointFollowing(index, this.contour);
      this.createOffsets(point);
      this.labelOffsets(point, next);
    });
  },
};