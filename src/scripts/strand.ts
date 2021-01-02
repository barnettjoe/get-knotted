import StrandElement from "./strand-element";
import { isCrossed, uncrossedDirection } from "./crossing-point";
import { linesOutFrom, firstUncrossedLine } from "./frame";
import { angleOutFrom, angleOutCP } from "./line";
import { sameNode } from "./node";
import {
  Coords,
  Direction,
  INode,
  Frame,
  FrameLine,
  IStrand,
  StrandElement as StrandElementType,
} from "./types";

interface StrandState {
  frame: Frame;
  currentLine: FrameLine;
  direction: Direction;
  targetNode: INode;
}

let strandState: StrandState | null = null;

export function Strand(frame: Frame): IStrand {
  const result: IStrand = [];
  addAllElements.call(result, frame);
  return result;
}
export function pointFollowing(
  index: number,
  strand: IStrand
): StrandElementType {
  return strand[(index + 1) % strand.length];
}
export function pointPreceding(
  index: number,
  strand: IStrand
): StrandElementType {
  return strand[index - 1] || strand[strand.length - 1];
}

function initialStrandState(frame: Frame) {
  const currentLine = firstUncrossedLine(frame.lines);
  if (currentLine === null) {
    throw new Error("no uncrossed line to initialize strand state");
  }
  const direction = uncrossedDirection(currentLine.crossingPoint);
  if (direction === null) {
    throw new Error(
      "could not find uncrossed direction for initializing strand state"
    );
  }
  const targetNode = currentLine.endNode;
  return { currentLine, direction, targetNode, frame };
}

function addAllElements(this: IStrand, frame: Frame) {
  strandState = initialStrandState(frame);

  addElement.call(this, frame);

  while (true) {
    strandState.currentLine = nextLine();
    strandState.direction = oppositeDirection();
    strandState.targetNode = nextTargetNode();
    addNextPoint.call(this);
    if (endOfStrand()) break;
  }
}
function addElement(this: IStrand) {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  add.call(
    this,
    new StrandElement({
      direction: strandState.direction,
      point: strandState.currentLine.crossingPoint,
      pr: null,
    })
  );

  if (pointedReturn()) {
    const startCoords = strandState.currentLine.crossingPoint.coords;
    const endCoords = nextLine().crossingPoint.coords;
    const prCoords = getApexCoords(startCoords, endCoords);
    add.call(this, {
      point: {},
      x: prCoords[0],
      y: prCoords[1],
      pr: oppositeDirection(),
    });
  }
  logCrossing();
}
function currentBearing() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return angleOutCP(strandState.currentLine, {
    direction: strandState.direction,
    reverse: goingBackwards(),
  });
}
function oppositeDirection() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return strandState.direction === "R" ? "L" : "R";
}
function addNextPoint(this: IStrand, frame: Frame) {
  addElement.call(this, frame);
}
function logCrossing() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  if (strandState.direction === "R") {
    strandState.currentLine.crossingPoint.crossedRight = true;
  } else {
    strandState.currentLine.crossingPoint.crossedLeft = true;
  }
}
function traverseNextBackwards(): boolean {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return sameNode(nextLine().endNode, strandState.targetNode);
}
function compareByAngle(lineA: FrameLine, lineB: FrameLine) {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  if (
    angleOutFrom(lineA, strandState.targetNode) <
    angleOutFrom(lineB, strandState.targetNode)
  ) {
    return -1;
  } else {
    return 1;
  }
}
function nextTargetNode() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  if (goingBackwards()) {
    return strandState.currentLine.endNode;
  } else {
    return strandState.currentLine.startNode;
  }
}
function endOfStrand() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return isCrossed(nextLine().crossingPoint, oppositeDirection());
}
function getApexCoords(startPoint: Coords, endPoint: Coords) {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  const startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  let normal;
  if (strandState.direction === "R") {
    normal = [-startToEnd[1], startToEnd[0]];
  } else {
    normal = [startToEnd[1], -startToEnd[0]];
  }
  return [
    startPoint[0] + startToEnd[0] / 2 + normal[0],
    startPoint[1] + startToEnd[1] / 2 + normal[1],
  ];
}
function nextLine() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  const roundabout = linesOutFrom(
    strandState.targetNode,
    strandState.frame.lines
  );
  const orderedLinesOut = roundabout.slice().sort(compareByAngle);
  const inIndex = orderedLinesOut.indexOf(strandState.currentLine);

  if (strandState.direction === "R") {
    // pad out list with first element...
    // to allow going all way thru to start again
    const previousLine = orderedLinesOut[inIndex - 1];
    const lastLine = orderedLinesOut[orderedLinesOut.length - 1];
    return previousLine || lastLine;
  } else {
    orderedLinesOut.push(orderedLinesOut[0]);
    return orderedLinesOut[inIndex + 1];
  }
}
function nextBearing() {
  return angleOutCP(nextLine(), {
    direction: oppositeDirection(),
    reverse: traverseNextBackwards(),
  });
}
function goingBackwards() {
  if (strandState === null) {
    throw new Error("strand state is uninitialized");
  }
  return sameNode(strandState.currentLine.startNode, strandState.targetNode);
}
function pointedReturn() {
  const angleDelta = Math.abs(currentBearing() - nextBearing());
  const smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
  return smallerAngle > 1.6;
}
function add(this: IStrand, point: StrandElementType) {
  this.push(point);
}
