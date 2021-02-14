type Stage<State> = { state: State; commit: (newState: State) => void };
type Stages<StateTuple extends unknown[]> = {
  [Index in keyof StateTuple]: Stage<StateTuple[Index]>;
};

const stageDAG = new Map<Stage<unknown>, Set<Stage<unknown>>>();
const topologicallyOrderedStages = [];

function createStage<UpstreamState extends unknown[], State>(
  upstreamStages: Stages<UpstreamState>,
  updater: (...args: UpstreamState) => State
): { state: null; commit: (newState: State) => void };
function createStage<State>(): Stage<State>;
function createStage<UpstreamState extends unknown[], State>(
  upstreamStages?: Stages<UpstreamState>,
  updater?: (...args: UpstreamState) => State
): Stage<State> {
  const result = {
    state: null,
    commit(newState) {},
  };
  if (upstreamStages) {
    upstreamStages.forEach((upstreamStage) => {
      const currentDeps = stageDAG.get(upstreamStage);
      if (!currentDeps) {
        throw new Error("could not find upstream stage");
      }
      currentDeps.add(result);
    });
  }
  topologicallyOrderedStages.push(result);
  stageDAG.set(result, new Set());
  return result;
}

export default createStage;
