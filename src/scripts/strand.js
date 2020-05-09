import StrandElement from "./strand-element.js";
import { isCrossed, uncrossedDirection } from "./crossing-point.js";
import { linesOutFrom } from "./frame";

const strandState = {};

export function Strand(frame) {
  const result = [];
  addAllElements.call(result, frame);
  return result;
}
export function pointFollowing(index, strand) {
  return strand[(index + 1) % strand.length];
}
export function pointPreceding(index, strand) {
  return strand[index - 1] || strand[strand.length - 1];
}

function addAllElements(frame) {
  strandState.frame = frame;
  strandState.currentLine = frame.firstUncrossedLine();
  strandState.direction = initialDirection();
  strandState.targetNode = initialTargetNode();
  addElement.call(this, frame);

  while (true) {
    strandState.currentLine = nextLine();
    strandState.direction = oppositeDirection();
    strandState.targetNode = nextTargetNode();
    addNextPoint.call(this);
    if (endOfStrand()) break;
  }
}
function addElement() {
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
  return strandState.currentLine.angleOutCP({
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
  return nextLine(frame).endNode.sameNode(strandState.targetNode);
}
function compareByAngle(lineA, lineB) {
  if (
    lineA.angleOutFrom(strandState.targetNode) <
    lineB.angleOutFrom(strandState.targetNode)
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
  return nextLine(strandState.frame).angleOutCP({
    direction: oppositeDirection(),
    reverse: traverseNextBackwards(strandState.frame),
  });
}
function goingBackwards() {
  return strandState.currentLine.startNode.sameNode(strandState.targetNode);
}
function pointedReturn() {
  const angleDelta = Math.abs(
    currentBearing() - nextBearing(strandState.frame)
  );
  const smallerAngle = Math.min(angleDelta, Math.PI * 2 - angleDelta);
  return smallerAngle > 1.6;
}
function initialDirection() {
  return uncrossedDirection(strandState.currentLine.crossingPoint);
}
function initialTargetNode() {
  return strandState.currentLine.endNode;
}
function add(point) {
  this.push(point);
}
