type StageName = "frame" | "strands" | "contour" | "offsets" | "primitives";
interface PipelineStage {
  // TODO - this should update the state for this stage, and then propagate the update down the topologically-sorted DAG
  update(): void;
}

// this is difficult to type...I think it's related to this issue - https://github.com/microsoft/TypeScript/issues/30134
type DependencyMatrix = {
  [stageName in StageName]: { dependencies: StageName[] };
};
type Pipeline = { [stageName in StageName]: PipelineStage };

// TODO - createPipeline should check for cycles, and compute the topological ordering of the dependency DAG
declare function createPipeline(dependencyMatrix: DependencyMatrix): Pipeline;

const dependencyMatrix = {
  frame: { dependencies: [] },
  // when the frame updates, the strand should update
  strands: { dependencies: ["frame"] },
  // when the strand updates, the contour should update
  contour: { dependencies: ["strands"] },
  // when the contour updates, the offsets should update
  offsets: { dependencies: ["contour"] },
  // when the offsets or frame updates, the primitives should update
  primitives: { dependencies: ["offsets", "frame"] },
};

const { frame, strands, contour, offsets, primitives } = createPipeline(
  dependencyMatrix
);
console.log(frame, strands, contour, offsets, primitives);
