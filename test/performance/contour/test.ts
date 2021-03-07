import computeContours from "../../../src/scripts/contour";
import strands from "./test-data/10by6strands.json";
import { setup } from "../../../src/scripts/wasm-interface";
import { Strand } from "../../../src/scripts/types";

async function main() {
  await setup();
  const start = performance.now();
  computeContours(strands as Strand[]);
  console.log(performance.now() - start);
}

main();
