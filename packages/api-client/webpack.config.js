const path = require("path");
const webpack = require("webpack");

module.exports = {
  devtool: "cheap-module-eval-source-map",
  output: {
    path: path.resolve(__dirname, "lib-umd"),
    libraryTarget: "umd",
    library: "UiToolkit",
    umdNamedDefine: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    symlinks: false,
    alias: {
      "utils": path.resolve(__dirname, "..", "utils", "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        options: {
          errorsAsWarnings: true
        }
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[path][name]__[local]"
              }
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin({}),
  ]
};
