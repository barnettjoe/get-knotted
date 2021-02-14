interface Point {
  x: number;
  y: number;
}

interface FrameState {
  frameX: number;
  frameY: number;
}

interface StrandState {
  points: Point[];
}

interface ContourState {
  beziers: { p1: number; p2: number; p3: number; p4: number }[];
}

const frame = createStage<FrameState>();
const strand = createStage<[FrameState], StrandState>([frame], (frameState) => {
  console.log(frameState);
  return { points: [] };
});
const contour = createStage<[StrandState], ContourState>(
  [strand],
  (strandState) => {
    console.log(strandState);
    return {
      beziers: [{ p1: 1234, p2: 1234, p3: 1234, p4: 1234 }],
    };
  }
);

export { frame, strand, contour };
