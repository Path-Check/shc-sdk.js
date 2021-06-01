const path = require('path');

module.exports = {
  mode: "production",
  entry: "./lib/main.js",
  devtool: "source-map",
  output: {
    filename: 'shc.sdk.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'SHC',
    libraryTarget: 'umd',
  },
  target: 'web',
  optimization: {
    minimize: true
  },
  node: {
    net: 'empty',
  }
};