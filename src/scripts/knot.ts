import { collectionIntersect, format, mutate, reducer } from './knot-utils.js';
import surface from './main';
import { Strand, pointFollowing, pointPreceding } from './strand.js';
import PointedReturn from './pointed-return.js';
import Contour from './contour.js';
import OffsetSketch from './offset-sketch';
import {
  Frame,
  KnotElement,
  INode,
  IStrand,
  IContour,
  IPoint,
  PolyLine,
  CollectionIntersect,
  StrandElement,
} from './types';

export default class Knot {
  // TODO - can we make some of these private or protected?
  public frame: Frame;
  public elements?: KnotElement[];
  public offsetSketches?: OffsetSketch[];
  public strands?: IStrand[];
  public contours?: IContour[];

  constructor(frame: Frame) {
    this.frame = frame;
    this.init();
    this.draw();
  }
  remove() {
    if (this.elements) {
      this.elements.forEach((element: KnotElement) => element.remove());
    }
    this.frame.remove();
  }
  init() {
    this.elements = [];
    this.offsetSketches = this.makeOffsets();
    this.makeOverUnders();
  }
  merge(otherKnot: Knot, lineStart: INode, lineEnd: INode) {
    const mergedFrame = this.frame.merge(otherKnot.frame);
    mergedFrame.markAsAdjacent(lineStart, lineEnd);
    mergedFrame.draw();
    const mergedKnot = new Knot(mergedFrame);
    // TODO - this conditional is necessary because elements is undefined on objects before
    // calling init - maybe it would be neater if we initialize to an empty array or something,
    // so it can never be undefined
    if (this.elements && otherKnot.elements) {
      this.elements = this.elements.concat(otherKnot.elements);
    } else {
      // TODO - throw an error?
    }
    return mergedKnot;
  }
  makeStrands() {
    const strands = [];
    while (this.frame.lines.some(line => line.uncrossed())) {
      strands.push(Strand(this.frame));
    }
    return strands;
  }
  makeOffsets() {
    this.strands = this.makeStrands();
    this.contours = this.strands.map(strand => Contour(strand));
    return this.contours.map(contour => new OffsetSketch(contour));
  }
  addLineBetween(nodeA: INode, nodeB: INode) {
    this.frame.markAsAdjacent(nodeA, nodeB);
    this.frame.drawLines();
    this.init();
    this.draw();
  }
  getUnder(point: IPoint, direction: 'L' | 'R', bound: 'in' | 'out') {
    if (bound === 'out') {
      return direction === 'R' ? point.underOutRight : point.underOutLeft;
    }
    return direction === 'R' ? point.underInRight : point.underInLeft;
  }
  trim(under: PolyLine, intersect: CollectionIntersect, bound: 'in' | 'out') {
    if (bound === 'out') {
      mutate(under, under.slice(intersect.idxA + 1));
      under.unshift(intersect.intersection);
    } else if (bound === 'in') {
      mutate(under, under.slice(0, intersect.idxA + 1));
      under.push(intersect.intersection);
    }
  }
  trimUnder(point: IPoint, direction: 'L' | 'R', bound: 'in' | 'out') {
    const overLeft = point.overInLeft.concat(point.overOutLeft);
    const overRight = point.overInRight.concat(point.overOutRight);
    const under = this.getUnder(point, direction, bound);
    const intersect = collectionIntersect(under, overLeft) || collectionIntersect(under, overRight);
    if (intersect) {
      this.trim(under, intersect, bound);
    }
  }
  makeOverUnders() {
    // TODO - better to have this.strands always defined, so won't
    // need this check -- it could just sometimes be an empty array
    if (!this.strands) return;
    this.strands.forEach((strand) => {
      strand.forEach((cpORpr) => {
        const point = cpORpr.point;
        if (!cpORpr.pr) {
          if (!point.trimmed) {
            this.trimUnder(point, 'R', 'out');
            this.trimUnder(point, 'R', 'in');
            this.trimUnder(point, 'L', 'out');
            this.trimUnder(point, 'L', 'in');
          }

          point.trimmed = true;
        }
      });
    });
  }
  draw() {
    // TODO - better to have this.strands always defined, so won't
    // need this check -- it could just sometimes be an empty array
    if (!this.strands) return;
    this.strands.forEach((strand) => {
      strand.forEach((strandElement, i) => {
        // now draw everything except PRs
        if (!(strandElement.pr || pointFollowing(i, strand).pr)) {
          this.drawOffsets(strandElement);
        } else if (strandElement.pr) {
          // here we draw the PRs
          const pr = new PointedReturn({
            pr: strandElement,
            elements: this.elements,
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          pr.draw();
        }
      });
    });
    this.frame.remove();
    this.frame.draw();
  }
  drawOffsets(strandElement: StrandElement) {
    const point = strandElement.point;
    if (strandElement.direction === 'R') {
      this.drawPolyline(point.overOutLeft);
      this.drawPolyline(point.overOutRight);
    } else {
      this.drawPolyline(point.underOutLeft);
      this.drawPolyline(point.underOutRight);
    }
  }
  drawPolyline(outline: PolyLine) {
    const points = outline.reduce(reducer, []);
    const snp = surface.polyline(points);
    // TODO - better to have this.strands always defined, so won't
    // need this check -- it could just sometimes be an empty array
    this.elements && this.elements.push(snp);
    format(snp);
  }
}
