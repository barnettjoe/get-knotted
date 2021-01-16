import { CrossingPoint, CrossingPointStrandElement, Direction } from "./types";
interface StrandElementOptions {
  point: CrossingPoint;
  direction: Direction;
}
export default function StrandElement({
  point,
  direction,
}: StrandElementOptions): CrossingPointStrandElement {
  return {
    point,
    pr: null,
    direction,
  };
}
