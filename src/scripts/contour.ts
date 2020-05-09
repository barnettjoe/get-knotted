import numeric from "numeric";

import Bezier from "./bezier/bezier.js";
import { pointFollowing } from "./strand.js";
import { Matrix } from "./types";

const theta = 1.5;

/**
 * Take a basis strand (sequence of nodes), and add the actual beziers to it.
 */
export default function contour(strand) {
  const { xControlPoints, yControlPoints } = matrixSolution(strand);
  return strand.map((point, index) => {
    const polygon = getBezier(index, xControlPoints, yControlPoints, strand);
    return {
      ...point,
      outboundBezier: bezier(polygon),
    };
  });
}

function bezier(polygon) {
  return new Bezier(...polygon.reduce((arr, sub) => arr.concat(sub)));
}

// TODO - explain all the maths...
function matrixSolution(strand) {
  const [matrix, equals] = constructMatrix(strand);
  const controlPoints = numeric.solve(matrix, equals);
  return {
    xControlPoints: controlPoints.slice(0, controlPoints.length / 2),
    yControlPoints: controlPoints.slice(controlPoints.length / 2),
  };
}
function getBezier(index, xControlPoints, yControlPoints, strand) {
  const nextPoint = pointFollowing(index, strand);
  return [
    [strand[index].x, strand[index].y],
    [xControlPoints.shift(), yControlPoints.shift()],
    [xControlPoints.shift(), yControlPoints.shift()],
    [nextPoint.x, nextPoint.y],
  ];
}

function constructMatrix(strand): [Matrix, number[]] {
  let matrix: Matrix = [];
  let equals: number[] = [];
  strand.forEach((point, index) => {
    [matrix, equals] = setC2continuity(index, strand, matrix, equals);
    [matrix, equals] = strand[index].pr
      ? setPointedReturnAngle(index, strand, matrix, equals)
      : setC1continuity(index, strand, matrix, equals);
  });
  return [matrix, equals];
}

function emptyRow(strand) {
  return Array(strand.length * 2).fill(0);
}

function condition(startIdx, entries, strand) {
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
function setC1continuity(i, strand, matrix, equals) {
  const newMatrix = matrix.slice();
  const newEquals = equals.slice();
  const row = condition(2 * i - 1, [1, 1], strand);
  newMatrix.push(row.concat(emptyRow(strand)));
  newMatrix.push(emptyRow(strand).concat(row));
  newEquals.push(2 * strand[i].x);
  newEquals.push(2 * strand[i].y);
  return [newMatrix, newEquals];
}
function setC2continuity(i, strand, matrix, equals) {
  const newMatrix = matrix.slice();
  const newEquals = equals.slice();
  const row = condition(2 * i, [1, -2, 2, -1], strand);
  newMatrix.push(row.concat(emptyRow(strand)));
  newMatrix.push(emptyRow(strand).concat(row));
  newEquals.push(0);
  newEquals.push(0);
  return [newMatrix, newEquals];
}

function setPointedReturnAngle(i, strand, matrix, equals) {
  const newMatrix = matrix.slice();
  const newEquals = equals.slice();
  const point = strand[i];
  const angle = point.pr === "R" ? theta : 2 * Math.PI - theta;
  const row1 = condition(2 * i - 1, [1, -Math.cos(angle)], strand);
  const row2 = condition(2 * i, [Math.sin(angle)], strand);
  const row3 = condition(2 * i, [-Math.sin(angle)], strand);
  newMatrix.push(row1.concat(row2), row3.concat(row1));
  newEquals.push((1 - Math.cos(angle)) * point.x + Math.sin(angle) * point.y);
  newEquals.push((1 - Math.cos(angle)) * point.y - Math.sin(angle) * point.x);
  return [newMatrix, newEquals];
}
