/* eslint-env node */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const postcssPresetEnv = require("postcss-preset-env");

const cssLoaders = [
  "style-loader",
  { loader: "css-loader", options: { importLoaders: 1 } },
  {
    loader: "postcss-loader",
    options: {
      ident: "postcss",
      plugins: () => [postcssPresetEnv(/* pluginOptions */)],
    },
  },
];

module.exports = {
  entry: "./src/index.ts",
  devServer: {
    contentBase: "./dist",
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new HtmlWebpackPlugin({
      template: "src/index.html",
    }),
  ],
  module: {
    rules: [
      {
        test: require.resolve("snapsvg/dist/snap.svg.js"),
        use: "imports-loader?this=>window,fix=>module.exports=0",
      },
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
      snapsvg: "snapsvg/dist/snap.svg.js",
    },
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
  },
};
