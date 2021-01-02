import StrandElement from "./strand-element";
import { isCrossed, uncrossedDirection } from "./crossing-point";
import { linesOutFrom, firstUncrossedLine } from "./frame";
import { angleOutFrom, angleOutCP } from "./line";
import { sameNode } from "./node";
import {
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
  add.call(
    this,
    new StrandElement({
      direction: strandState.direction,
      point: strandState.currentLine.crossingPoint,
      pr: false,
    })
  );

  if (pointedReturn(strandState.frame)) {
    const startCoords = strandState.currentLine.crossingPoint.coords;
    const endCoords = nextLine(strandState.frame).crossingPoint.coords;
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
  return angleOutCP(strandState.currentLine, {
    direction: strandState.direction,
    reverse: goingBackwards(),
  });
}
function oppositeDirection() {
  return strandState.direction === "R" ? "L" : "R";
}
function addNextPoint(frame) {
  addElement.call(this, frame);
}
function logCrossing() {
  if (strandState.direction === "R") {
    strandState.currentLine.crossingPoint.crossedRight = true;
  } else {
    strandState.currentLine.crossingPoint.crossedLeft = true;
  }
}
function traverseNextBackwards(frame) {
  return sameNode(nextLine(frame).endNode, strandState.targetNode);
}
function compareByAngle(lineA, lineB) {
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
  if (goingBackwards()) {
    return strandState.currentLine.endNode;
  } else {
    return strandState.currentLine.startNode;
  }
}
function endOfStrand() {
  return isCrossed(
    nextLine(strandState.frame).crossingPoint,
    oppositeDirection()
  );
}
function getApexCoords(startPoint, endPoint) {
  const startToEnd = [endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]];
  let normal;
  if (strandState.direction === "R") {
    normal = [-startToEnd[1], startToEnd[0]];
  } else if (strandState.direction === "L") {
    normal = [startToEnd[1], -startToEnd[0]];
  }
  return [
    startPoint[0] + startToEnd[0] / 2 + normal[0],
    startPoint[1] + startToEnd[1] / 2 + normal[1],
  ];
}
function nextLine() {
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
    reverse: traverseNextBackwards(strandState.frame),
  });
}
function goingBackwards() {
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
