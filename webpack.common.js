/* eslint-env node */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const cssLoaders = ["style-loader", { loader: "css-loader" }];

module.exports = {
  entry: {
    main: "./src/index.ts",
    "test-harness": "./test/performance/contour/test.tsx",
  },
  devServer: {
    contentBase: "./dist",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new HtmlWebpackPlugin({
      template: "src/index.html",
      chunks: ["main"],
    }),
    // test harness
    new HtmlWebpackPlugin({
      filename: "harness",
      template: "src/index.html",
      chunks: ["test-harness"],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: cssLoaders,
      },
      {
        test: /\.glsl$/i,
        use: [
          {
            loader: "raw-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      "bezier-js": path.resolve(__dirname, "./vendor/bezier.common.js"),
    },
    extensions: [".ts", ".tsx", ".js"],
  },
};
