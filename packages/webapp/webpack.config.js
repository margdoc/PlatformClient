const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  devtool: "cheap-module-eval-source-map",
  output: {
    path: path.resolve(__dirname, "dist")
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    symlinks: false,
    alias: {
      "api-client": path.resolve(__dirname, "..", "api-client"),
      "components": path.resolve(__dirname, "..", "components", "src"),
      "utils": path.resolve(__dirname, "..", "utils", "src"),
    }
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
        test: /\.less$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
          {
            loader: "less-loader",
            options: {
              javascriptEnabled: true,
              lessOptions: {
                strictMath: true,
                noIeCompat: true,
              },
            },
          },
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
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    publicPath: "/",
    historyApiFallback: {
      rewrites: [
        {
          from: new RegExp("^/"),
          to: "/index.html"
        }
      ]
    }
  },
  plugins: [
    new webpack.EnvironmentPlugin({
    }),
    new HtmlWebpackPlugin({
      template: "src/index.html"
    })
  ]
};
