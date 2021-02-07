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
        test: /\.ts/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-typescript",
                  { isTSX: true, allExtensions: true },
                ],
              ],
            },
          },
        ],
        include: path.resolve(__dirname, "src"),
      },
    ],
  },
});
