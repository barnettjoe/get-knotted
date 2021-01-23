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

import numeric from "numeric";
import Bezier from "./bezier/bezier.js";
import { pointFollowing } from "./strand";
import { Contour, Strand, Matrix, Polygon, Vector } from "./types";

const POINTED_RETURN_THETA = 1.5;

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

function matrixSolution(strand: Strand) {
  const [matrix, equals] = constructMatrix(strand);
  const controlPoints = numeric.solve(matrix, equals);
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
  let matrix: Matrix = [];
  let equals: number[] = [];
  for (let strandIdx = 0; strandIdx < strand.length; strandIdx++) {
    [matrix, equals] = setC2continuity(strandIdx, strand, matrix, equals);
    [matrix, equals] = strand[strandIdx].pr
      ? setPointedReturnAngle(strandIdx, strand, matrix, equals)
      : setC1continuity(strandIdx, strand, matrix, equals);
  }
  return [matrix, equals];
}

function emptyRow(strand: Strand): number[] {
  return Array(strand.length * 2).fill(0);
}

function condition(startIdx: number, entries: number[], strand: Strand) {
  const row = emptyRow(strand);
  for (const x of entries) {
    if (startIdx > row.length - 1) {
      row[startIdx % row.length] = x;
    } else if (startIdx >= 0) {
      row[startIdx] = x;
    } else {
      row[row.length + startIdx] = x;
    }
    startIdx++;
  }
  return row;
}
function setC1continuity(
  i: number,
  strand: Strand,
  matrix: number[][],
  equals: number[]
): [Matrix, number[]] {
  const newMatrix = matrix.slice();
  const newEquals = equals.slice();
  const row = condition(2 * i - 1, [1, 1], strand);
  newMatrix.push(row.concat(emptyRow(strand)));
  newMatrix.push(emptyRow(strand).concat(row));
  newEquals.push(2 * strand[i].point.coords[0]);
  newEquals.push(2 * strand[i].point.coords[1]);
  return [newMatrix, newEquals];
}

function setC2continuity(
  i: number,
  strand: Strand,
  matrix: number[][],
  equals: number[]
): [Matrix, number[]] {
  const newMatrix = matrix.slice();
  const newEquals = equals.slice();
  const row = condition(2 * i, [1, -2, 2, -1], strand);
  newMatrix.push(row.concat(emptyRow(strand)));
  newMatrix.push(emptyRow(strand).concat(row));
  newEquals.push(0);
  newEquals.push(0);
  return [newMatrix, newEquals];
}

function setPointedReturnAngle(
  i: number,
  strand: Strand,
  matrix: number[][],
  equals: number[]
): [Matrix, number[]] {
  const newMatrix = matrix.slice();
  const newEquals = equals.slice();
  const strandElement = strand[i];
  const [x, y] = strandElement.point.coords;
  const angle =
    strandElement.pr === "R"
      ? POINTED_RETURN_THETA
      : 2 * Math.PI - POINTED_RETURN_THETA;
  const row1 = condition(2 * i - 1, [1, -Math.cos(angle)], strand);
  const row2 = condition(2 * i, [Math.sin(angle)], strand);
  const row3 = condition(2 * i, [-Math.sin(angle)], strand);
  newMatrix.push(row1.concat(row2), row3.concat(row1));
  newEquals.push((1 - Math.cos(angle)) * x + Math.sin(angle) * y);
  newEquals.push((1 - Math.cos(angle)) * y - Math.sin(angle) * x);
  return [newMatrix, newEquals];
}
