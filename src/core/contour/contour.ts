/*
  Our goal here is to produce for each strand a set of
  bezier curves which fit together in a manner that satisfies
  some constraints.

  We're using cubic beziers, so each curve is defined by 4 points: a
  start point P0, two control points P1 and P2, and an end point P3.

  Our constraints are given in terms of parametric continuity.
  Some useful links for background:
  https://people.eecs.berkeley.edu/~jfc/cs184f98/lec19/lec19.html
  https://en.wikipedia.org/wiki/Smoothness#Geometric_continuity
  https://stackoverflow.com/questions/12295773/joining-two-b%C3%A9zier-curves-smoothly-c2-continuous

  Our first constraint is C0 continuity i.e. positional continuity.
  This just means the end point of each bezier curve is equal to the start
  point of the next curve. We don't have to do anything special as part of this
  calculation to ensure that C0 continuity is met; the start and end points are
  already known (they are the crossing-points and pointed-return points).

  At the crossing-points, we apply the constraint of C2 continuity.
  This means that each pair of bezier curves meeting at a crossing-point
  must be equal in both their first (C1) and second (C2) derivatives at
  that point.

  Note that since we're dealing with parametric curves, the derivatives
  are vectors (and not generally unit vectors). When we say these derivatives
  must be equal, we mean both in direction and magnitude.

  The C1 and C2 constraints are applied only at the crossing-points. The
  pointed-return points instead have a constant-angle constraint i.e. the
  angle between the tangents of the two curves must equal the constant
  POINTED_RETURN_THETA at the point where they meet.

  This whole set of constraints, applied to a cyclic strand of crossing-points
  and pointed-returns, produces a system of simultaneous equations which can
  be expressed in matrix form:

  Ax = B

  We solve for x using the LU-decomposition method. In some cases this is the slowest
  part of the process. The matrix A is dependent only on the sequence of crossing-points and
  pointed-returns i.e. the topology of the strand (using the term loosely). This
  allows us to use a cache when calculating the LU-decomposition, which improves the performance
  a lot but of course doesn't help make it any better the first time, when the cache is empty.
  The cache should make things much faster when e.g. moving around the frame of an existing knot,
  although the LU-decomposition will need to be calculated afresh if the angles change such that
  a pointed-return needs to be added or removed.

  When creating large knots by dragging a frame on a square grid, you initially create a lot of
  straight lines - one avenue worth exploring would be to account for these straight, lines first,
  to reduce the amount of control points you need to solve for i.e. reduce the size of the matrices
  involved in this calculation.
*/
import { Bezier } from "bezier-js";
import { pointFollowing, compactRepresentation } from "../strand";
import {
  Contour,
  Strand,
  Polygon,
  Vector,
  ContouringStrategyName,
} from "../types";
import contourStrategies from "./contour-strategies";
/**
 * Take a basis strand (sequence of nodes), and add the actual beziers to it.
 */
function makeContour(
  topology: Int8Array,
  points: Float32Array,
  strand: Strand,
  contouringStrategyName: ContouringStrategyName
): Contour {
  const { xControlPoints, yControlPoints } = contourStrategies[
    contouringStrategyName
  ](topology, points);
  return strand.map((strandElement, index) => {
    const polygon = getBezier(index, xControlPoints, yControlPoints, strand);
    return {
      ...strandElement,
      outboundBezier: bezier(polygon),
    };
  });
}

function bezier(polygon: Polygon): Bezier {
  return new Bezier(...polygon.reduce((arr, sub) => arr.concat(sub)));
}

function getBezier(
  index: number,
  xControlPoints: number[],
  yControlPoints: number[],
  strand: Strand
): Vector[] {
  const nextStrandElement = pointFollowing(index, strand);
  const control1 = [xControlPoints.shift(), yControlPoints.shift()] as Vector;
  const control2 = [xControlPoints.shift(), yControlPoints.shift()] as Vector;
  return [
    strand[index].point.coords,
    control1,
    control2,
    nextStrandElement.point.coords,
  ];
}

export default function computeContours(
  strands: Strand[],
  contouringStrategyName: ContouringStrategyName
) {
  const compactStrands = strands.map((strand) => compactRepresentation(strand));
  // TODO - for now we still have to pass the strands in in the original (i.e. non-compact) format...
  return compactStrands.map(([strandTopology, strandPoints], idx) => {
    return makeContour(
      strandTopology,
      strandPoints,
      strands[idx],
      contouringStrategyName
    );
  });
}
