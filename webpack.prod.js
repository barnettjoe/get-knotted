/* eslint-env node */
const path = require("path");
const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  plugins: [new MiniCssExtractPlugin()],
  mode: "production",
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: true,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: "ts-loader",
        exclude: /node_modules/,
        include: path.resolve(__dirname, "src"),
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        include: path.resolve(__dirname, "src"),
      },
    ],
  },
});
