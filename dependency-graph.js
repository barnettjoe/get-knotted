const path = require("path");
const madge = require("madge");

const outputPath = path.resolve(__dirname, "./dependency-graph.svg");
const entryPoint = path.resolve(__dirname, "./src/scripts/drawing.ts");
madge(entryPoint)
  .then((res) => res.image(outputPath))
  .then((writtenImagePath) => {
    console.log("Image written to " + writtenImagePath);
  });
