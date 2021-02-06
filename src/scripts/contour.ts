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
import { pointFollowing } from "./strand";
import {
  Contour,
  Strand,
  Matrix,
  Polygon,
  Vector,
  Dimension,
  BezierControlPoint as ControlPoint,
  PointType,
} from "./types";
import { lup, solve } from "./wasm-interface";
const POINTED_RETURN_THETA = 1.5;
const rightPointedReturnAngle = POINTED_RETURN_THETA;
const leftPointedReturnAngle = 2 * Math.PI - POINTED_RETURN_THETA;
/**
 * Take a basis strand (sequence of nodes), and add the actual beziers to it.
 */

export function makeContour(
  topology: Int8Array,
  points: Float32Array,
  strand: Strand
): Contour {
  const { xControlPoints, yControlPoints } = matrixSolution(topology, points);
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

interface LUDecomposition {
  LU: Matrix;
  P: number[];
}

// TODO - we might want to limit the number of records held by the cache
type MapWithResult = Map<null, LUDecomposition>;
type MapWithMore = Map<boolean, RecursiveCache>;
type RecursiveCache = MapWithResult & MapWithMore;
const LUCache: RecursiveCache = new Map();

function checkLUCache(topology: StrandTopology): LUDecomposition | undefined {
  let cache = LUCache;
  for (const element of topology) {
    const nextCache = cache.get(element);
    if (nextCache === undefined) return undefined;
    cache = nextCache;
  }
  if (cache === undefined) return undefined;
  return cache.get(null);
}

function setLUCache(topology: StrandTopology, lu: LUDecomposition): void {
  let cache = LUCache;
  for (const element of topology) {
    let nextCache = cache.get(element);
    if (nextCache === undefined) {
      nextCache = new Map();
      cache.set(element, nextCache);
    }
    cache = nextCache;
  }
  cache.set(null, lu);
}

type StrandTopology = boolean[];

function getStrandTopology(strand: Int8Array): StrandTopology {
  const result: boolean[] = [];
  strand.forEach((val) => {
    result.push(val === PointType.CrossingPoint);
  });
  return result;
}

function matrixSolution(strandTopology: Int8Array, points: Float32Array) {
  // TODO - if we have a cache hit from the strand topology we only actually need to generate b,
  // not the matrix. I don't think this has much effect on performance though, and it might be difficult
  // to organize the code nicely...
  const { A, b } = constructMatrixEquation(strandTopology, points);
  const topology = getStrandTopology(strandTopology);
  let lu = checkLUCache(topology);
  if (!lu) {
    lu = lup(A);
    setLUCache(topology, lu);
  }
  const controlPoints = solve(lu, b);
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

interface MatrixEquation {
  A: Float32Array;
  b: Float32Array;
}

function constructMatrixEquation(
  strandTopology: Int8Array,
  points: Float32Array
): MatrixEquation {
  let rowsFilled = 0;
  const rowLength = strandTopology.length * 4;
  function setConstraint(value: number, terms: Map<number, number>): void {
    // add a row to the matrix
    for (let i = 0; i < rowLength; i++) {
      const matrixIdx = rowLength * rowsFilled + i;
      const coefficient = terms.get(i);
      if (coefficient !== undefined) {
        matrix[matrixIdx] = coefficient;
      } else {
        matrix[matrixIdx] = 0;
      }
    }
    b[rowsFilled] = value;
    rowsFilled++;
  }

  function previousBezierIndex(idx: number): number {
    return idx > 0 ? idx - 1 : strandTopology.length - 1;
  }

  function ctrlPointIdx(
    controlPoint: ControlPoint,
    bezierIndex: number,
    dimension: Dimension
  ): number {
    let result = bezierIndex * 2;
    if (controlPoint === ControlPoint.P2) result++;
    if (dimension === Dimension.y) result += strandTopology.length * 2;
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
    [Dimension.x, Dimension.y].forEach((dimension) => {
      const terms = new Map<number, number>();
      terms.set(ctrlPointIdx(ControlPoint.P2, prevBezIdx, dimension), 1);
      terms.set(ctrlPointIdx(ControlPoint.P1, bezierIndex, dimension), 1);
      setConstraint(2 * points[bezierIndex * 2 + dimension], terms);
    });
  }
  function setC2continuity(bezierIndex: number): void {
    const prevBezIdx = previousBezierIndex(bezierIndex);
    [Dimension.x, Dimension.y].forEach((dimension) => {
      const terms = new Map<number, number>();
      terms.set(ctrlPointIdx(ControlPoint.P1, prevBezIdx, dimension), 1);
      terms.set(ctrlPointIdx(ControlPoint.P2, prevBezIdx, dimension), -2);
      terms.set(ctrlPointIdx(ControlPoint.P1, bezierIndex, dimension), 2);
      terms.set(ctrlPointIdx(ControlPoint.P2, bezierIndex, dimension), -1);
      setConstraint(0, terms);
    });
  }
  function setPointedReturnAngle(bezierIndex: number): void {
    const x = points[bezierIndex * 2];
    const y = points[bezierIndex * 2 + 1];
    const angle =
      strandTopology[bezierIndex] === PointType.RightPointedReturn
        ? rightPointedReturnAngle
        : leftPointedReturnAngle;
    const prevBezIdx = previousBezierIndex(bezierIndex);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const terms = new Map<number, number>();
    terms.set(ctrlPointIdx(ControlPoint.P2, prevBezIdx, Dimension.x), 1);
    terms.set(ctrlPointIdx(ControlPoint.P1, bezierIndex, Dimension.x), -cos);
    terms.set(ctrlPointIdx(ControlPoint.P1, bezierIndex, Dimension.y), sin);
    setConstraint((1 - cos) * x + sin * y, terms);
    const moreTerms = new Map<number, number>();
    moreTerms.set(
      ctrlPointIdx(ControlPoint.P1, bezierIndex, Dimension.x),
      -sin
    );
    moreTerms.set(ctrlPointIdx(ControlPoint.P2, prevBezIdx, Dimension.y), 1);
    moreTerms.set(
      ctrlPointIdx(ControlPoint.P1, bezierIndex, Dimension.y),
      -cos
    );
    setConstraint((1 - cos) * y - sin * x, moreTerms);
  }
  // each strandElement means 2 controls points, each of which has x and y
  const matrix = new Float32Array((strandTopology.length * 4) ** 2);
  const b = new Float32Array(strandTopology.length * 4);
  for (let strandIdx = 0; strandIdx < strandTopology.length; strandIdx++) {
    // TODO - we're setting C2 continuity even for pointed-returns...
    // otherwise we would have an under-determined set of simultaneous
    // eqns. There might be a more suitable constraint we could use
    // instead, though.
    setC2continuity(strandIdx);
    if (
      strandTopology[strandIdx] === PointType.RightPointedReturn ||
      strandTopology[strandIdx] === PointType.LeftPointedReturn
    ) {
      setPointedReturnAngle(strandIdx);
    } else {
      setC1continuity(strandIdx);
    }
  }
  return { A: matrix, b };
}
