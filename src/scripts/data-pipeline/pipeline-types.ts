export type StageName =
  | "frame"
  | "strands"
  | "contour"
  | "offsets"
  | "primitives";

export interface PipelineStage {
  // TODO - this should update the state for this stage, and then propagate the update down the topologically-sorted DAG
  update(): void;
  // to be used by downstream pipeline stages
  getState(): void;
}

export type PipelineSpecification = {
  [stageName in StageName]: { dependencies: readonly StageName[] };
};
