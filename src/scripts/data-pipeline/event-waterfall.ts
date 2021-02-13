import {
  PipelineSpecification,
  StageName,
  PipelineStage,
} from "./pipeline-types";

// TODO - createPipeline should check for cycles, and compute the topological ordering of the dependency DAG
declare function createPipeline(
  dependencyMatrix: PipelineSpecification
): { [stageName in StageName]: PipelineStage };

const { frame, strands, contour, offsets, primitives } = createPipeline({
  frame: { dependencies: [] },
  // when the frame updates, the strand should update
  strands: { dependencies: ["frame"] },
  // when the strand updates, the contour should update
  contour: { dependencies: ["strands"] },
  // when the contour updates, the offsets should update
  offsets: { dependencies: ["contour"] },
  // when the offsets or frame updates, the primitives should update
  primitives: { dependencies: ["offsets", "frame"] },
});
console.log(frame, strands, contour, offsets, primitives);
