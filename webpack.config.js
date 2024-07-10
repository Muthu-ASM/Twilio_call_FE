const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/"),
      "net": require.resolve("net"),
      "tls": require.resolve("tls"),
      "util": require.resolve("util/"),
      
    }
  },
  module: {
    rules: [
      // your rules here...
    ],
  },
};
