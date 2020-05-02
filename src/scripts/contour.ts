import numeric from "numeric";

import Bezier from "./bezier/bezier.js";
import StraightLine from "./straight-line.js";
import { pointFollowing } from "./strand.js";

const theta = 1.5;
let strand;
let matrix: number[][];
let equals;

/**
 * Take a basis strand (sequence of nodes), and add the actual beziers to it.
 */
export default function Contour(basisStrand) {
  strand = basisStrand;
  matrix = [];
  equals = [];
  const { xCntrlPoints, yCntrlPoints } = matrixSolution();
  const polygons = [];

  return strand.map((point, index) => {
    const polygon = getBezier(index, xCntrlPoints, yCntrlPoints);
    polygons.push(polygon);
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
function matrixSolution() {
  constructMatrix();
  const cntrlPoints = numeric.solve(matrix, equals);
  return {
    xCntrlPoints: cntrlPoints.slice(0, cntrlPoints.length / 2),
    yCntrlPoints: cntrlPoints.slice(cntrlPoints.length / 2),
  };
}
function getBezier(index, xCntrlPoints, yCntrlPoints) {
  const bezPoints = [];
  bezPoints.push([strand[index].x, strand[index].y]);
  bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
  bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
  const nextPoint = pointFollowing(index, strand);
  bezPoints.push([nextPoint.x, nextPoint.y]);
  return bezPoints;
}

function constructMatrix() {
  strand.forEach((point, index) => {
    setC2continuity(index);
    if (strand[index].pr) {
      setPRangle(index);
    } else {
      setC1continuity(index);
    }
  });
}
function emptyRow() {
  let row = [];
  strand.forEach(function() {
    row = row.concat([0, 0]);
  });
  return row;
}
function condition(startIdx, entries) {
  const row = emptyRow();
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
function setC1continuity(i) {
  const row = condition(2 * i - 1, [1, 1]);
  matrix.push(row.concat(emptyRow()));
  matrix.push(emptyRow().concat(row));
  equals.push(2 * strand[i].x);
  equals.push(2 * strand[i].y);
}
function setC2continuity(i) {
  const row = condition(2 * i, [1, -2, 2, -1]);
  matrix.push(row.concat(emptyRow()));
  matrix.push(emptyRow().concat(row));
  equals.push(0);
  equals.push(0);
}
function setPRangle(i) {
  const point = strand[i];
  let angle;
  if (point.pr === "R") {
    angle = theta;
  } else if (point.pr === "L") {
    angle = 2 * Math.PI - theta;
  }
  const row1 = condition(2 * i - 1, [1, -Math.cos(angle)]);
  const row2 = condition(2 * i, [Math.sin(angle)]);
  const row3 = condition(2 * i, [-Math.sin(angle)]);
  matrix.push(row1.concat(row2));
  matrix.push(row3.concat(row1));
  equals.push((1 - Math.cos(angle)) * point.x + Math.sin(angle) * point.y),
    equals.push((1 - Math.cos(angle)) * point.y - Math.sin(angle) * point.x);
}
