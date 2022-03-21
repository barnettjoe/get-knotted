import {
  Matrix,
  Dimension,
  BezierControlPoint as ControlPoint,
  PointType,
} from "../types";
import { lup, solve } from "../wasm-interface";
const POINTED_RETURN_THETA = 1.5;
const rightPointedReturnAngle = POINTED_RETURN_THETA;
const leftPointedReturnAngle = 2 * Math.PI - POINTED_RETURN_THETA;

interface LUDecomposition {
  LU: Matrix;
  P: number[];
}

// TODO - we might want to limit the number of records held by the cache
type MapWithResult = Map<null, LUDecomposition>;
type MapWithMore = Map<boolean, RecursiveCache>;
type RecursiveCache = MapWithResult & MapWithMore;
const LUCache: RecursiveCache = new Map();

export default function matrixSolution(
  strandTopology: Int8Array,
  points: Float32Array
) {
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
