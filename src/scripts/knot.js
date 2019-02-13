import { collectionIntersect, format, mutate, reducer } from './knot-utils.js';
import surface from './main.js';
import { Strand, pointFollowing, pointPreceding } from './strand.js';
import PointedReturn from './pointed-return.js';
import Contour from './contour.js';
import OffsetSketch from './offset-sketch';

export default function Knot(frame) {
  this.group = surface.g();
  this.frame = frame;

  this.remove = function() {
    this.group.remove();
  };

  this.offsetSketches =  this.makeOffsets();

  this.trimUnders();
  this.draw();
  this.frame.remove();
  this.frame.draw();
  // drawing.stopDrawingFrame();
}

Knot.prototype = {
  constructor: Knot,
  makeStrands() {
    const strands = [];
    while (this.frame.lines.some(line => line.uncrossed())) {
      strands.push(Strand(this.frame));
    }
    return strands;
  },
  makeOffsets() {
    this.strands = this.makeStrands();
    this.contours = this.strands.map(strand => Contour(strand));
    return this.contours.map(contour => new OffsetSketch(contour));
  },
  trimUnders() {
    this.strands.forEach(strand => {
      strand.forEach(cpORpr => {
        var point = cpORpr.point;
        if (!cpORpr.pr) {
          if (!cpORpr.point.trimmed) {
            var overLeft = point.overInLeft.concat(point.overOutLeft);
            var overRight = point.overInRight.concat(point.overOutRight);
            var intersectLOut =
              collectionIntersect(point.underOutLeft, overLeft) ||
              collectionIntersect(point.underOutLeft, overRight);
            var intersectROut =
              collectionIntersect(point.underOutRight, overLeft) ||
              collectionIntersect(point.underOutRight, overRight);
            var intersectLIn =
              collectionIntersect(point.underInLeft, overLeft) ||
              collectionIntersect(point.underInLeft, overRight);
            var intersectRIn =
              collectionIntersect(point.underInRight, overLeft) ||
              collectionIntersect(point.underInRight, overRight);

            mutate(point.underOutLeft, point.underOutLeft.slice(intersectLOut.idxA + 1));
            mutate(point.underOutRight, point.underOutRight.slice(intersectROut.idxA + 1));
            mutate(point.underInLeft, point.underInLeft.slice(0, intersectLIn.idxA + 1));
            mutate(point.underInRight, point.underInRight.slice(0, intersectRIn.idxA + 1));

            point.underOutLeft.unshift(intersectLOut.intersection);
            point.underOutRight.unshift(intersectROut.intersection);
            point.underInLeft.push(intersectLIn.intersection);
            point.underInRight.push(intersectRIn.intersection);
          }

          cpORpr.point.trimmed = true;
        }
      });
    });
  },
  draw() {
    this.strands.forEach(strand => {
      strand.forEach((strandElement, i) => {
        // now draw everything except PRs
        if (!(strandElement.pr || pointFollowing(i, strand).pr)) {
          var point = strandElement.point;
          if (strandElement.direction === 'R') {
            this.drawOutline(point.overOutLeft);
            this.drawOutline(point.overOutRight);
          } else {
            this.drawOutline(point.underOutLeft);
            this.drawOutline(point.underOutRight);
          }
        } else if (strandElement.pr) {
          // here we draw the PRs
          var pr = new PointedReturn({
            pr: strandElement,
            group: this.group,
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          pr.draw();
        }
      });
    });
  },
  drawOutline(outline) {
    var points = outline.reduce(reducer, []);
    var snp = surface.polyline(points);
    this.group.add(snp);
    format(snp);
  },
};
