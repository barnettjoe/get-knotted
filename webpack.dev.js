/* eslint-env node */
const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    contentBase: ["./dist"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader",
        include: [
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "test/performance"),
        ],
      },
    ],
  },
});
