/*
  Our goal here is to produce for each strand a set of
  bezier curves which fit together in a manner thay complies
  with some constraints.

  We're using cubic beziers, so each curve is defined by 4 points: a
  start point, two control points, and an end point.

  Our constraints are given in terms of parametric continuity.
  Some useful links for background:
  https://people.eecs.berkeley.edu/~jfc/cs184f98/lec19/lec19.html
  https://en.wikipedia.org/wiki/Smoothness#Geometric_continuity
  https://stackoverflow.com/questions/12295773/joining-two-b%C3%A9zier-curves-smoothly-c2-continuous

  Our first constraint is C0 continuity i.e. positional continuity;
  this means the end point of each bezier curve is equal to the start
  point of the next curve. This constraint doesn't have to be explicitly
  applied as part of this calculation - it's ensured by the fact that
  we're using the same points for the end of each curve as for the start
  of the next one. This applies both for crossing-points and pointed-return
  points.

  At the crossing-points, we go beyond C0 continuity to C2 continuity.
  This means that each pair of bezier curves meeting at a crossing-point
  must be equal in both their first (C1) and second (C2) derivatives at
  that point.

  Note that since we're dealing with parametric curves, the derivatives
  are vectors (and not generally unit vectors). When we say these derivatives
  must be equal, we mean both in direction and magnitude.

  The C1 and C2 constraints are applied only at the crossing-points. The
  pointed-return points instead have a constant-angle constraint i.e. the
  angle between the tangents of the two curves must equal some constant
  POINTED_RETURN_THETA at the point where they meet.

  This whole set of constraints, applied to a cyclic strand of crossing-points
  and pointed-returns, produces a system of simultaneous equations which can
  be expressed in matrix form:

  Ax = B

  where A is a matrix of coefficients (TODO explain size etc...), x is a vector containing the
  x and y values of our control points which we want to find.

  We solve this using the numeric library, which uses LU decomposition. This can be quite slow
  and is something we should look into optimizing.

  When creating large knots by dragging a frame on a square grid, you initially create a lot of
  straight lines - one avenue worth exploring would be to account for these straight, lines first,
  to reduce the amount of control points you need to solve for i.e. reduce the size of the matrices
  involved in this calculation.

  The matrices are always quite sparse - is the method used by numeric optimized for this?
*/

/*

Notes on performance.
The matrix A is just based on the topology of of the strand, not on the actual positions
of the points (todo - confirm this is true...)
This means if we create a knot and then move the points around, we are only changing B.
The LU decomposition of A remains the same. This means the LU decomposition can be cached
, keyed by the strand topology. This should make it much faster to move knots around etc...
*/

import numeric from "numeric";
import Bezier from "./bezier/bezier.js";
import { pointFollowing } from "./strand";
import { Contour, Strand, Matrix, Polygon, Vector } from "./types";

const POINTED_RETURN_THETA = 1.5;
const rightPointedReturnAngle = POINTED_RETURN_THETA;
const leftPointedReturnAngle = 2 * Math.PI - POINTED_RETURN_THETA;

/**
 * Take a basis strand (sequence of nodes), and add the actual beziers to it.
 */
export default function contour(strand: Strand): Contour {
  const { xControlPoints, yControlPoints } = matrixSolution(strand);
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

function deepEqual(a: Matrix, b: Matrix): boolean {
  return a.every((row, rowIdx) =>
    row.every((num, numIdx) => num === b[rowIdx][numIdx])
  );
}

interface LUDecomposition {
  LU: Matrix;
  P: number[];
}

// todo - it would probs be better if the keys on here were the strand
// themselves (or the useful part of them) rather than the matrix derived
// from them?
// todo - we should probably limit the number of records held by the cache...
// todo - define strand topology in a manner independent of translation etc etc
const LUCache = new Map<Matrix, LUDecomposition>();

function checkLUCache(matrix: Matrix): LUDecomposition | undefined {
  for (const [cacheKey, decomposition] of LUCache.entries()) {
    // TODO - we could probably check equality within some small tolerance,
    // rather than absolute equality.
    if (deepEqual(cacheKey, matrix)) {
      return decomposition;
    }
  }
  return undefined;
}

function matrixSolution(strand: Strand) {
  const [matrix, equals] = constructMatrix(strand);
  console.log(JSON.stringify({ matrix, equals }, null, 2));
  let lu = checkLUCache(matrix);
  if (!lu) {
    lu = numeric.LU(matrix);
    LUCache.set(matrix, lu);
  }
  const controlPoints = numeric.LUsolve(lu, equals);
  return {
    xControlPoints: controlPoints.slice(0, controlPoints.length / 2),
    yControlPoints: controlPoints.slice(controlPoints.length / 2),
  };
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

function constructMatrix(strand: Strand): [Matrix, number[]] {
  function setConstraint(value: number, ...terms: [number, number][]): void {
    const row = Array(strand.length * 4).fill(0);
    terms.forEach(([coefficient, index]) => {
      row[index] = coefficient;
    });
    matrix.push(row);
    equals.push(value);
  }

  function previousBezierIndex(idx: number): number {
    return idx > 0 ? idx - 1 : strand.length - 1;
  }

  function controlPointIndex(
    controlPoint: ControlPoint,
    bezierIndex: number,
    dimension: Dimension
  ): number {
    let result = bezierIndex * 2;
    if (controlPoint === ControlPoint.second) result++;
    if (dimension === Dimension.y) result += strand.length * 2;
    return result;
  }

  function setC1continuity(bezierIndex: number): void {
    /*
    We have two adjoining bezier curves P and Q.
    P is defined by the points P0 P1 P2 P3.
    Q is defined by the points Q0 Q1 Q2 Q3.

    P3 is equal to Q0, and its value is already known (it
    is the crossing-point at strand[i]).

    The C1 constraint can be given as:
    P3 - P2 = Q1 - Q0

    i.e.
    Q0 - P2 = Q1 - Q0

    i.e.
    Q1 + P2 = 2 * Q0

    i.e.
    1 * Q1 + 1 * P2 = 2 * Q0

    This means we need to have [1, 1] as coefficients of Q1 and P2
    for this row of the "A" matrix, and 2 * Q0 in our "equals" vector.
  */
    const prevBezIdx = previousBezierIndex(bezierIndex);
    setConstraint(
      2 * strand[bezierIndex].point.coords[0],
      [1, controlPointIndex(ControlPoint.second, prevBezIdx, Dimension.x)],
      [1, controlPointIndex(ControlPoint.first, bezierIndex, Dimension.x)]
    );
    setConstraint(
      2 * strand[bezierIndex].point.coords[1],
      [1, controlPointIndex(ControlPoint.second, prevBezIdx, Dimension.y)],
      [1, controlPointIndex(ControlPoint.first, bezierIndex, Dimension.y)]
    );
  }
  function setC2continuity(bezierIndex: number): void {
    const prevBezIdx = previousBezierIndex(bezierIndex);
    [Dimension.x, Dimension.y].forEach((dimension) => {
      setConstraint(
        0,
        [1, controlPointIndex(ControlPoint.first, prevBezIdx, dimension)],
        [-2, controlPointIndex(ControlPoint.second, prevBezIdx, dimension)],
        [2, controlPointIndex(ControlPoint.first, bezierIndex, dimension)],
        [-1, controlPointIndex(ControlPoint.second, bezierIndex, dimension)]
      );
    });
  }
  function setPointedReturnAngle(bezierIndex: number): void {
    const strandElement = strand[bezierIndex];
    const [x, y] = strandElement.point.coords;
    const angle =
      strandElement.pr === "R"
        ? rightPointedReturnAngle
        : leftPointedReturnAngle;
    const prevBezIdx = previousBezierIndex(bezierIndex);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    setConstraint(
      (1 - cos) * x + sin * y,
      [1, controlPointIndex(ControlPoint.second, prevBezIdx, Dimension.x)],
      [-cos, controlPointIndex(ControlPoint.first, bezierIndex, Dimension.x)],
      [sin, controlPointIndex(ControlPoint.first, bezierIndex, Dimension.y)]
    );
    setConstraint(
      (1 - cos) * y - sin * x,
      [-sin, controlPointIndex(ControlPoint.first, bezierIndex, Dimension.x)],
      [1, controlPointIndex(ControlPoint.second, prevBezIdx, Dimension.y)],
      [-cos, controlPointIndex(ControlPoint.first, bezierIndex, Dimension.y)]
    );
    // const row1 = condition(2 * bezierIndex - 1, [1, -cos], strand.length);
    // const row2 = condition(2 * bezierIndex, [sin], strand.length);
    // const row3 = condition(2 * bezierIndex, [-sin], strand.length);
    // newMatrix.push(row1.concat(row2), row3.concat(row1));
    // newEquals.push((1 - cos) * x + sin * y);
    // newEquals.push();
  }

  const matrix: Matrix = [];
  const equals: number[] = [];
  for (let strandIdx = 0; strandIdx < strand.length; strandIdx++) {
    setC2continuity(strandIdx);
    if (strand[strandIdx].pr) {
      setPointedReturnAngle(strandIdx);
    } else {
      setC1continuity(strandIdx);
    }
  }
  return [matrix, equals];
}

enum ControlPoint {
  first,
  second,
}

enum Dimension {
  x,
  y,
}
