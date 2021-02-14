import topologicalOrdering from "./topological-ordering";
import { Subject } from "./pipeline-types";
import frame from "./frame";
import strand from "./strand";
import contour from "./contour";
import offset from "./offset";
import primitives from "./primitives";

function createPipeline(subjects: Subject[]) {
  const ordering = topologicalOrdering(subjects);
  console.log(ordering);
  // Hook up all the update functions...then when some subject updates, you need
  // to figure out what else needs to update (i.e. all the reachable nodes from
  // that subject), and in which order (using the topological ordering).
}

// order is unimportant in this array
createPipeline([frame, strand, contour, offset, primitives]);
