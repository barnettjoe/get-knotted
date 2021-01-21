import numeric from "numeric";

import Bezier from "./bezier/bezier.js";
import { pointFollowing } from "./strand";
import { Contour, Strand, Matrix, Polygon, Vector } from "./types";

const theta = 1.5;

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

// TODO - explain all the maths...
function matrixSolution(strand: Strand) {
  if (strand.length > 100) {
    debugger;
  }
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

function emptyRow(strand: Strand) {
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
  const angle = strandElement.pr === "R" ? theta : 2 * Math.PI - theta;
  const row1 = condition(2 * i - 1, [1, -Math.cos(angle)], strand);
  const row2 = condition(2 * i, [Math.sin(angle)], strand);
  const row3 = condition(2 * i, [-Math.sin(angle)], strand);
  newMatrix.push(row1.concat(row2), row3.concat(row1));
  newEquals.push((1 - Math.cos(angle)) * x + Math.sin(angle) * y);
  newEquals.push((1 - Math.cos(angle)) * y - Math.sin(angle) * x);
  return [newMatrix, newEquals];
}
