const HtmlWebpackPlugin = require("html-webpack-plugin");
const ZipWebpackPlugin = require("zip-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ }],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  externals: {
    three: "THREE",
  },
  devServer: {
    host: "0.0.0.0",
    port: "8080",
    https: true,
    disableHostCheck: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new ZipWebpackPlugin({
      filename: "rhmoller-js13k-2020.zip",
    }),
  ],
};
