import { collectionIntersect, format, mutate, reducer } from "./knot-utils.js";
import surface from "./main";
import { Strand, pointFollowing, pointPreceding } from "./strand.js";
import PointedReturn from "./pointed-return.js";
import Contour from "./contour";
import offsetSketch from "./offset-sketch";
import {
  KnotElement,
  INode,
  IStrand,
  IContour,
  IPoint,
  PolyLine,
  CollectionIntersect,
  StrandElement,
} from "./types";
import Frame from "frame";

export default class Knot {
  // TODO - can we make some of these private or protected?
  public frame: Frame;
  public elements?: KnotElement[];
  public offsetSketches?: offsetSketch[];
  public strands?: IStrand[];
  public contours?: IContour[];

  constructor(frame: Frame) {
    this.frame = frame;
    this.crossingPoints = new Map();
    frame.crossingPoints.forEach((cp) => {
      this.crossingPoints.set(cp, {});
    });
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
    const strands = this.makeStrands();
    this.contours = strands.map(Contour);
    this.offsetSketches = this.contours.reduce(offsetSketch, new Map());
    // mutates the offset sketches
    this.overUnders = this.makeOverUnders(strands, this.offsetSketches);
  }
  merge(otherKnot: Knot, lineStart: INode, lineEnd: INode) {
    const mergedFrame = this.frame.merge(otherKnot.frame);
    mergedFrame.markAsAdjacent(lineStart, lineEnd);
    mergedFrame.makeLines();
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
    while (this.frame.lines.some((line) => line.uncrossed())) {
      strands.push(Strand(this.frame));
    }
    return strands;
  }
  addLineBetween(nodeA: INode, nodeB: INode) {
    this.frame.markAsAdjacent(nodeA, nodeB);
    this.frame.makeLines();
    this.frame.lines.forEach((line) => line.draw());
    this.init();
    this.draw();
  }
  getUnder(point: IPoint, direction: "L" | "R", bound: "in" | "out") {
    if (bound === "out") {
      return direction === "R" ? point.underOutRight : point.underOutLeft;
    }
    return direction === "R" ? point.underInRight : point.underInLeft;
  }
  trim(under: PolyLine, intersect: CollectionIntersect, bound: "in" | "out") {
    if (bound === "out") {
      mutate(under, under.slice(intersect.idxA + 1));
      under.unshift(intersect.intersection);
    } else if (bound === "in") {
      mutate(under, under.slice(0, intersect.idxA + 1));
      under.push(intersect.intersection);
    }
  }
  trimUnder(point: IPoint, direction: "L" | "R", bound: "in" | "out") {
    const overLeft = point.overInLeft.concat(point.overOutLeft);
    const overRight = point.overInRight.concat(point.overOutRight);
    const under = this.getUnder(point, direction, bound);
    const intersect =
      collectionIntersect(under, overLeft) ||
      collectionIntersect(under, overRight);
    if (intersect) {
      this.trim(under, intersect, bound);
    }
  }
  makeOverUnders(strands, offsetSketches) {
    // TODO - better to have this.strands always defined, so won't
    // need this check -- it could just sometimes be an empty array
    if (!strands) return;
    strands.forEach((strand, index) => {
      strand.forEach((strandElement, idx) => {
        const point = strandElement.point;
        const sketchPoint = offsetSketches.get(point);
        if (!strandElement.pr) {
          if (!point.trimmed) {
            this.trimUnder(sketchPoint, "R", "out");
            this.trimUnder(sketchPoint, "R", "in");
            this.trimUnder(sketchPoint, "L", "out");
            this.trimUnder(sketchPoint, "L", "in");
          }
          point.trimmed = true;
        }
      });
    });
  }
  draw() {
    // TODO - better to have this.strands always defined, so won't
    // need this check -- it could just sometimes be an empty array
    if (!this.contours) return;
    this.contours.forEach((strand) => {
      strand.forEach((strandElement, i) => {
        const offsets = this.offsetSketches.get(strandElement.point);
        // now draw everything except PRs
        if (!(strandElement.pr || pointFollowing(i, strand).pr)) {
          this.drawOffsets(strandElement, offsets);
        } else if (strandElement.pr) {
          // here we draw the PRs
          const pr = new PointedReturn({
            pr: strandElement,
            elements: this.elements,
            middleOutbound: pointPreceding(i, strand).outboundBezier,
            middleInbound: strandElement.outboundBezier,
          });
          pr.draw(offsets);
        }
      });
    });
    this.frame.remove();
    this.frame.makeLines();
    this.frame.draw();
  }
  drawOffsets(strandElement: StrandElement, offsets) {
    const point = strandElement.point;
    if (strandElement.direction === "R") {
      this.drawPolyline(offsets.overOutLeft);
      this.drawPolyline(offsets.overOutRight);
    } else {
      this.drawPolyline(offsets.underOutLeft);
      this.drawPolyline(offsets.underOutRight);
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
