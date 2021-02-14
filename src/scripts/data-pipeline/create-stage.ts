type Stage<State> = { state: State; commit: (newState: State) => void };
type Stages<StateTuple extends unknown[]> = {
  [Index in keyof StateTuple]: Stage<StateTuple[Index]>;
};

// track the dependencies ("observers") of each pipeline stage
const stageDAG = new Map<Stage<unknown>, Set<Stage<unknown>>>();

// When each stage is created, the upstream stages that it observes have to be
// included in the call to createStage, so they must already exist. This ensures
// for us that we have our dependency graph is acyclic - we don't have to do
// anything special checks for cycles - the structure of the code itself ensures
// there are no cycles - so we shouldn't have any infinite loop situations. So
// we can rest assured that we are dealing with a DAG.

// The structure of the code also means that just by adding each stage to this
// array in the order that they are created, we can obtain the topological
// ordering; the topological ordering is basically built into the structure of
// the code, so we don't need to explicitly compute it. In the future, if the
// depdency graphs get a lot more complicated, it might be beneficial to allow
// creating the stages in any order, in which case we would add code to check
// for cycles and to find the topological ordering (both of which could be done
// as part of a simple depth-first search as described in CLRS).
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
